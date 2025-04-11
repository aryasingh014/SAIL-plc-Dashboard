
import { useState, useEffect, useCallback, useRef } from 'react';
import { Parameter, StatusType, PLCConnectionSettings } from '@/types/parameter';
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

  const connectToPLC = useCallback(() => {
    // Prevent multiple connection attempts
    if (connectionAttemptRef.current) return;
    connectionAttemptRef.current = true;
    
    const savedSettings = localStorage.getItem('plcSettings');
    if (savedSettings) {
      setPlcSettings(JSON.parse(savedSettings));
    }
    
    setConnectionStatus('connecting');
    
    toast({
      title: "Connecting to PLC",
      description: `Attempting to connect to PLC at ${plcSettings.ip}:${plcSettings.port} using ${plcSettings.protocol.toUpperCase()}...`,
    });
    
    // Simulate connection with a stable timeout
    const connectionTimer = setTimeout(() => {
      const randomSuccess = Math.random() > 0.2;
      
      if (randomSuccess) {
        setConnectionStatus('normal');
        fetchParameters();
        
        toast({
          title: "Connected to PLC",
          description: `Successfully established connection to the PLC at ${plcSettings.ip}.`,
        });
      } else {
        setConnectionStatus('disconnected');
        
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: `Failed to connect to PLC at ${plcSettings.ip}. Please check connection settings.`,
        });
      }
      
      // Reset connection attempt flag after completion
      connectionAttemptRef.current = false;
    }, 3000);
    
    return () => {
      clearTimeout(connectionTimer);
      connectionAttemptRef.current = false;
    };
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
        
        // Refetch all parameters when any change occurs
        fetchParameters();
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
    const saveParameterHistory = async () => {
      if (parameters.length === 0) return;
      
      try {
        // For each parameter, save a history entry
        for (const parameter of parameters) {
          const historyEntry = {
            parameter_id: parameter.id,
            value: parameter.value,
            status: parameter.status,
            timestamp: new Date().toISOString()
          };
          
          // Save to 'parameter_history' table in Supabase
          const { error } = await supabase
            .from('parameter_history')
            .insert(historyEntry)
            .select();
            
          if (error) {
            console.error('Error saving parameter history:', error);
          }
        }
      } catch (error) {
        console.error('Error in saveParameterHistory:', error);
      }
    };
    
    // Save history every time parameters change and connection is normal
    if (connectionStatus === 'normal' && parameters.length > 0) {
      saveParameterHistory();
    }
  }, [parameters, connectionStatus]);

  // This effect updates parameter values with simulated data
  useEffect(() => {
    // Clear any existing update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    if (connectionStatus !== 'normal' || parameters.length === 0) return;
    
    const updateInterval = setInterval(() => {
      setParameters(prev => 
        prev.map(parameter => {
          const change = (Math.random() - 0.5) * 0.05; // Reduced change amount to prevent erratic updates
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
    }, 10000); // Increased interval to 10 seconds for more stability
    
    updateIntervalRef.current = updateInterval;
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [connectionStatus, parameters]);

  // Connect to PLC on component mount, but only once
  useEffect(() => {
    connectToPLC();
    
    // Initial fetch regardless of connection status
    fetchParameters();
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
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
