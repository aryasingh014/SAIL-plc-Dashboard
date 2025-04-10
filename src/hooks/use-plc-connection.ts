
import { useState, useEffect, useCallback } from 'react';
import { Parameter, StatusType, PLCConnectionSettings } from '@/types/parameter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { convertToParameter } from '@/lib/parameters';

export function usePLCConnection() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<StatusType>('disconnected');
  const [plcSettings, setPlcSettings] = useState<PLCConnectionSettings>({
    ip: '198.162.0.1',
    port: '102',
    protocol: 'opcua',
    autoReconnect: true
  });
  const { toast } = useToast();

  const connectToPLC = useCallback(() => {
    const savedSettings = localStorage.getItem('plcSettings');
    if (savedSettings) {
      setPlcSettings(JSON.parse(savedSettings));
    }
    
    setConnectionStatus('connecting');
    
    toast({
      title: "Connecting to PLC",
      description: `Attempting to connect to PLC at ${plcSettings.ip}:${plcSettings.port} using ${plcSettings.protocol.toUpperCase()}...`,
    });
    
    // Simulate connection
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
    }, 3000);
    
    return () => clearTimeout(connectionTimer);
  }, [plcSettings, toast]);

  const fetchParameters = async () => {
    try {
      // First try to fetch real parameters from Supabase
      const { data: supabaseParams, error } = await supabase
        .from('parameters')
        .select('*');
      
      console.log('Fetched parameters:', supabaseParams);
      
      if (error) {
        console.error('Error fetching parameters from Supabase:', error);
        // Fallback to mock data if there's an error
        const mockParams = getAllParameters();
        setParameters(mockParams);
        return;
      }
      
      if (supabaseParams && supabaseParams.length > 0) {
        // Transform Supabase data to match Parameter type
        const formattedParams: Parameter[] = supabaseParams.map(p => convertToParameter(p));
        setParameters(formattedParams);
      } else {
        // Fallback to mock data if no parameters found
        const mockParams = getAllParameters();
        setParameters(mockParams);
      }
    } catch (error) {
      console.error('Error in fetchParameters:', error);
      // Fallback to mock data on any error
      const mockParams = getAllParameters();
      setParameters(mockParams);
    }
  };

  useEffect(() => {
    if (connectionStatus !== 'normal') return;
    
    const updateInterval = setInterval(() => {
      setParameters(prev => 
        prev.map(parameter => {
          const change = (Math.random() - 0.5) * 0.1;
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
            value: Number(newValue.toFixed(1)),
            status,
            timestamp: new Date().toISOString()
          };
        })
      );
    }, 5000);
    
    return () => clearInterval(updateInterval);
  }, [connectionStatus]);

  // Connect to PLC on component mount
  useEffect(() => {
    connectToPLC();
  }, [connectToPLC]);

  return {
    parameters,
    setParameters,
    connectionStatus,
    plcSettings,
    connectToPLC
  };
}

// Import this from mockData to avoid circular dependencies
const getAllParameters = () => {
  // This is just a placeholder that should be replaced by the actual import
  // We're doing this to avoid circular dependencies
  try {
    return require('@/data/mockData').getAllParameters();
  } catch (e) {
    console.error('Error importing mock data:', e);
    return [];
  }
};
