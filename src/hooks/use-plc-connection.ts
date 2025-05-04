import { useState, useEffect, useCallback, useRef } from 'react';
import { Parameter, StatusType, PLCConnectionSettings, ParameterHistoryRecord } from '@/types/parameter';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { convertToParameter, fetchParameters as fetchParametersFromAPI, addParameterHistoryEntry } from '@/lib/parameters';
import { mockParameters } from '@/data/mockData';

export function usePLCConnection() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<StatusType>('disconnected');
  const [plcSettings, setPlcSettings] = useState<PLCConnectionSettings>({
    ip: '',
    port: '',
    protocol: 'modbus',
    autoReconnect: false
  });
  
  const connectionAttemptRef = useRef(false);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const plcSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationShownRef = useRef(false);

  const fetchParameters = useCallback(async () => {
    try {
      // Fetch parameters from Supabase
      const supabaseParams = await fetchParametersFromAPI();
      
      if (supabaseParams && supabaseParams.length > 0) {
        // Transform Supabase data to match Parameter type
        const formattedParams: Parameter[] = supabaseParams.map(p => convertToParameter(p));
        setParameters(formattedParams);
      } else {
        // Use mock data if no data in database and we're "connected"
        if (connectionStatus === 'normal') {
          // Create a deep copy of mockParameters to avoid mutation issues
          const demoParams = JSON.parse(JSON.stringify(mockParameters));
          // Update timestamps to be current
          demoParams.forEach((param: Parameter) => {
            param.timestamp = new Date().toISOString();
          });
          setParameters(demoParams);
        } else {
          setParameters([]);
        }
      }
    } catch (error) {
      console.error('Error in fetchParameters:', error);
      // Use mock data if error occurred and we're "connected"
      if (connectionStatus === 'normal') {
        setParameters(JSON.parse(JSON.stringify(mockParameters)));
      } else {
        setParameters([]);
      }
    }
  }, [connectionStatus]);

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
    
    // Reset notification shown flag
    notificationShownRef.current = false;
    
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
    
    // Only show toast if we haven't already shown one
    if (!notificationShownRef.current) {
      toast("Connecting to PLC", {
        description: `Attempting to connect to ${plcSettings.protocol.toUpperCase()} PLC...`,
      });
      notificationShownRef.current = true;
    }
    
    // Close existing WebSocket connection if any
    if (plcSocketRef.current) {
      plcSocketRef.current.close();
      plcSocketRef.current = null;
    }
    
    // For demo purposes, simulate successful connection after a brief delay
    setTimeout(() => {
      setConnectionStatus('normal');
      
      if (!notificationShownRef.current) {
        toast("Connected to PLC", {
          description: `Successfully connected to the PLC in demo mode.`,
        });
        notificationShownRef.current = true;
      }
      
      // Fetch parameters immediately after "connecting"
      fetchParameters();
      
      connectionAttemptRef.current = false;
    }, 1500);
  }, [plcSettings, fetchParameters]);

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
      console.log("Starting parameter simulation mode - using SAIL demo data");
      
      const updateInterval = setInterval(() => {
        setParameters(prev => 
          prev.map(parameter => {
            // Custom variation for each parameter type
            let change = (Math.random() - 0.5) * 0.02; // Default small change
            
            // Larger variations for certain parameter types
            if (parameter.category === 'Mechanical' || parameter.category === 'Vibration') {
              change = (Math.random() - 0.5) * 0.05;
            }
            // Occasional spikes for temperature and pressure
            else if ((parameter.category === 'Temperature' || parameter.category === 'Pressure') && Math.random() > 0.95) {
              change = (Math.random() - 0.5) * 0.1;
            }
            
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
      }, 15000); // Update every 15 seconds for more dynamic visualization
      
      updateIntervalRef.current = updateInterval;
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [connectionStatus, parameters]);

  // Initialize by fetching parameters but NOT automatically connecting
  useEffect(() => {
    // Don't fetch when first mounting - wait for user to connect
    
    return () => {
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
  }, [fetchParameters]);

  return {
    parameters,
    setParameters,
    connectionStatus,
    plcSettings,
    connectToPLC,
    fetchParameters
  };
}
