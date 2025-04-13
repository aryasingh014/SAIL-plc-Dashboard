
import { useState, useEffect, useCallback, useRef } from 'react';
import { Parameter, StatusType, PLCConnectionSettings, ParameterHistoryRecord } from '@/types/parameter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { convertToParameter, fetchParameters as fetchParametersFromAPI } from '@/lib/parameters';

export function usePLCConnection() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<StatusType>('disconnected');
  const [plcSettings, setPlcSettings] = useState<PLCConnectionSettings>({
    ip: '192.168.1.1',
    port: '502',
    protocol: 'modbus',
    autoReconnect: true
  });
  const { toast } = useToast();
  const connectionAttemptRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const plcSocketRef = useRef<WebSocket | null>(null);

  const fetchParameters = useCallback(async () => {
    try {
      // Fetch parameters from Supabase
      const supabaseParams = await fetchParametersFromAPI();
      
      if (supabaseParams && supabaseParams.length > 0) {
        // Transform Supabase data to match Parameter type
        const formattedParams: Parameter[] = supabaseParams.map(p => convertToParameter(p));
        setParameters(formattedParams);
      } else {
        // If no parameters found, set empty array
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
      
      // Using parameters table directly to avoid table creation issues
      // This stores history data in the same table with a reference to the parameter
      const { error } = await supabase
        .from('parameters')
        .insert({
          name: `history_${parameter.name}`,
          value: parameter.value,
          unit: parameter.unit,
          status: parameter.status,
          user_id: parameter.id, // Use this field to reference the original parameter
          min_value: null,
          max_value: null
        });
        
      if (error) {
        console.error('Error saving parameter history:', error);
      }
    } catch (error) {
      console.error('Error in saveParameterHistory:', error);
    }
  }, []);

  const connectToPLC = useCallback(() => {
    // Prevent multiple connection attempts
    if (connectionAttemptRef.current) return;
    connectionAttemptRef.current = true;
    
    const savedSettings = localStorage.getItem('plcSettings');
    if (savedSettings) {
      try {
        setPlcSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse PLC settings', e);
      }
    }
    
    setConnectionStatus('connecting');
    
    toast({
      title: "Connecting to PLC",
      description: `Attempting to connect to PLC at ${plcSettings.ip}:${plcSettings.port} using ${plcSettings.protocol.toUpperCase()}...`,
    });
    
    // Close existing WebSocket connection if any
    if (plcSocketRef.current) {
      plcSocketRef.current.close();
      plcSocketRef.current = null;
    }
    
    // For real PLC connection, we would use a WebSocket or a dedicated library
    // This is a simplified example using WebSocket
    try {
      // In a real implementation, you would use an actual endpoint
      // The URL below is just a placeholder for demonstration
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${plcSettings.ip}:${plcSettings.port}`;
      
      // Create a WebSocket connection
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        setConnectionStatus('normal');
        toast({
          title: "Connected to PLC",
          description: `Successfully established connection to the PLC at ${plcSettings.ip}.`,
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
                  
                  return {
                    ...parameter,
                    value: updatedParam.value,
                    status,
                    timestamp: new Date().toISOString()
                  };
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
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: `Failed to connect to PLC at ${plcSettings.ip}. Please check connection settings.`,
        });
        connectionAttemptRef.current = false;
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionStatus('disconnected');
        connectionAttemptRef.current = false;
        
        // Auto reconnect if enabled
        if (plcSettings.autoReconnect) {
          setTimeout(() => {
            connectToPLC();
          }, 5000); // Try to reconnect after 5 seconds
        }
      };
      
      plcSocketRef.current = socket;
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      setConnectionStatus('disconnected');
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: `Failed to connect to PLC at ${plcSettings.ip}. Please check connection settings.`,
      });
      connectionAttemptRef.current = false;
    }
  }, [plcSettings, toast, fetchParameters]);

  // Set up Supabase realtime subscription for parameter changes
  useEffect(() => {
    // Clean up previous subscription if it exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    const channel = supabase
      .channel('public:parameters')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parameters' 
      }, (payload) => {
        console.log('Database change detected:', payload);
        
        // Debounce multiple rapid updates
        const debounceTimer = setTimeout(() => {
          fetchParameters();
        }, 500);
        
        return () => clearTimeout(debounceTimer);
      })
      .subscribe();
    
    subscriptionRef.current = channel;
      
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [fetchParameters]);

  // Save parameter history on value change
  useEffect(() => {
    if (parameters.length === 0 || connectionStatus !== 'normal') return;
    
    // For each parameter, periodically save a history entry
    const historyInterval = setInterval(() => {
      parameters.forEach(parameter => {
        saveParameterHistory(parameter);
      });
    }, 60000); // Save history every minute instead of on every update
    
    return () => {
      clearInterval(historyInterval);
    };
  }, [parameters, connectionStatus, saveParameterHistory]);

  // This effect updates parameter values with simulated data when real PLC is not connected
  useEffect(() => {
    // Clear any existing update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    // Only simulate data if we're not connected to a real PLC and we have parameters
    if (connectionStatus === 'normal' && parameters.length > 0 && !plcSocketRef.current) {
      const updateInterval = setInterval(() => {
        setParameters(prev => 
          prev.map(parameter => {
            const change = (Math.random() - 0.5) * 0.02; // Even smaller change amount
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
      }, 20000); // Increased interval to 20 seconds for more stability
      
      updateIntervalRef.current = updateInterval;
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [connectionStatus, parameters]);

  // Connect to PLC on component mount, but only once
  useEffect(() => {
    fetchParameters();
    
    const initialConnectionTimeout = setTimeout(() => {
      connectToPLC();
    }, 1000);
    
    return () => {
      clearTimeout(initialConnectionTimeout);
      
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
