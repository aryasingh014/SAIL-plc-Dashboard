
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from '@/context/AuthContext';
import ConnectionSettings from '@/components/settings/ConnectionSettings';
import DataCollectionSettings from '@/components/settings/DataCollectionSettings';
import UserManagement from '@/components/settings/UserManagement';
import AccessDenied from '@/components/settings/AccessDenied';
import LoadingSettings from '@/components/settings/LoadingSettings';
import { PLCConnectionSettings } from '@/types/parameter';

const Settings = () => {
  const { profile, loading } = useAuthContext();
  const [plcSettings, setPlcSettings] = useState<PLCConnectionSettings>({
    ip: '',
    port: '',
    protocol: 'modbus',
    autoReconnect: false
  });
  
  useEffect(() => {
    // Load saved settings from localStorage if available
    const savedSettings = localStorage.getItem('plcSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setPlcSettings({
          ip: settings.ip || '',
          port: settings.port || '',
          protocol: settings.protocol || 'modbus',
          autoReconnect: settings.autoReconnect !== undefined ? settings.autoReconnect : false
        });
      } catch (error) {
        console.error('Failed to parse PLC settings:', error);
      }
    }
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSettings />
      </DashboardLayout>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <DashboardLayout>
        <AccessDenied />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure the PLC connection, data collection, and user management settings.
          </p>
        </div>

        <Tabs defaultValue="connection">
          <TabsList>
            <TabsTrigger value="connection">PLC Connection</TabsTrigger>
            <TabsTrigger value="data">Data Collection</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="mt-4">
            <ConnectionSettings initialSettings={plcSettings} />
          </TabsContent>
          
          <TabsContent value="data" className="mt-4">
            <DataCollectionSettings />
          </TabsContent>
          
          <TabsContent value="users" className="mt-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
