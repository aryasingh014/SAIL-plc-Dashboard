
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { PLCConnectionSettings } from '@/types/parameter';

const formSchema = z.object({
  ip: z.string().min(7, {
    message: "IP address is required",
  }),
  port: z.string().min(1, {
    message: "Port is required",
  }),
  protocol: z.enum(["modbus", "opcua", "ethernet-ip", "snap7", "s7comm"]),
  autoReconnect: z.boolean().default(true),
});

type ConnectionSettingsFormValues = z.infer<typeof formSchema>;

interface ConnectionSettingsProps {
  initialSettings?: PLCConnectionSettings;
}

const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({ initialSettings }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load saved settings from localStorage
  const loadSavedSettings = (): ConnectionSettingsFormValues => {
    if (initialSettings) {
      return {
        ip: initialSettings.ip || '192.168.1.1',
        port: initialSettings.port || '502',
        protocol: initialSettings.protocol || 'modbus',
        autoReconnect: initialSettings.autoReconnect !== undefined ? initialSettings.autoReconnect : true,
      };
    }
    
    const savedSettings = localStorage.getItem('plcSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    }
    
    // Default values
    return {
      ip: '192.168.1.1',
      port: '502',
      protocol: 'modbus',
      autoReconnect: true,
    };
  };

  const form = useForm<ConnectionSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: loadSavedSettings(),
  });

  // Update form when initialSettings change
  useEffect(() => {
    if (initialSettings) {
      form.reset({
        ip: initialSettings.ip,
        port: initialSettings.port,
        protocol: initialSettings.protocol,
        autoReconnect: initialSettings.autoReconnect
      });
    }
  }, [initialSettings, form]);

  const onSubmit = async (data: ConnectionSettingsFormValues) => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('plcSettings', JSON.stringify(data));
      
      toast("Settings Saved", {
        description: "PLC connection settings have been updated."
      });
    } catch (error) {
      toast("Save Failed", {
        description: "Failed to save connection settings."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const formData = form.getValues();
    setIsConnecting(true);
    
    try {
      // In a real implementation, you would use an actual endpoint
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${formData.ip}:${formData.port}`;
      
      // Create a WebSocket connection
      const socket = new WebSocket(wsUrl);
      
      // Set timeout for connection
      const connectionTimeout = setTimeout(() => {
        socket.close();
        throw new Error('Connection timed out');
      }, 5000);
      
      // Promise to handle connection
      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => {
          clearTimeout(connectionTimeout);
          socket.close();
          resolve();
        };
        
        socket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          reject(error);
        };
      });
      
      toast("Connection Successful", {
        description: `Successfully connected to PLC at ${formData.ip}:${formData.port}`
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      toast("Connection Failed", {
        description: `Could not connect to PLC at ${formData.ip}:${formData.port}. Please check your settings and ensure the PLC is accessible.`
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PLC Connection Settings</CardTitle>
        <CardDescription>
          Configure connection settings for communicating with the PLC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PLC IP Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="192.168.1.1" />
                    </FormControl>
                    <FormDescription>
                      IP address of the PLC device
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="502" />
                    </FormControl>
                    <FormDescription>
                      Communication port number
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="modbus">Modbus TCP</SelectItem>
                        <SelectItem value="opcua">OPC UA</SelectItem>
                        <SelectItem value="ethernet-ip">Ethernet/IP</SelectItem>
                        <SelectItem value="snap7">S7 SNAP</SelectItem>
                        <SelectItem value="s7comm">S7 Communication</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Communication protocol for PLC
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoReconnect"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between pt-7">
                    <div className="space-y-0.5">
                      <FormLabel>Auto Reconnect</FormLabel>
                      <FormDescription>
                        Automatically reconnect when connection is lost
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isConnecting}
              >
                {isConnecting ? "Testing..." : "Test Connection"}
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              <p><strong>Connection Guide:</strong></p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>For Modbus TCP, default port is typically 502</li>
                <li>For OPC UA, default port is typically 4840</li>
                <li>For Ethernet/IP, default port is typically 44818</li>
                <li>For S7 protocols, default port is typically 102</li>
                <li>Ensure your PLC has the appropriate communication modules enabled</li>
              </ul>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ConnectionSettings;
