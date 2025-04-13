
export type ParameterStatus = 'normal' | 'warning' | 'alarm';
export type StatusType = 'normal' | 'warning' | 'alarm' | 'disconnected' | 'connecting';

export interface Parameter {
  id: string;
  name: string;
  description: string;
  unit: string;
  value: number;
  status: ParameterStatus;
  thresholds: {
    warning: {
      min: number | null;
      max: number | null;
    };
    alarm: {
      min: number | null;
      max: number | null;
    };
  };
  timestamp: string;
  category: string;
}

export interface ParameterHistoryEntry {
  timestamp: string;
  value: number;
  status: ParameterStatus;
}

export interface ParameterHistory {
  parameterId: string;
  data: ParameterHistoryEntry[];
}

export interface Alert {
  id: string;
  parameterId: string;
  parameterName: string;
  value: number;
  threshold: number;
  status: 'warning' | 'alarm';
  timestamp: string;
  acknowledged: boolean;
  notified: boolean;
}

export interface PLCConnectionSettings {
  ip: string;
  port: string;
  protocol: 'opcua' | 'modbus' | 'ethernet-ip' | 'snap7' | 's7comm';
  autoReconnect: boolean;
}

// For database compatibility
export interface ParameterHistoryRecord {
  id?: string;
  parameter_id: string;
  value: number;
  status: ParameterStatus;
  timestamp: string;
  created_at?: string;
}

// Add history data entry interface for the history page
export interface HistoryDataEntry {
  parameter_id: string;
  value: number;
  status: ParameterStatus;
  timestamp: string;
}
