
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

const Parameters = () => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [filteredParameters, setFilteredParameters] = useState<Parameter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentParameter, setCurrentParameter] = useState<Parameter | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load parameters
    const allParams = getAllParameters();
    setParameters(allParams);
    setFilteredParameters(allParams);
  }, []);

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
    // In a real app, this would open a form to add a new parameter
    // For this demo, we'll just show a toast
    toast({
      title: "Feature Not Implemented",
      description: "Adding new parameters would require backend integration.",
    });
  };

  const handleEditParameter = (parameter: Parameter) => {
    setCurrentParameter(parameter);
    setIsEditModalOpen(true);
  };

  const handleDeleteParameter = (parameterId: string) => {
    // In a real app, this would delete the parameter from the database
    // For this demo, we'll just remove it from the state
    setParameters(prev => prev.filter(p => p.id !== parameterId));
    
    toast({
      title: "Parameter Deleted",
      description: `Parameter has been removed from the dashboard.`,
    });
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentParameter) return;
    
    // Update the parameter in the state
    setParameters(prev => 
      prev.map(p => 
        p.id === currentParameter.id ? currentParameter : p
      )
    );
    
    setIsEditModalOpen(false);
    
    toast({
      title: "Thresholds Updated",
      description: `Threshold changes for ${currentParameter.name} have been saved.`,
    });
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
    </DashboardLayout>
  );
};

export default Parameters;
