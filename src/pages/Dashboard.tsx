
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import StatusIndicator from '@/components/StatusIndicator';
import { mockAlerts } from '@/data/mockData';
import { RefreshCw } from 'lucide-react';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import ParameterSelector from '@/components/dashboard/ParameterSelector';
import ParameterGrid from '@/components/dashboard/ParameterGrid';
import { usePLCConnection } from '@/hooks/use-plc-connection';
import { useSystemStatus } from '@/hooks/use-system-status';
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const { parameters, connectionStatus, plcSettings, connectToPLC, fetchParameters } = usePLCConnection();
  const systemStatus = useSystemStatus(parameters, connectionStatus);
  
  // Set initial selected parameters when parameters are loaded
  useEffect(() => {
    if (parameters.length > 0 && selectedParameters.length === 0) {
      setSelectedParameters(parameters.slice(0, 4).map(p => p.id));
    } else if (parameters.length === 0) {
      setSelectedParameters([]);
    } else {
      // Filter out any selected parameters that no longer exist
      setSelectedParameters(prev => 
        prev.filter(id => parameters.some(p => p.id === id))
      );
    }
  }, [parameters]);
  
  const toggleParameterSelection = (parameterId: string) => {
    setSelectedParameters(prev => {
      if (prev.includes(parameterId)) {
        return prev.filter(id => id !== parameterId);
      } else {
        return [...prev, parameterId];
      }
    });
  };
  
  const filteredParameters = parameters.filter(p => selectedParameters.includes(p.id));
  const unacknowledgedAlerts = mockAlerts.filter(alert => !alert.acknowledged).length;

  const handleRefreshConnection = () => {
    connectToPLC();
  };

  // Add a refresh effect to update parameters regularly
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      if (connectionStatus === 'normal') {
        fetchParameters();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshTimer);
  }, [connectionStatus, fetchParameters]);

  // Subscribe to real-time parameter changes
  useEffect(() => {
    const channel = supabase
      .channel('public:parameters')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'parameters'
      }, () => {
        fetchParameters();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchParameters]);

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

        <DashboardStatsCards 
          connectionStatus={connectionStatus}
          parameters={parameters}
          plcSettings={plcSettings}
          unacknowledgedAlerts={unacknowledgedAlerts}
        />

        {parameters.length > 0 ? (
          <>
            <ParameterSelector 
              parameters={parameters}
              selectedParameters={selectedParameters}
              toggleParameterSelection={toggleParameterSelection}
            />

            <ParameterGrid parameters={filteredParameters} />
          </>
        ) : (
          <div className="text-center p-8 bg-muted rounded-lg">
            <h3 className="text-lg font-medium">No parameters available</h3>
            <p className="text-muted-foreground">
              Please add parameters in the Parameters section to monitor them.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.href = '/parameters'}
            >
              Go to Parameters
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
