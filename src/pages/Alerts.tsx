
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getAllAlerts } from '@/data/mockData';
import { Alert } from '@/types/parameter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Mail, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emailNotification, setEmailNotification] = useState(true);
  const [smsNotification, setSmsNotification] = useState(false);
  const [email, setEmail] = useState('admin@example.com');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load alerts
    const allAlerts = getAllAlerts();
    setAlerts(allAlerts);
  }, []);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    
    toast({
      title: "Alert Acknowledged",
      description: "The alert has been acknowledged.",
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  const getStatusIcon = (status: 'warning' | 'alarm') => {
    if (status === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-industrial-status-warning" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-industrial-status-alarm" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
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
              <CardHeader className="p-4 pb-2">
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Notified</TableHead>
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
                          <TableCell>{alert.threshold}</TableCell>
                          <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            {alert.notified ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Sent
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
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
                        <TableCell colSpan={7} className="text-center py-6">
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
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-6">
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
                  
                  <Button onClick={handleSaveNotificationSettings}>
                    Save Notification Settings
                  </Button>
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
