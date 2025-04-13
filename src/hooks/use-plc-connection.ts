
import { useState, useEffect, useCallback, useRef } from 'react';
import { Parameter, StatusType, PLCConnectionSettings, ParameterHistoryRecord } from '@/types/parameter';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { convertToParameter, fetchParameters as fetchParametersFromAPI, addParameterHistoryEntry } from '@/lib/parameters';

export function usePLCConnection() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<StatusType>('disconnected');
  const [plcSettings, setPlcSettings] = useState<PLCConnectionSettings>({
    ip: '192.168.1.1',
    port: '502',
    protocol: 'modbus',
    autoReconnect: true
  });
  
  const connectionAttemptRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const plcSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchParameters = useCallback(async () => {
    try {
      // Fetch parameters from Supabase
      const supabaseParams = await fetchParametersFromAPI();
      
      if (supabaseParams && supabaseParams.length > 0) {
        // Transform Supabase data to match Parameter type
        const formattedParams: Parameter[] = supabaseParams.map(p => convertToParameter(p));
        setParameters(formattedParams);
      } else {
        setParameters([]);
      }
    } catch (error) {
      console.error('Error in fetchParameters:', error);
      setParameters([]);
    }
  }, []);

  const saveParameterHistory = useCallback(async (parameter: Parameter) => {
    try {
      // Create a compatible record for the database
      const historyRecord: ParameterHistoryRecord = {
        parameter_id: parameter.id,
        value: parameter.value,
        status: parameter.status,
        timestamp: new Date().toISOString()
      };
      
      // Save history data
      await addParameterHistoryEntry(historyRecord);
    } catch (error) {
      console.error('Error in saveParameterHistory:', error);
    }
  }, []);

  const connectToPLC = useCallback(() => {
    // Prevent multiple connection attempts
    if (connectionAttemptRef.current) return;
    connectionAttemptRef.current = true;
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Load latest settings from localStorage
    const savedSettings = localStorage.getItem('plcSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setPlcSettings(parsedSettings);
      } catch (e) {
        console.error('Failed to parse PLC settings', e);
      }
    }
    
    setConnectionStatus('connecting');
    
    toast("Connecting to PLC", {
      description: `Attempting to connect to SAIL PLC at ${plcSettings.ip}:${plcSettings.port} using ${plcSettings.protocol.toUpperCase()}...`,
    });
    
    // Close existing WebSocket connection if any
    if (plcSocketRef.current) {
      plcSocketRef.current.close();
      plcSocketRef.current = null;
    }
    
    // For real PLC connection via Ethernet
    try {
      // Create a WebSocket connection to the PLC
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${plcSettings.ip}:${plcSettings.port}`;
      
      const socket = new WebSocket(wsUrl);
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          setConnectionStatus('disconnected');
          toast("Connection Timeout", {
            description: `Failed to connect to SAIL PLC at ${plcSettings.ip}. Connection timed out.`,
            variant: "destructive"
          });
          connectionAttemptRef.current = false;
          
          // Auto reconnect if enabled
          if (plcSettings.autoReconnect) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectToPLC();
            }, 10000); // Try to reconnect after 10 seconds
          }
        }
      }, 5000);
      
      socket.onopen = () => {
        clearTimeout(connectionTimeout);
        setConnectionStatus('normal');
        toast("Connected to PLC", {
          description: `Successfully connected to the SAIL PLC at ${plcSettings.ip}.`,
        });
        
        // Send a connection message with the selected protocol
        socket.send(JSON.stringify({
          type: 'connect',
          protocol: plcSettings.protocol,
        }));
        
        connectionAttemptRef.current = false;
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'parameters') {
            // Update parameters with the real data from PLC
            setParameters(prev => 
              prev.map(parameter => {
                const updatedParam = data.parameters.find((p: any) => p.id === parameter.id);
                if (updatedParam) {
                  let status: 'normal' | 'warning' | 'alarm' = 'normal';
                  
                  if (
                    (parameter.thresholds.alarm.min !== null && updatedParam.value < parameter.thresholds.alarm.min) ||
                    (parameter.thresholds.alarm.max !== null && updatedParam.value > parameter.thresholds.alarm.max)
                  ) {
                    status = 'alarm';
                  } else if (
                    (parameter.thresholds.warning.min !== null && updatedParam.value < parameter.thresholds.warning.min) ||
                    (parameter.thresholds.warning.max !== null && updatedParam.value > parameter.thresholds.warning.max)
                  ) {
                    status = 'warning';
                  }
                  
                  const updatedParameter = {
                    ...parameter,
                    value: updatedParam.value,
                    status,
                    timestamp: new Date().toISOString()
                  };
                  
                  // Save history for real parameters
                  saveParameterHistory(updatedParameter);
                  
                  return updatedParameter;
                }
                return parameter;
              })
            );
          }
        } catch (error) {
          console.error('Error processing message from PLC:', error);
        }
      };
      
      socket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        toast("Connection Failed", {
          description: `Failed to connect to SAIL PLC at ${plcSettings.ip}. Please check connection settings and ensure Ethernet is connected.`,
          variant: "destructive"
        });
        connectionAttemptRef.current = false;
        
        // Auto reconnect if enabled
        if (plcSettings.autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToPLC();
          }, 10000); // Try to reconnect after 10 seconds
        }
      };
      
      socket.onclose = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection closed');
        setConnectionStatus('disconnected');
        connectionAttemptRef.current = false;
        
        // Auto reconnect if enabled
        if (plcSettings.autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToPLC();
          }, 10000); // Try to reconnect after 10 seconds
        }
      };
      
      plcSocketRef.current = socket;
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      setConnectionStatus('disconnected');
      toast("Connection Failed", {
        description: `Failed to connect to SAIL PLC at ${plcSettings.ip}. Please check connection settings and ensure Ethernet is connected.`,
        variant: "destructive"
      });
      connectionAttemptRef.current = false;
      
      // Auto reconnect if enabled
      if (plcSettings.autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToPLC();
        }, 10000); // Try to reconnect after 10 seconds
      }
    }
  }, [plcSettings, saveParameterHistory]);

  // Set up Supabase realtime subscription for parameter changes
  useEffect(() => {
    // Clean up previous subscription if it exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const channel = supabase
      .channel('public:parameters')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parameters' 
      }, () => {
        // Debounce multiple rapid updates
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchParameters();
        }, 1000);
      })
      .subscribe();
    
    subscriptionRef.current = channel;
      
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [fetchParameters]);

  // Save parameter history on value change
  useEffect(() => {
    if (parameters.length === 0 || connectionStatus !== 'normal') return;
    
    // Only periodically save history if we're not connected to a real PLC
    if (!plcSocketRef.current) {
      // For each parameter, periodically save a history entry
      const historyInterval = setInterval(() => {
        parameters.forEach(parameter => {
          saveParameterHistory(parameter);
        });
      }, 60000); // Save history every minute
      
      return () => {
        clearInterval(historyInterval);
      };
    }
    
    return () => {};
  }, [parameters, connectionStatus, saveParameterHistory]);

  // This effect simulates data only when not connected to a real PLC
  useEffect(() => {
    // Clear any existing update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    // Only simulate data if we're in 'normal' status but don't have a real PLC connection
    // and we have parameters to update
    if (connectionStatus === 'normal' && parameters.length > 0 && !plcSocketRef.current) {
      console.log("Starting parameter simulation mode - connect Ethernet for real PLC data");
      
      const updateInterval = setInterval(() => {
        setParameters(prev => 
          prev.map(parameter => {
            const change = (Math.random() - 0.5) * 0.01; // Very small change for stability
            const newValue = parameter.value * (1 + change);
            
            let status: 'normal' | 'warning' | 'alarm' = 'normal';
            
            if (
              (parameter.thresholds.alarm.min !== null && newValue < parameter.thresholds.alarm.min) ||
              (parameter.thresholds.alarm.max !== null && newValue > parameter.thresholds.alarm.max)
            ) {
              status = 'alarm';
            } else if (
              (parameter.thresholds.warning.min !== null && newValue < parameter.thresholds.warning.min) ||
              (parameter.thresholds.warning.max !== null && newValue > parameter.thresholds.warning.max)
            ) {
              status = 'warning';
            }
            
            return {
              ...parameter,
              value: Number(newValue.toFixed(2)),
              status,
              timestamp: new Date().toISOString()
            };
          })
        );
      }, 30000); // Update every 30 seconds for simulation
      
      updateIntervalRef.current = updateInterval;
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [connectionStatus, parameters]);

  // Connect to PLC on component mount
  useEffect(() => {
    fetchParameters();
    
    const initialConnectionTimeout = setTimeout(() => {
      connectToPLC();
    }, 1000);
    
    return () => {
      clearTimeout(initialConnectionTimeout);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (plcSocketRef.current) {
        plcSocketRef.current.close();
        plcSocketRef.current = null;
      }
    };
  }, [connectToPLC, fetchParameters]);

  return {
    parameters,
    setParameters,
    connectionStatus,
    plcSettings,
    connectToPLC,
    fetchParameters
  };
}
