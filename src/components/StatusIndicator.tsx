
import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'normal' | 'warning' | 'alarm' | 'disconnected' | 'connecting';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusClasses = {
  normal: 'bg-industrial-status-normal',
  warning: 'bg-industrial-status-warning',
  alarm: 'bg-industrial-status-alarm',
  disconnected: 'bg-gray-400',
  connecting: 'bg-blue-400'
};

const statusLabels = {
  normal: 'Normal',
  warning: 'Warning',
  alarm: 'Alarm',
  disconnected: 'Disconnected',
  connecting: 'Connecting'
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  label, 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "rounded-full animate-pulse-slow", 
        statusClasses[status], 
        sizeClasses[size]
      )} />
      {(label || statusLabels[status]) && (
        <span className="text-sm font-medium">{label || statusLabels[status]}</span>
      )}
    </div>
  );
};

export default StatusIndicator;
