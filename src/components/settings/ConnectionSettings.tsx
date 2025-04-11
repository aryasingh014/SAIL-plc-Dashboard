
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ConnectionSettingsProps {
  initialSettings: {
    ip: string;
    port: string;
    protocol: string;
    autoReconnect: boolean;
  };
}

const ConnectionSettings = ({ initialSettings }: ConnectionSettingsProps) => {
  const [plcIp, setPlcIp] = useState(initialSettings.ip || '');
  const [plcPort, setPlcPort] = useState(initialSettings.port || '102');
  const [plcProtocol, setPlcProtocol] = useState(initialSettings.protocol || 'opcua');
  const [autoReconnect, setAutoReconnect] = useState(initialSettings.autoReconnect !== undefined ? initialSettings.autoReconnect : true);

  const handleSaveConnectionSettings = () => {
    // Save PLC connection settings to localStorage
    localStorage.setItem('plcSettings', JSON.stringify({
      ip: plcIp,
      port: plcPort,
      protocol: plcProtocol,
      autoReconnect
    }));
    
    toast({
      title: "Connection Settings Saved",
      description: "PLC connection settings have been updated."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PLC Connection Settings</CardTitle>
        <CardDescription>
          Configure the connection parameters for your Siemens S7-400 PLC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="plc-ip">PLC IP Address</Label>
            <Input 
              id="plc-ip" 
              value={plcIp}
              placeholder="Enter IP address"
              onChange={(e) => setPlcIp(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="plc-port">PLC Port</Label>
            <Input 
              id="plc-port" 
              value={plcPort}
              placeholder="Enter port number"
              onChange={(e) => setPlcPort(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="plc-protocol">Connection Protocol</Label>
          <Select value={plcProtocol} onValueChange={setPlcProtocol}>
            <SelectTrigger id="plc-protocol">
              <SelectValue placeholder="Select protocol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opcua">OPC UA</SelectItem>
              <SelectItem value="snap7">Snap7</SelectItem>
              <SelectItem value="s7comm">S7COMM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-reconnect" 
            checked={autoReconnect}
            onCheckedChange={setAutoReconnect}
          />
          <Label htmlFor="auto-reconnect">Auto-reconnect on connection loss</Label>
        </div>
        
        <Button onClick={handleSaveConnectionSettings}>Save Connection Settings</Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionSettings;
