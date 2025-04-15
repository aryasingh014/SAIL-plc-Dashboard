
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
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  
  const connectionAttemptRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const plcSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offlineDataRef = useRef<Parameter[]>([]);

  // Check for offline mode
  useEffect(() => {
    const checkNetworkStatus = () => {
      const isOnline = navigator.onLine;
      setIsOfflineMode(!isOnline);
      
      if (!isOnline) {
        // Load cached parameters from localStorage if available
        const cachedParams = localStorage.getItem('cachedParameters');
        if (cachedParams) {
          try {
            const parsed = JSON.parse(cachedParams);
            offlineDataRef.current = parsed;
            setParameters(parsed);
            setConnectionStatus('normal'); // Show as normal even though we're offline
            toast("Offline Mode", {
              description: "Running in offline mode with cached data. Connect to network for real-time updates."
            });
          } catch (e) {
            console.error('Failed to parse cached parameters', e);
          }
        }
      }
    };
    
    // Check initial status
    checkNetworkStatus();
    
    // Set up event listeners for network status changes
    window.addEventListener('online', () => {
      setIsOfflineMode(false);
      toast("Online Mode", {
        description: "Network connection restored. Reconnecting to PLC..."
      });
      connectToPLC(); // Try to reconnect when we go back online
    });
    
    window.addEventListener('offline', () => {
      setIsOfflineMode(true);
      if (plcSocketRef.current) {
        plcSocketRef.current.close();
        plcSocketRef.current = null;
      }
      
      // Load cached data if available
      const cachedParams = localStorage.getItem('cachedParameters');
      if (cachedParams) {
        try {
          const parsed = JSON.parse(cachedParams);
          offlineDataRef.current = parsed;
          setParameters(parsed);
        } catch (e) {
          console.error('Failed to parse cached parameters', e);
        }
      }
      
      toast("Offline Mode", {
        description: "Network connection lost. Running in offline mode with cached data."
      });
    });
    
    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  const fetchParameters = useCallback(async () => {
    try {
      // If we're offline, use cached data
      if (isOfflineMode) {
        if (offlineDataRef.current.length > 0) {
          setParameters(offlineDataRef.current);
          return;
        }
        return;
      }
      
      // Fetch parameters from Supabase
      const supabaseParams = await fetchParametersFromAPI();
      
      if (supabaseParams && supabaseParams.length > 0) {
        // Transform Supabase data to match Parameter type
        const formattedParams: Parameter[] = supabaseParams.map(p => convertToParameter(p));
        setParameters(formattedParams);
        
        // Cache parameters for offline use
        localStorage.setItem('cachedParameters', JSON.stringify(formattedParams));
        offlineDataRef.current = formattedParams;
      } else {
        setParameters([]);
      }
    } catch (error) {
      console.error('Error in fetchParameters:', error);
      
      // If we're offline or can't connect, try to use cached data
      const cachedParams = localStorage.getItem('cachedParameters');
      if (cachedParams) {
        try {
          const parsed = JSON.parse(cachedParams);
          setParameters(parsed);
          offlineDataRef.current = parsed;
        } catch (e) {
          console.error('Failed to parse cached parameters', e);
          setParameters([]);
        }
      } else {
        setParameters([]);
      }
    }
  }, [isOfflineMode]);

  const saveParameterHistory = useCallback(async (parameter: Parameter) => {
    try {
      // If offline, store in localStorage for later sync
      if (isOfflineMode) {
        const offlineHistory = localStorage.getItem('offlineParameterHistory') || '[]';
        try {
          const historyArray = JSON.parse(offlineHistory);
          historyArray.push({
            parameter_id: parameter.id,
            value: parameter.value,
            status: parameter.status,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('offlineParameterHistory', JSON.stringify(historyArray));
        } catch (e) {
          console.error('Failed to update offline history', e);
        }
        return;
      }
      
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
  }, [isOfflineMode]);

  const connectToPLC = useCallback(() => {
    // If offline, don't try to connect
    if (isOfflineMode) {
      setConnectionStatus('normal'); // Pretend we're connected to show data
      toast("Offline Mode", {
        description: "Running in offline mode with cached data. Connect to network for real-time PLC data."
      });
      return;
    }
    
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
            description: `Failed to connect to SAIL PLC at ${plcSettings.ip}. Connection timed out.`
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
            
            // Cache updated parameters for offline mode
            localStorage.setItem('cachedParameters', JSON.stringify(parameters));
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
          description: `Failed to connect to SAIL PLC at ${plcSettings.ip}. Please check connection settings and ensure Ethernet is connected.`
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
        description: `Failed to connect to SAIL PLC at ${plcSettings.ip}. Please check connection settings and ensure Ethernet is connected.`
      });
      connectionAttemptRef.current = false;
      
      // Auto reconnect if enabled
      if (plcSettings.autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToPLC();
        }, 10000); // Try to reconnect after 10 seconds
      }
    }
  }, [plcSettings, saveParameterHistory, isOfflineMode, parameters]);

  // Set up Supabase realtime subscription for parameter changes
  useEffect(() => {
    // Only set up subscription if online
    if (isOfflineMode) return;
    
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
  }, [fetchParameters, isOfflineMode]);

  // Save parameter history on value change
  useEffect(() => {
    if (parameters.length === 0 || (connectionStatus !== 'normal' && !isOfflineMode)) return;
    
    // Only periodically save history if we're not connected to a real PLC
    if (!plcSocketRef.current || isOfflineMode) {
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
  }, [parameters, connectionStatus, saveParameterHistory, isOfflineMode]);

  // This effect simulates data only when not connected to a real PLC
  useEffect(() => {
    // Clear any existing update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    // Only simulate data if we're in 'normal' status but don't have a real PLC connection
    // and we have parameters to update
    if ((connectionStatus === 'normal' || isOfflineMode) && parameters.length > 0 && !plcSocketRef.current) {
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
  }, [connectionStatus, parameters, isOfflineMode]);

  // Sync offline history when coming back online
  useEffect(() => {
    if (!isOfflineMode && connectionStatus === 'normal') {
      // Check if we have offline history to sync
      const offlineHistory = localStorage.getItem('offlineParameterHistory');
      if (offlineHistory) {
        try {
          const historyArray = JSON.parse(offlineHistory);
          if (historyArray.length > 0) {
            // Process offline history in batches
            const syncHistory = async () => {
              console.log(`Syncing ${historyArray.length} offline history records`);
              
              for (const record of historyArray) {
                await addParameterHistoryEntry(record);
              }
              
              // Clear offline history after successful sync
              localStorage.removeItem('offlineParameterHistory');
              toast("History Synced", {
                description: `Successfully synced ${historyArray.length} history records from offline mode.`
              });
            };
            
            syncHistory();
          }
        } catch (e) {
          console.error('Failed to sync offline history', e);
        }
      }
    }
  }, [isOfflineMode, connectionStatus]);

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
    fetchParameters,
    isOfflineMode
  };
}
