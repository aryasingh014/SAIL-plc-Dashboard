import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // PLC Connection settings
  const [plcIp, setPlcIp] = useState('198.162.0.1');
  const [plcPort, setPlcPort] = useState('102');
  const [plcProtocol, setPlcProtocol] = useState('opcua');
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  // Data Collection settings
  const [pollInterval, setPollInterval] = useState('5');
  const [dataRetention, setDataRetention] = useState('30');
  const [highResolutionHistory, setHighResolutionHistory] = useState(false);
  
  // User Management
  const [users, setUsers] = useState([
    { id: '1', username: 'admin', role: 'admin' },
    { id: '2', username: 'operator1', role: 'operator' },
    { id: '3', username: 'operator2', role: 'operator' }
  ]);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('operator');

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'admin') {
        // Redirect non-admin users
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You need admin privileges to access settings.",
        });
        navigate('/dashboard');
      }
    } else {
      // Not logged in
      navigate('/login');
    }
  }, [navigate, toast]);

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
      description: "PLC connection settings have been updated.",
    });
  };

  const handleSaveDataSettings = () => {
    toast({
      title: "Data Collection Settings Saved",
      description: "Data collection settings have been updated.",
    });
  };

  const handleAddUser = () => {
    if (!newUsername.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username cannot be empty",
      });
      return;
    }
    
    // Check if username already exists
    if (users.some(user => user.username === newUsername)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username already exists",
      });
      return;
    }
    
    setUsers([
      ...users,
      {
        id: String(users.length + 1),
        username: newUsername,
        role: newRole
      }
    ]);
    
    setNewUsername('');
    
    toast({
      title: "User Added",
      description: `User ${newUsername} has been added with ${newRole} role.`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    // Prevent deleting your own account
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.username === user?.username) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You cannot delete your own account",
      });
      return;
    }
    
    setUsers(users.filter(user => user.id !== userId));
    
    toast({
      title: "User Deleted",
      description: "User has been removed from the system.",
    });
  };

  if (!user || user.role !== 'admin') {
    return null; // Will be redirected by useEffect
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
                      onChange={(e) => setPlcIp(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="plc-port">PLC Port</Label>
                    <Input 
                      id="plc-port" 
                      value={plcPort}
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
          </TabsContent>
          
          <TabsContent value="data" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Collection Settings</CardTitle>
                <CardDescription>
                  Configure how data is collected and stored from the PLC.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poll-interval">Polling Interval (seconds)</Label>
                    <Input 
                      id="poll-interval" 
                      type="number" 
                      min="1" 
                      max="60"
                      value={pollInterval}
                      onChange={(e) => setPollInterval(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data-retention">Data Retention (days)</Label>
                    <Input 
                      id="data-retention" 
                      type="number" 
                      min="1" 
                      max="365"
                      value={dataRetention}
                      onChange={(e) => setDataRetention(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="high-resolution" 
                    checked={highResolutionHistory}
                    onCheckedChange={setHighResolutionHistory}
                  />
                  <Label htmlFor="high-resolution">
                    Enable high resolution historical data (increases storage requirements)
                  </Label>
                </div>
                
                <Button onClick={handleSaveDataSettings}>Save Data Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users who can access the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="space-y-2 md:col-span-5">
                    <Label htmlFor="new-username">Username</Label>
                    <Input 
                      id="new-username" 
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-5">
                    <Label htmlFor="new-role">Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger id="new-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2 flex items-end">
                    <Button className="w-full" onClick={handleAddUser}>Add User</Button>
                  </div>
                </div>
                
                <div className="border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
