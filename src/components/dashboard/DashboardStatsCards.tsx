
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusIndicator, { StatusType } from '@/components/StatusIndicator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, AlertCircle, Database } from 'lucide-react';
import { Parameter, PLCConnectionSettings } from '@/types/parameter';

interface DashboardStatsCardsProps {
  connectionStatus: StatusType;
  parameters: Parameter[];
  plcSettings: PLCConnectionSettings;
  unacknowledgedAlerts: number;
}

const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({
  connectionStatus,
  parameters,
  plcSettings,
  unacknowledgedAlerts
}) => {
  return (
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
  );
};

export default DashboardStatsCards;
