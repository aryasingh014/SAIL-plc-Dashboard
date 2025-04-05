
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllParameters, getMockParameterHistory } from '@/data/mockData';
import { Parameter, ParameterHistoryEntry } from '@/types/parameter';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const History = () => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(Date.now() - 24 * 60 * 60 * 1000)); // 24 hours ago
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Load parameters
    const allParams = getAllParameters();
    setParameters(allParams);
    
    // By default, select the first parameter
    if (allParams.length > 0) {
      setSelectedParameters([allParams[0].id]);
    }
  }, []);

  useEffect(() => {
    if (selectedParameters.length === 0 || !startDate || !endDate) {
      setChartData([]);
      return;
    }

    // Create a mapping of timestamps to data points for each selected parameter
    const timestampMap: Record<string, any> = {};
    
    selectedParameters.forEach(parameterId => {
      const parameter = parameters.find(p => p.id === parameterId);
      if (!parameter) return;
      
      const history = getMockParameterHistory(parameterId);
      
      // Filter by date range
      const filteredData = history.data.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= startDate && entryDate <= endDate;
      });
      
      // Add data points to the timestamp map
      filteredData.forEach(entry => {
        const timestamp = entry.timestamp;
        if (!timestampMap[timestamp]) {
          timestampMap[timestamp] = { timestamp: new Date(timestamp).toLocaleString() };
        }
        
        timestampMap[timestamp][parameter.name] = entry.value;
        timestampMap[timestamp][`${parameter.name}-status`] = entry.status;
      });
    });
    
    // Convert the timestamp map to an array of data points
    const formattedData = Object.values(timestampMap);
    
    // Sort by timestamp
    formattedData.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    setChartData(formattedData);
  }, [selectedParameters, startDate, endDate, parameters]);

  const toggleParameterSelection = (parameterId: string) => {
    setSelectedParameters(prev => {
      if (prev.includes(parameterId)) {
        return prev.filter(id => id !== parameterId);
      } else {
        return [...prev, parameterId];
      }
    });
  };

  const getLineColor = (parameterName: string) => {
    // Generate a consistent color based on the parameter name
    const index = parameters.findIndex(p => p.name === parameterName);
    const colors = ['#2563EB', '#10B981', '#D97706', '#DC2626', '#6366F1', '#EC4899', '#F59E0B', '#0EA5E9'];
    return colors[index % colors.length];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Historical Data</h1>
        </div>

        {/* Filter controls */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle>Data Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Date Range</span>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[180px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[180px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick an end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Parameters</span>
              <div className="flex flex-wrap gap-2">
                {parameters.map(parameter => (
                  <Button 
                    key={parameter.id}
                    variant={selectedParameters.includes(parameter.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleParameterSelection(parameter.id)}
                    className={selectedParameters.includes(parameter.id) ? "bg-industrial-blue hover:bg-industrial-blue-light" : ""}
                  >
                    {parameter.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="min-h-[500px]">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Historical Trends</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {selectedParameters.length > 0 && chartData.length > 0 ? (
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      angle={-45} 
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        // Check if this is a status field
                        if (name.endsWith('-status')) return null;
                        
                        // Find the corresponding parameter
                        const parameter = parameters.find(p => p.name === name);
                        if (!parameter) return [value, name];
                        
                        // Get the unit
                        return [`${value} ${parameter.unit}`, name];
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded shadow-lg">
                              <p className="font-bold">{label}</p>
                              <div className="space-y-2 mt-2">
                                {payload
                                  .filter(p => !p.name.endsWith('-status')) // Filter out status fields
                                  .map((entry, index) => {
                                    const parameter = parameters.find(p => p.name === entry.name);
                                    const status = payload.find(p => p.name === `${entry.name}-status`)?.value;
                                    
                                    // Status icon
                                    let StatusIcon = CheckCircle;
                                    let statusColor = 'text-industrial-status-normal';
                                    
                                    if (status === 'warning') {
                                      StatusIcon = AlertTriangle;
                                      statusColor = 'text-industrial-status-warning';
                                    } else if (status === 'alarm') {
                                      StatusIcon = AlertCircle;
                                      statusColor = 'text-industrial-status-alarm';
                                    }
                                    
                                    return (
                                      <div key={`tooltip-${index}`} className="flex items-center space-x-2">
                                        <div className="w-3 h-3" style={{ backgroundColor: entry.color }}></div>
                                        <span>{entry.name}:</span>
                                        <span className="font-medium">
                                          {entry.value} {parameter?.unit}
                                        </span>
                                        <StatusIcon className={cn("h-4 w-4", statusColor)} />
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    {selectedParameters.map(parameterId => {
                      const parameter = parameters.find(p => p.id === parameterId);
                      if (!parameter) return null;
                      
                      return (
                        <Line
                          key={parameter.id}
                          type="monotone"
                          dataKey={parameter.name}
                          stroke={getLineColor(parameter.name)}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <p className="text-lg text-muted-foreground mb-4">
                  {selectedParameters.length === 0
                    ? "Please select at least one parameter to view historical data."
                    : "No data available for the selected time range."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default History;
