
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthContext } from '@/context/AuthContext';

interface User {
  id: string;
  username: string;
  role: string;
}

const UserManagement = () => {
  const { profile } = useAuthContext();
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'admin', role: 'admin' },
    { id: '2', username: 'operator1', role: 'operator' },
    { id: '3', username: 'operator2', role: 'operator' }
  ]);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('operator');

  const handleAddUser = () => {
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty"
      });
      return;
    }
    
    // Check if username already exists
    if (users.some(user => user.username === newUsername)) {
      toast({
        title: "Error",
        description: "Username already exists"
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
      description: `User ${newUsername} has been added with ${newRole} role.`
    });
  };

  const handleDeleteUser = (userId: string) => {
    // Prevent deleting your own account
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.username === profile?.username) {
      toast({
        title: "Error",
        description: "You cannot delete your own account"
      });
      return;
    }
    
    setUsers(users.filter(user => user.id !== userId));
    
    toast({
      title: "User Deleted",
      description: "User has been removed from the system."
    });
  };

  return (
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
              placeholder="Enter username"
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
  );
};

export default UserManagement;
