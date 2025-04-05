
export type ParameterStatus = 'normal' | 'warning' | 'alarm';

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
