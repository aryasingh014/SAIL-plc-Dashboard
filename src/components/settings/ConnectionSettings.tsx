
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PLCConnectionSettings } from '@/types/parameter';
import { toast } from 'sonner';

interface ConnectionSettingsProps {
  initialSettings: PLCConnectionSettings;
}

const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({ initialSettings }) => {
  const [settings, setSettings] = useState<PLCConnectionSettings>(initialSettings);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSave = () => {
    // Validate IP address
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(settings.ip)) {
      toast("Invalid IP Address", {
        description: "Please enter a valid IP address in the format xxx.xxx.xxx.xxx"
      });
      return;
    }

    // Validate port
    const portNum = parseInt(settings.port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast("Invalid Port", {
        description: "Port must be a number between 1 and 65535"
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('plcSettings', JSON.stringify(settings));
    
    toast("Settings Saved", {
      description: "PLC connection settings have been saved successfully."
    });
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestStatus('idle');
    
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% chance of success for demo
      
      if (success) {
        setTestStatus('success');
        toast("Connection Successful", {
          description: `Successfully connected to PLC at ${settings.ip}:${settings.port}`
        });
      } else {
        setTestStatus('error');
        toast("Connection Failed", {
          description: "Could not connect to PLC. Please check your settings and try again."
        });
      }
      
      setIsTesting(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PLC Connection Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ip-address">IP Address</Label>
            <Input 
              id="ip-address" 
              placeholder="192.168.1.1" 
              value={settings.ip}
              onChange={(e) => setSettings({...settings, ip: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input 
              id="port" 
              placeholder="502" 
              value={settings.port}
              onChange={(e) => setSettings({...settings, port: e.target.value})}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="protocol">Protocol</Label>
          <Select 
            value={settings.protocol} 
            onValueChange={(value: any) => setSettings({...settings, protocol: value})}
          >
            <SelectTrigger id="protocol">
              <SelectValue placeholder="Select protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modbus">Modbus TCP</SelectItem>
              <SelectItem value="opcua">OPC UA</SelectItem>
              <SelectItem value="ethernet-ip">Ethernet/IP</SelectItem>
              <SelectItem value="snap7">SNAP7 (Siemens S7)</SelectItem>
              <SelectItem value="s7comm">S7comm (Siemens S7)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-reconnect" 
            checked={settings.autoReconnect}
            onCheckedChange={(checked) => setSettings({...settings, autoReconnect: checked})}
          />
          <Label htmlFor="auto-reconnect">Auto-reconnect on connection loss</Label>
        </div>
        
        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave}>Save Settings</Button>
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {testStatus === 'success' && (
            <p className="text-green-500 flex items-center">
              Connection successful
            </p>
          )}
          
          {testStatus === 'error' && (
            <p className="text-red-500 flex items-center">
              Connection failed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionSettings;
