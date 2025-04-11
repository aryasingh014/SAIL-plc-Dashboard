
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
  protocol: z.enum(["modbus", "opcua", "ethernet-ip"]),
  autoReconnect: z.boolean().default(true),
});

type ConnectionSettingsFormValues = z.infer<typeof formSchema>;

interface ConnectionSettingsProps {
  initialSettings?: PLCConnectionSettings;
}

const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({ initialSettings }) => {
  const [isSaving, setIsSaving] = useState(false);

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
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
                      The IP address of the PLC device
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
                      The port used for communication
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
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ConnectionSettings;
