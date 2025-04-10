
import React, { useState } from 'react';
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

const Dashboard = () => {
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const { parameters, connectionStatus, plcSettings, connectToPLC } = usePLCConnection();
  const systemStatus = useSystemStatus(parameters, connectionStatus);
  
  // Set initial selected parameters when parameters are loaded
  React.useEffect(() => {
    if (parameters.length > 0 && selectedParameters.length === 0) {
      setSelectedParameters(parameters.slice(0, 4).map(p => p.id));
    }
  }, [parameters, selectedParameters.length]);
  
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

        <ParameterSelector 
          parameters={parameters}
          selectedParameters={selectedParameters}
          toggleParameterSelection={toggleParameterSelection}
        />

        <ParameterGrid parameters={filteredParameters} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
