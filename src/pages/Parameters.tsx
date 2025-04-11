import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchParameters, createParameter, updateParameter, deleteParameter } from '@/lib/parameters';

const Parameters = () => {
  const { toast: uiToast } = useToast();
  const { user } = useAuthContext();
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentParameter, setCurrentParameter] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    unit: '',
    min_value: '',
    max_value: '',
    status: 'normal'
  });

  // Fetch parameters on component mount and set up subscription
  useEffect(() => {
    getParameters();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('public:parameters')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'parameters' 
      }, (payload) => {
        console.log('Parameters change detected:', payload);
        getParameters();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getParameters = async () => {
    try {
      setLoading(true);
      const data = await fetchParameters();
      setParameters(data || []);
    } catch (error) {
      console.error('Error in getParameters:', error);
      uiToast({
        variant: "destructive",
        title: "Failed to load parameters",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      value: '',
      unit: '',
      min_value: '',
      max_value: '',
      status: 'normal'
    });
  };

  const handleAddParameter = async () => {
    try {
      // Validate input
      if (!formData.name || !formData.value) {
        uiToast({
          variant: "destructive",
          title: "Validation Error",
          description: "Name and value are required fields",
        });
        return;
      }

      const newParameter = {
        name: formData.name,
        value: parseFloat(formData.value),
        unit: formData.unit,
        min_value: formData.min_value ? parseFloat(formData.min_value) : null,
        max_value: formData.max_value ? parseFloat(formData.max_value) : null,
        status: formData.status,
        user_id: user.id
      };

      await createParameter(newParameter);
      
      // Refresh parameters list
      getParameters();
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding parameter:', error);
      uiToast({
        variant: "destructive",
        title: "Failed to add parameter",
        description: error.message,
      });
    }
  };

  const handleEditClick = (parameter) => {
    setCurrentParameter(parameter);
    setFormData({
      name: parameter.name,
      value: parameter.value.toString(),
      unit: parameter.unit || '',
      min_value: parameter.min_value ? parameter.min_value.toString() : '',
      max_value: parameter.max_value ? parameter.max_value.toString() : '',
      status: parameter.status || 'normal'
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateParameter = async () => {
    try {
      if (!currentParameter) return;

      const updatedParameter = {
        name: formData.name,
        value: parseFloat(formData.value),
        unit: formData.unit,
        min_value: formData.min_value ? parseFloat(formData.min_value) : null,
        max_value: formData.max_value ? parseFloat(formData.max_value) : null,
        status: formData.status
      };

      await updateParameter(currentParameter.id, updatedParameter);

      getParameters();
      resetForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating parameter:', error);
      uiToast({
        variant: "destructive",
        title: "Failed to update parameter",
        description: error.message,
      });
    }
  };

  const handleDeleteParameter = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await deleteParameter(id);
      getParameters();
    } catch (error) {
      console.error('Error deleting parameter:', error);
      uiToast({
        variant: "destructive",
        title: "Failed to delete parameter",
        description: error.message,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">PLC Parameters</h1>
            <p className="text-muted-foreground">
              View and manage all PLC parameters in the system
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Parameter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Parameter</DialogTitle>
                <DialogDescription>
                  Create a new PLC parameter to monitor
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Temperature"
                    className="col-span-3"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="value" className="text-right">
                    Value
                  </Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    placeholder="25.5"
                    className="col-span-3"
                    value={formData.value}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    Unit
                  </Label>
                  <Input
                    id="unit"
                    name="unit"
                    placeholder="°C"
                    className="col-span-3"
                    value={formData.unit}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="min_value" className="text-right">
                    Min Value
                  </Label>
                  <Input
                    id="min_value"
                    name="min_value"
                    type="number"
                    placeholder="0"
                    className="col-span-3"
                    value={formData.min_value}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max_value" className="text-right">
                    Max Value
                  </Label>
                  <Input
                    id="max_value"
                    name="max_value"
                    type="number"
                    placeholder="100"
                    className="col-span-3"
                    value={formData.max_value}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddParameter}>
                  Add Parameter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Parameter</DialogTitle>
                <DialogDescription>
                  Update the details of an existing parameter
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    className="col-span-3"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-value" className="text-right">
                    Value
                  </Label>
                  <Input
                    id="edit-value"
                    name="value"
                    type="number"
                    className="col-span-3"
                    value={formData.value}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-unit" className="text-right">
                    Unit
                  </Label>
                  <Input
                    id="edit-unit"
                    name="unit"
                    className="col-span-3"
                    value={formData.unit}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-min_value" className="text-right">
                    Min Value
                  </Label>
                  <Input
                    id="edit-min_value"
                    name="min_value"
                    type="number"
                    className="col-span-3"
                    value={formData.min_value}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-max_value" className="text-right">
                    Max Value
                  </Label>
                  <Input
                    id="edit-max_value"
                    name="max_value"
                    type="number" 
                    className="col-span-3"
                    value={formData.max_value}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleUpdateParameter}>
                  Update Parameter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading parameters...</div>
            ) : parameters.length === 0 ? (
              <div className="text-center py-4">No parameters found. Add your first parameter to get started.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map((parameter) => (
                    <TableRow key={parameter.id}>
                      <TableCell className="font-medium">{parameter.name}</TableCell>
                      <TableCell>{parameter.value}</TableCell>
                      <TableCell>{parameter.unit}</TableCell>
                      <TableCell>
                        {parameter.min_value !== null && parameter.max_value !== null
                          ? `${parameter.min_value} - ${parameter.max_value}`
                          : parameter.min_value !== null
                          ? `Min: ${parameter.min_value}`
                          : parameter.max_value !== null
                          ? `Max: ${parameter.max_value}`
                          : 'Not set'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          parameter.status === 'alarm' ? 'bg-red-100 text-red-800' :
                          parameter.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {parameter.status || 'normal'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(parameter)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteParameter(parameter.id, parameter.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Parameters;
