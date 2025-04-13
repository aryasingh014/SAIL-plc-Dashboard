
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert } from '@/types/parameter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Mail, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emailNotification, setEmailNotification] = useState<boolean>(false);
  const [smsNotification, setSmsNotification] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const loadNotificationSettings = useCallback(() => {
    // Load saved notification settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setEmailNotification(settings.emailNotification ?? false);
        setSmsNotification(settings.smsNotification ?? false);
        setEmail(settings.email || '');
        setPhone(settings.phone || '');
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Load alerts from localStorage if available
    const savedAlerts = localStorage.getItem('alerts');
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (error) {
        console.error('Failed to parse saved alerts:', error);
      }
    }
    
    // Load notification settings
    loadNotificationSettings();
    
    // Subscribe to parameter status changes for generating alerts
    const channel = supabase
      .channel('parameter-status-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'parameters'
      }, (payload: any) => {
        // Only process alerts for parameters with warning or alarm status
        if (payload.new && (payload.new.status === 'warning' || payload.new.status === 'alarm')) {
          console.log('Parameter status change detected:', payload.new);
          handleParameterStatusChange(payload.new);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotificationSettings]);

  // Save alerts to localStorage whenever they change
  useEffect(() => {
    if (alerts.length > 0) {
      localStorage.setItem('alerts', JSON.stringify(alerts));
    }
  }, [alerts]);

  const handleParameterStatusChange = (parameter: any) => {
    if (parameter.status === 'warning' || parameter.status === 'alarm') {
      // Create a new alert
      const newAlert: Alert = {
        id: Date.now().toString(),
        parameterId: parameter.id,
        parameterName: parameter.name,
        value: parameter.value,
        threshold: parameter.status === 'warning' ? parameter.min_value || parameter.max_value : 0,
        status: parameter.status as 'warning' | 'alarm',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        notified: false
      };
      
      // Add the new alert to the list
      setAlerts(prev => [newAlert, ...prev]);
      
      // Send notifications if enabled
      if (emailNotification && email) {
        sendEmailNotification(newAlert);
      }
      
      if (smsNotification && phone) {
        sendSMSNotification(newAlert);
      }
      
      // Show a toast notification
      toast(`${parameter.status.toUpperCase()} Alert`, {
        description: `Parameter ${parameter.name} has a value of ${parameter.value} which triggered a ${parameter.status} alert.`
      });
    }
  };

  const sendEmailNotification = async (alert: Alert) => {
    // Send email notification
    if (!email) return;
    
    console.log(`Sending email notification to ${email} for alert:`, alert);
    
    try {
      // Make a fetch request to a hypothetical email endpoint
      // In a real app, you would call an email service or API
      const response = await fetch('/api/send-alert-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subject: `SAIL Alert: ${alert.status.toUpperCase()} for ${alert.parameterName}`,
          message: `Parameter ${alert.parameterName} has a value of ${alert.value} which triggered a ${alert.status} alert.`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }
      
      // Update the alert to mark it as notified
      setAlerts(prev => 
        prev.map(a => 
          a.id === alert.id ? { ...a, notified: true } : a
        )
      );
      
      toast("Email Alert Sent", {
        description: `Email notification sent to ${email}`
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      toast("Failed to Send Email", {
        description: "There was an error sending the email notification."
      });
    }
  };

  const sendSMSNotification = async (alert: Alert) => {
    // Send SMS notification
    if (!phone) return;
    
    console.log(`Sending SMS notification to ${phone} for alert:`, alert);
    
    try {
      // Make a fetch request to a hypothetical SMS endpoint
      // In a real app, you would call an SMS service or API (e.g., Twilio)
      const response = await fetch('/api/send-alert-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message: `SAIL Alert: ${alert.status.toUpperCase()} - ${alert.parameterName} value: ${alert.value}`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send SMS notification');
      }
      
      // Update the alert to mark it as notified
      setAlerts(prev => 
        prev.map(a => 
          a.id === alert.id ? { ...a, notified: true } : a
        )
      );
      
      toast("SMS Alert Sent", {
        description: `SMS notification sent to ${phone}`
      });
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      toast("Failed to Send SMS", {
        description: "There was an error sending the SMS notification."
      });
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    
    toast("Alert Acknowledged", {
      description: "The alert has been acknowledged."
    });
  };

  const handleSaveNotificationSettings = () => {
    setIsSaving(true);
    
    try {
      // Save notification settings to localStorage
      const settings = {
        emailNotification,
        smsNotification,
        email,
        phone
      };
      
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      toast("Notification Settings Saved", {
        description: "Your notification preferences have been updated."
      });
    } catch (error) {
      toast("Save Failed", {
        description: "Failed to save notification settings."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: 'warning' | 'alarm') => {
    if (status === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-industrial-status-warning" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-industrial-status-alarm" />;
    }
  };

  const handleTestNotification = async () => {
    const testAlert: Alert = {
      id: 'test-' + Date.now().toString(),
      parameterId: 'test',
      parameterName: 'Test Parameter',
      value: 100,
      threshold: 90,
      status: 'warning',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      notified: false
    };
    
    if (emailNotification && email) {
      await sendEmailNotification(testAlert);
    }
    
    if (smsNotification && phone) {
      await sendSMSNotification(testAlert);
    }
    
    if (!emailNotification && !smsNotification) {
      toast("No Notification Methods Enabled", {
        description: "Please enable email or SMS notifications first."
      });
    }
  };

  const handleClearAlerts = () => {
    setAlerts([]);
    localStorage.removeItem('alerts');
    toast("Alerts Cleared", {
      description: "All alerts have been cleared."
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Alerts & Notifications</h1>
          <Badge variant="outline" className="flex items-center">
            <Bell className="mr-1 h-4 w-4" />
            {alerts.filter(a => !a.acknowledged).length} Unacknowledged
          </Badge>
        </div>

        <Tabs defaultValue="alerts">
          <TabsList>
            <TabsTrigger value="alerts">Alert History</TabsTrigger>
            <TabsTrigger value="settings">Notification Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="mt-4">
            <Card>
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Alerts</CardTitle>
                <Button variant="outline" size="sm" onClick={handleClearAlerts}>
                  Clear All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.length > 0 ? (
                      alerts.map(alert => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(alert.status)}
                              <span className="capitalize">{alert.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{alert.parameterName}</TableCell>
                          <TableCell>{alert.value}</TableCell>
                          <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            {alert.acknowledged ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Acknowledged
                              </Badge>
                            ) : (
                              <Button size="sm" onClick={() => handleAcknowledge(alert.id)}>
                                Acknowledge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          No alerts found. The system is operating normally.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="email-notification">Email Notifications</Label>
                    </div>
                    <Switch 
                      id="email-notification" 
                      checked={emailNotification}
                      onCheckedChange={setEmailNotification}
                    />
                  </div>
                  
                  {emailNotification && (
                    <div className="pl-6">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter email address" 
                        className="mt-1"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="sms-notification">SMS Notifications</Label>
                    </div>
                    <Switch 
                      id="sms-notification" 
                      checked={smsNotification}
                      onCheckedChange={setSmsNotification}
                    />
                  </div>
                  
                  {smsNotification && (
                    <div className="pl-6">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="Enter phone number" 
                        className="mt-1"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveNotificationSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Settings"}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleTestNotification}
                      disabled={(!emailNotification && !smsNotification) || isSaving}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Test Notification
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted rounded text-sm">
                    <strong>Note:</strong> For notifications to work in a production environment, you'll need to configure the email and SMS services.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
