import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import StatusIndicator from '@/components/StatusIndicator';
import OfflineIndicator from '@/components/OfflineIndicator';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    if (parameters.length > 0 && selectedParameters.length === 0) {
      setSelectedParameters(parameters.slice(0, 4).map(p => p.id));
    } else if (parameters.length > 0) {
      setSelectedParameters(prev => 
        prev.filter(id => parameters.some(p => p.id === id))
      );
    }
  }, [parameters, selectedParameters.length]);
  
  const toggleParameterSelection = useCallback((parameterId: string) => {
    setSelectedParameters(prev => {
      if (prev.includes(parameterId)) {
        return prev.filter(id => id !== parameterId);
      } else {
        return [...prev, parameterId];
      }
    });
  }, []);
  
  const filteredParameters = parameters.filter(p => selectedParameters.includes(p.id));
  const unacknowledgedAlerts = mockAlerts.filter(alert => !alert.acknowledged).length;

  const handleRefreshConnection = () => {
    setIsRefreshing(true);
    connectToPLC();
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 3000); 
  };

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      if (connectionStatus === 'normal') {
        fetchParameters();
      }
    }, 60000);
    
    return () => clearInterval(refreshTimer);
  }, [connectionStatus, fetchParameters]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const channel = supabase
      .channel('public:parameters')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'parameters'
      }, () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fetchParameters();
        }, 1000);
      })
      .subscribe();

    return () => {
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [fetchParameters]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <OfflineIndicator />
            <StatusIndicator 
              status={systemStatus} 
              label={`System Status: ${systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}`}
              size="lg"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefreshConnection}
              disabled={isRefreshing}
              title="Refresh PLC Connection"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
