
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusIndicator from '@/components/StatusIndicator';
import { getAllParameters } from '@/data/mockData';
import { Parameter } from '@/types/parameter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Parameters = () => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [filteredParameters, setFilteredParameters] = useState<Parameter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentParameter, setCurrentParameter] = useState<Parameter | null>(null);
  const [newParameter, setNewParameter] = useState({
    name: '',
    description: '',
    category: '',
    unit: '',
    value: 0,
    thresholds: {
      warning: { min: 0, max: 0 },
      alarm: { min: 0, max: 0 }
    }
  });
  const { toast } = useToast();
  const { user, isAdmin } = useAuthContext();

  useEffect(() => {
    // Load parameters
    loadParameters();
  }, []);

  const loadParameters = async () => {
    try {
      // First try to load from Supabase
      if (user) {
        const { data, error } = await supabase
          .from('parameters')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error loading parameters from Supabase:', error);
          // Fallback to mock data
          const allParams = getAllParameters();
          setParameters(allParams);
          setFilteredParameters(allParams);
        } else if (data && data.length > 0) {
          // Transform Supabase data to match our Parameter type
          const transformedParams: Parameter[] = data.map(param => ({
            id: param.id,
            name: param.name,
            description: param.description || '',
            category: param.category || 'General',
            unit: param.unit || '',
            value: param.value,
            status: param.status as 'normal' | 'warning' | 'alarm' || 'normal',
            thresholds: {
              warning: {
                min: param.warning_min || null,
                max: param.warning_max || null
              },
              alarm: {
                min: param.alarm_min || null,
                max: param.alarm_max || null
              }
            },
            timestamp: param.updated_at || new Date().toISOString()
          }));
          
          setParameters(transformedParams);
          setFilteredParameters(transformedParams);
        } else {
          // No data in Supabase, use mock data
          const allParams = getAllParameters();
          setParameters(allParams);
          setFilteredParameters(allParams);
        }
      } else {
        // Not logged in, use mock data
        const allParams = getAllParameters();
        setParameters(allParams);
        setFilteredParameters(allParams);
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
      // Fallback to mock data
      const allParams = getAllParameters();
      setParameters(allParams);
      setFilteredParameters(allParams);
    }
  };

  useEffect(() => {
    // Filter parameters based on search query
    if (searchQuery.trim() === '') {
      setFilteredParameters(parameters);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredParameters(
        parameters.filter(
          p => 
            p.name.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, parameters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddParameter = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveNewParameter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add parameters.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Calculate status based on thresholds and value
      let status: 'normal' | 'warning' | 'alarm' = 'normal';
      const value = Number(newParameter.value);
      
      if (newParameter.thresholds.alarm.min !== null && value < newParameter.thresholds.alarm.min ||
          newParameter.thresholds.alarm.max !== null && value > newParameter.thresholds.alarm.max) {
        status = 'alarm';
      } else if (newParameter.thresholds.warning.min !== null && value < newParameter.thresholds.warning.min ||
                 newParameter.thresholds.warning.max !== null && value > newParameter.thresholds.warning.max) {
        status = 'warning';
      }
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('parameters')
        .insert({
          name: newParameter.name,
          description: newParameter.description,
          category: newParameter.category,
          unit: newParameter.unit,
          value: newParameter.value,
          status: status,
          warning_min: newParameter.thresholds.warning.min,
          warning_max: newParameter.thresholds.warning.max,
          alarm_min: newParameter.thresholds.alarm.min,
          alarm_max: newParameter.thresholds.alarm.max,
          user_id: user.id
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Parameter Added",
        description: `${newParameter.name} has been added successfully.`,
      });
      
      // Reset form and close modal
      setNewParameter({
        name: '',
        description: '',
        category: '',
        unit: '',
        value: 0,
        thresholds: {
          warning: { min: 0, max: 0 },
          alarm: { min: 0, max: 0 }
        }
      });
      setIsAddModalOpen(false);
      
      // Reload parameters
      loadParameters();
      
    } catch (error: any) {
      console.error('Error adding parameter:', error);
      toast({
        title: "Error Adding Parameter",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  const handleEditParameter = (parameter: Parameter) => {
    setCurrentParameter(parameter);
    setIsEditModalOpen(true);
  };

  const handleDeleteParameter = async (parameterId: string) => {
    try {
      // Delete from Supabase if user is logged in
      if (user) {
        const { error } = await supabase
          .from('parameters')
          .delete()
          .eq('id', parameterId)
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
      
      // Update local state
      setParameters(prev => prev.filter(p => p.id !== parameterId));
      
      toast({
        title: "Parameter Deleted",
        description: "Parameter has been removed successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting parameter:', error);
      toast({
        title: "Error Deleting Parameter",
        description: error.message || "An unexpected error occurred while deleting.",
        variant: "destructive"
      });
    }
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentParameter || !user) return;
    
    try {
      // Calculate new status based on thresholds and value
      let status: 'normal' | 'warning' | 'alarm' = 'normal';
      const value = Number(currentParameter.value);
      
      if (currentParameter.thresholds.alarm.min !== null && value < currentParameter.thresholds.alarm.min ||
          currentParameter.thresholds.alarm.max !== null && value > currentParameter.thresholds.alarm.max) {
        status = 'alarm';
      } else if (currentParameter.thresholds.warning.min !== null && value < currentParameter.thresholds.warning.min ||
                 currentParameter.thresholds.warning.max !== null && value > currentParameter.thresholds.warning.max) {
        status = 'warning';
      }
      
      // Update in Supabase
      const { error } = await supabase
        .from('parameters')
        .update({
          warning_min: currentParameter.thresholds.warning.min,
          warning_max: currentParameter.thresholds.warning.max,
          alarm_min: currentParameter.thresholds.alarm.min,
          alarm_max: currentParameter.thresholds.alarm.max,
          status: status
        })
        .eq('id', currentParameter.id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Update the parameter in the state
      setParameters(prev => 
        prev.map(p => 
          p.id === currentParameter.id ? { ...currentParameter, status } : p
        )
      );
      
      setIsEditModalOpen(false);
      
      toast({
        title: "Thresholds Updated",
        description: `Threshold changes for ${currentParameter.name} have been saved.`,
      });
    } catch (error: any) {
      console.error('Error updating thresholds:', error);
      toast({
        title: "Error Updating Thresholds",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Parameters</h1>
          <Button onClick={handleAddParameter}>
            <Plus className="mr-2 h-4 w-4" />
            Add Parameter
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search parameters..." 
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Parameters table */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle>Parameter List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Current Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Warning Thresholds</TableHead>
                  <TableHead className="w-[150px]">Alarm Thresholds</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParameters.length > 0 ? (
                  filteredParameters.map(parameter => (
                    <TableRow key={parameter.id}>
                      <TableCell className="font-medium">{parameter.name}</TableCell>
                      <TableCell>{parameter.description}</TableCell>
                      <TableCell>{parameter.category}</TableCell>
                      <TableCell>
                        {parameter.value} {parameter.unit}
                      </TableCell>
                      <TableCell>
                        <StatusIndicator status={parameter.status} />
                      </TableCell>
                      <TableCell>
                        {parameter.thresholds.warning.min} - {parameter.thresholds.warning.max} {parameter.unit}
                      </TableCell>
                      <TableCell>
                        {parameter.thresholds.alarm.min} - {parameter.thresholds.alarm.max} {parameter.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditParameter(parameter)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteParameter(parameter.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      No parameters found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Thresholds Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Parameter Thresholds</DialogTitle>
            <DialogDescription>
              Adjust warning and alarm thresholds for the selected parameter.
            </DialogDescription>
          </DialogHeader>
          
          {currentParameter && (
            <form onSubmit={handleSaveThresholds}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="parameter-name">Parameter</Label>
                  <Input id="parameter-name" value={currentParameter.name} readOnly />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warning-min">Warning Min</Label>
                    <Input 
                      id="warning-min" 
                      type="number" 
                      value={currentParameter.thresholds.warning.min || ''} 
                      onChange={(e) => setCurrentParameter({
                        ...currentParameter,
                        thresholds: {
                          ...currentParameter.thresholds,
                          warning: {
                            ...currentParameter.thresholds.warning,
                            min: e.target.value ? Number(e.target.value) : null
                          }
                        }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="warning-max">Warning Max</Label>
                    <Input 
                      id="warning-max" 
                      type="number" 
                      value={currentParameter.thresholds.warning.max || ''} 
                      onChange={(e) => setCurrentParameter({
                        ...currentParameter,
                        thresholds: {
                          ...currentParameter.thresholds,
                          warning: {
                            ...currentParameter.thresholds.warning,
                            max: e.target.value ? Number(e.target.value) : null
                          }
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alarm-min">Alarm Min</Label>
                    <Input 
                      id="alarm-min" 
                      type="number" 
                      value={currentParameter.thresholds.alarm.min || ''} 
                      onChange={(e) => setCurrentParameter({
                        ...currentParameter,
                        thresholds: {
                          ...currentParameter.thresholds,
                          alarm: {
                            ...currentParameter.thresholds.alarm,
                            min: e.target.value ? Number(e.target.value) : null
                          }
                        }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alarm-max">Alarm Max</Label>
                    <Input 
                      id="alarm-max" 
                      type="number" 
                      value={currentParameter.thresholds.alarm.max || ''} 
                      onChange={(e) => setCurrentParameter({
                        ...currentParameter,
                        thresholds: {
                          ...currentParameter.thresholds,
                          alarm: {
                            ...currentParameter.thresholds.alarm,
                            max: e.target.value ? Number(e.target.value) : null
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Parameter Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Parameter</DialogTitle>
            <DialogDescription>
              Create a new parameter to monitor in your system.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveNewParameter}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input 
                  id="new-name" 
                  value={newParameter.name} 
                  onChange={(e) => setNewParameter({...newParameter, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-description">Description</Label>
                <Input 
                  id="new-description" 
                  value={newParameter.description} 
                  onChange={(e) => setNewParameter({...newParameter, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-category">Category</Label>
                  <Input 
                    id="new-category" 
                    value={newParameter.category} 
                    onChange={(e) => setNewParameter({...newParameter, category: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-unit">Unit</Label>
                  <Input 
                    id="new-unit" 
                    value={newParameter.unit} 
                    onChange={(e) => setNewParameter({...newParameter, unit: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-value">Current Value</Label>
                <Input 
                  id="new-value" 
                  type="number"
                  value={newParameter.value} 
                  onChange={(e) => setNewParameter({...newParameter, value: Number(e.target.value)})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-warning-min">Warning Min</Label>
                  <Input 
                    id="new-warning-min" 
                    type="number" 
                    value={newParameter.thresholds.warning.min || ''} 
                    onChange={(e) => setNewParameter({
                      ...newParameter,
                      thresholds: {
                        ...newParameter.thresholds,
                        warning: {
                          ...newParameter.thresholds.warning,
                          min: e.target.value ? Number(e.target.value) : null
                        }
                      }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-warning-max">Warning Max</Label>
                  <Input 
                    id="new-warning-max" 
                    type="number" 
                    value={newParameter.thresholds.warning.max || ''} 
                    onChange={(e) => setNewParameter({
                      ...newParameter,
                      thresholds: {
                        ...newParameter.thresholds,
                        warning: {
                          ...newParameter.thresholds.warning,
                          max: e.target.value ? Number(e.target.value) : null
                        }
                      }
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-alarm-min">Alarm Min</Label>
                  <Input 
                    id="new-alarm-min" 
                    type="number" 
                    value={newParameter.thresholds.alarm.min || ''} 
                    onChange={(e) => setNewParameter({
                      ...newParameter,
                      thresholds: {
                        ...newParameter.thresholds,
                        alarm: {
                          ...newParameter.thresholds.alarm,
                          min: e.target.value ? Number(e.target.value) : null
                        }
                      }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-alarm-max">Alarm Max</Label>
                  <Input 
                    id="new-alarm-max" 
                    type="number" 
                    value={newParameter.thresholds.alarm.max || ''} 
                    onChange={(e) => setNewParameter({
                      ...newParameter,
                      thresholds: {
                        ...newParameter.thresholds,
                        alarm: {
                          ...newParameter.thresholds.alarm,
                          max: e.target.value ? Number(e.target.value) : null
                        }
                      }
                    })}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add Parameter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Parameters;
