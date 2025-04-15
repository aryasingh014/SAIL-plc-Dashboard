
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createParameter, fetchParameters, updateParameter, deleteParameter } from '@/lib/parameters';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';
import { AlertCircle, AlertTriangle, CheckCircle, Edit, Trash } from 'lucide-react';
import { ParameterData } from '@/lib/parameters';
import { ParameterStatus } from '@/types/parameter';
import OfflineIndicator from '@/components/OfflineIndicator';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  value: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Value must be a number.",
  }),
  unit: z.string().optional(),
  min: z.string().optional().refine((val) => val === '' || !isNaN(parseFloat(val)), {
    message: "Min value must be a number.",
  }),
  max: z.string().optional().refine((val) => val === '' || !isNaN(parseFloat(val)), {
    message: "Max value must be a number.",
  }),
});

const Parameters = () => {
  const [parameters, setParameters] = useState<ParameterData[]>([]);
  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [isEditingParameter, setIsEditingParameter] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<ParameterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      value: "0",
      unit: "",
      min: "",
      max: "",
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      value: "0",
      unit: "",
      min: "",
      max: "",
    },
  });

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    setIsLoading(true);
    try {
      const data = await fetchParameters();
      // Convert the status string to ParameterStatus type explicitly
      const typedParameters: ParameterData[] = data.map((param: any) => ({
        ...param,
        status: (param.status as ParameterStatus) || 'normal'
      }));
      setParameters(typedParameters);
    } catch (error) {
      console.error('Error loading parameters:', error);
      toast("Failed to load parameters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: { name: string; value: string; unit: string; min: string; max: string }) => {
    try {
      const minValue = data.min ? parseFloat(data.min) : null;
      const maxValue = data.max ? parseFloat(data.max) : null;
      
      // Fix: ensure status is ParameterStatus type
      const newParameter = {
        name: data.name,
        value: parseFloat(data.value),
        unit: data.unit,
        min_value: minValue,
        max_value: maxValue,
        status: 'normal' as const, // Fix: Use 'as const' to type as ParameterStatus
        user_id: user?.id as string
      };
      
      await createParameter(newParameter);
      await loadParameters();
      form.reset();
      setIsAddingParameter(false);
    } catch (error) {
      console.error('Error creating parameter:', error);
    }
  };

  const handleEditSubmit = async (data: { name: string; value: string; unit: string; min: string; max: string }) => {
    if (!selectedParameter) return;
    
    const minValue = data.min ? parseFloat(data.min) : null;
    const maxValue = data.max ? parseFloat(data.max) : null;
    
    // Fix: ensure status is ParameterStatus type
    const updatedParameter = {
      name: data.name,
      value: parseFloat(data.value),
      unit: data.unit,
      min_value: minValue,
      max_value: maxValue,
      status: 'normal' as const // Fix: Use 'as const' to type as ParameterStatus
    };
    
    try {
      await updateParameter(selectedParameter.id!, updatedParameter);
      await loadParameters();
      setIsEditingParameter(false);
    } catch (error) {
      console.error('Error updating parameter:', error);
    }
  };

  const handleDeleteParameter = async (id: string) => {
    if (confirm('Are you sure you want to delete this parameter? This action cannot be undone.')) {
      try {
        await deleteParameter(id);
        await loadParameters();
        toast("Parameter deleted successfully");
      } catch (error) {
        console.error('Error deleting parameter:', error);
        toast("Failed to delete parameter");
      }
    }
  };

  const handleEditClick = (parameter: ParameterData) => {
    setSelectedParameter(parameter);
    editForm.reset({
      name: parameter.name,
      value: parameter.value.toString(),
      unit: parameter.unit || '',
      min: parameter.min_value !== null ? parameter.min_value.toString() : '',
      max: parameter.max_value !== null ? parameter.max_value.toString() : '',
    });
    setIsEditingParameter(true);
  };

  const getStatusIcon = (status: ParameterStatus) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-industrial-status-normal" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-industrial-status-warning" />;
      case 'alarm':
        return <AlertCircle className="h-5 w-5 text-industrial-status-alarm" />;
      default:
        return <CheckCircle className="h-5 w-5 text-industrial-status-normal" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Parameters</h1>
          <div className="flex items-center space-x-2">
            <OfflineIndicator />
            <Button onClick={() => setIsAddingParameter(true)}>Add Parameter</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parameter List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading parameters...</div>
            ) : parameters.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No parameters found. Add your first parameter to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map((parameter) => (
                    <TableRow key={parameter.id}>
                      <TableCell className="font-medium">{parameter.name}</TableCell>
                      <TableCell>{parameter.value}</TableCell>
                      <TableCell>{parameter.unit || '-'}</TableCell>
                      <TableCell>{parameter.min_value !== null ? parameter.min_value : '-'}</TableCell>
                      <TableCell>{parameter.max_value !== null ? parameter.max_value : '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(parameter.status || 'normal')}
                          <span className="ml-2 capitalize">{parameter.status || 'normal'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditClick(parameter)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteParameter(parameter.id!)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Parameter Dialog */}
      <Dialog open={isAddingParameter} onOpenChange={setIsAddingParameter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Parameter</DialogTitle>
            <DialogDescription>
              Add a new parameter to monitor in your dashboard.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Temperature" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="°C" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Value (Warning)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Value (Warning)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Add Parameter</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Parameter Dialog */}
      <Dialog open={isEditingParameter} onOpenChange={setIsEditingParameter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parameter</DialogTitle>
            <DialogDescription>
              Update the parameter details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Temperature" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="°C" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Value (Warning)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Value (Warning)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Update Parameter</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Parameters;
