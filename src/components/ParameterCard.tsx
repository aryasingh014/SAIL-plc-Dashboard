
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusIndicator from './StatusIndicator';
import { Parameter, ParameterHistoryEntry } from '@/types/parameter';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { getMockParameterHistory } from '@/data/mockData';

interface ParameterCardProps {
  parameter: Parameter;
  className?: string;
  showGraph?: boolean;
}

const ParameterCard: React.FC<ParameterCardProps> = ({ 
  parameter, 
  className,
  showGraph = true
}) => {
  const [chartData, setChartData] = useState<ParameterHistoryEntry[]>([]);

  useEffect(() => {
    const history = getMockParameterHistory(parameter.id);
    // Take the latest 20 entries for the mini chart
    setChartData(history.data.slice(-20));
  }, [parameter.id]);

  // When parameter value changes, add a new data point
  useEffect(() => {
    setChartData(prev => {
      const newData = [...prev];
      if (newData.length >= 20) {
        newData.shift(); // Remove the oldest data point
      }
      newData.push({
        timestamp: parameter.timestamp,
        value: parameter.value,
        status: parameter.status
      });
      return newData;
    });
  }, [parameter.value, parameter.timestamp, parameter.status]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-medium">{parameter.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{parameter.description}</p>
        </div>
        <StatusIndicator status={parameter.status} />
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold">
            {parameter.value} <span className="text-sm text-muted-foreground">{parameter.unit}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(parameter.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        {showGraph && chartData.length > 0 && (
          <div className="h-24 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="timestamp" 
                  hide 
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  formatter={(value) => [`${value} ${parameter.unit}`, 'Value']}
                  labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={
                    parameter.status === 'normal' 
                      ? '#10B981' 
                      : parameter.status === 'warning' 
                        ? '#D97706' 
                        : '#DC2626'
                  } 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div>
            <p className="text-muted-foreground">Warning Range:</p>
            <p>
              {parameter.thresholds.warning.min !== null ? parameter.thresholds.warning.min : '-'} - 
              {parameter.thresholds.warning.max !== null ? parameter.thresholds.warning.max : '-'} 
              {parameter.unit}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Alarm Range:</p>
            <p>
              {parameter.thresholds.alarm.min !== null ? parameter.thresholds.alarm.min : '-'} - 
              {parameter.thresholds.alarm.max !== null ? parameter.thresholds.alarm.max : '-'} 
              {parameter.unit}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterCard;
