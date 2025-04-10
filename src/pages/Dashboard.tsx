
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusIndicator, { StatusType } from '@/components/StatusIndicator';
import ParameterCard from '@/components/ParameterCard';
import { getAllParameters, mockAlerts } from '@/data/mockData';
import { Parameter, PLCConnectionSettings } from '@/types/parameter';
import { CheckCircle, AlertTriangle, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
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
        setSelectedParameters(mockParams.slice(0, 4).map(p => p.id));
        return;
      }
      
      if (supabaseParams && supabaseParams.length > 0) {
        // Transform Supabase data to match Parameter type
        const formattedParams: Parameter[] = supabaseParams.map(p => ({
          id: p.id,
          name: p.name,
          description: `${p.name} parameter`,
          unit: p.unit || '',
          value: p.value,
          status: p.status || 'normal',
          thresholds: {
            warning: {
              min: p.min_value || null,
              max: p.max_value || null
            },
            alarm: {
              min: p.min_value ? p.min_value * 0.9 : null,
              max: p.max_value ? p.max_value * 1.1 : null
            }
          },
          timestamp: p.updated_at || new Date().toISOString(),
          category: 'Custom'
        }));
        
        setParameters(formattedParams);
        setSelectedParameters(formattedParams.map(p => p.id));
      } else {
        // Fallback to mock data if no parameters found
        const mockParams = getAllParameters();
        setParameters(mockParams);
        setSelectedParameters(mockParams.slice(0, 4).map(p => p.id));
      }
    } catch (error) {
      console.error('Error in fetchParameters:', error);
      // Fallback to mock data on any error
      const mockParams = getAllParameters();
      setParameters(mockParams);
      setSelectedParameters(mockParams.slice(0, 4).map(p => p.id));
    }
  };

  useEffect(() => {
    connectToPLC();
  }, [connectToPLC]);
  
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
  
  const calculateSystemStatus = (): StatusType => {
    if (connectionStatus === 'disconnected') return 'disconnected';
    if (connectionStatus === 'connecting') return 'connecting';
    
    if (parameters.some(p => p.status === 'alarm')) {
      return 'alarm';
    }
    
    if (parameters.some(p => p.status === 'warning')) {
      return 'warning';
    }
    
    return 'normal';
  };
  
  const toggleParameterSelection = (parameterId: string) => {
    setSelectedParameters(prev => {
      if (prev.includes(parameterId)) {
        return prev.filter(id => id !== parameterId);
      } else {
        return [...prev, parameterId];
      }
    });
  };
  
  const systemStatus = calculateSystemStatus();
  const filteredParameters = parameters.filter(p => selectedParameters.includes(p.id));
  const unacknowledgedAlerts = mockAlerts.filter(alert => !alert.acknowledged).length;

  const handleRefreshConnection = () => {
    connectToPLC();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <StatusIndicator 
              status={systemStatus} 
              label={`System Status: ${systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}`}
              size="lg"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefreshConnection}
              title="Refresh PLC Connection"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium">Connection</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-center space-x-2">
                <StatusIndicator status={connectionStatus} />
                <span className="text-2xl font-bold">
                  {connectionStatus === 'normal' ? 'Online' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                PLC IP: {plcSettings.ip}:{plcSettings.port} ({plcSettings.protocol.toUpperCase()})
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium">Parameters</CardTitle>
              <CheckCircle className="h-4 w-4 text-industrial-status-normal" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-bold">
                {parameters.filter(p => p.status === 'normal').length}
                <span className="text-sm text-muted-foreground ml-2">Normal</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-industrial-status-warning" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-bold">
                {parameters.filter(p => p.status === 'warning').length}
                <span className="text-sm text-muted-foreground ml-2">Parameters</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-medium">Alarms</CardTitle>
              <AlertCircle className="h-4 w-4 text-industrial-status-alarm" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-bold">
                {parameters.filter(p => p.status === 'alarm').length}
                <span className="text-sm text-muted-foreground ml-2">Parameters</span>
              </div>
              {unacknowledgedAlerts > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {unacknowledgedAlerts} unacknowledged
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Selected Parameters</h2>
          <div className="flex flex-wrap gap-2">
            {parameters.map(parameter => (
              <Button 
                key={parameter.id}
                variant={selectedParameters.includes(parameter.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleParameterSelection(parameter.id)}
                className={selectedParameters.includes(parameter.id) ? "bg-industrial-blue hover:bg-industrial-blue-light" : ""}
              >
                {parameter.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredParameters.map(parameter => (
            <ParameterCard 
              key={parameter.id} 
              parameter={parameter} 
            />
          ))}
          
          {filteredParameters.length === 0 && (
            <div className="col-span-full text-center p-8">
              <h3 className="text-lg font-medium">No parameters selected</h3>
              <p className="text-muted-foreground">
                Please select parameters to monitor from the list above.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
