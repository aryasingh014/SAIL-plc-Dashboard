
import { Parameter, ParameterHistory, Alert } from '@/types/parameter';

// Mock parameters
export const mockParameters: Parameter[] = [
  {
    id: 'temp-001',
    name: 'Temperature Sensor 1',
    description: 'Main reactor temperature sensor',
    unit: '°C',
    value: 75.2,
    status: 'normal',
    thresholds: {
      warning: {
        min: 70,
        max: 85
      },
      alarm: {
        min: 60,
        max: 90
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Temperature'
  },
  {
    id: 'press-001',
    name: 'Pressure Sensor 1',
    description: 'Main line pressure',
    unit: 'bar',
    value: 5.7,
    status: 'warning',
    thresholds: {
      warning: {
        min: 4.5,
        max: 6.0
      },
      alarm: {
        min: 4.0,
        max: 6.5
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Pressure'
  },
  {
    id: 'flow-001',
    name: 'Flow Rate Sensor 1',
    description: 'Main line flow rate',
    unit: 'L/min',
    value: 22.3,
    status: 'normal',
    thresholds: {
      warning: {
        min: 15,
        max: 25
      },
      alarm: {
        min: 10,
        max: 30
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Flow'
  },
  {
    id: 'volt-001',
    name: 'Voltage Monitor 1',
    description: 'Main power supply voltage',
    unit: 'V',
    value: 232.8,
    status: 'normal',
    thresholds: {
      warning: {
        min: 220,
        max: 240
      },
      alarm: {
        min: 210,
        max: 250
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Electrical'
  },
  {
    id: 'amp-001',
    name: 'Current Monitor 1',
    description: 'Main power supply current',
    unit: 'A',
    value: 15.7,
    status: 'alarm',
    thresholds: {
      warning: {
        min: 10,
        max: 15
      },
      alarm: {
        min: 5,
        max: 15.5
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Electrical'
  },
  {
    id: 'ph-001',
    name: 'pH Level Sensor',
    description: 'Process fluid pH level',
    unit: 'pH',
    value: 7.2,
    status: 'normal',
    thresholds: {
      warning: {
        min: 6.5,
        max: 7.5
      },
      alarm: {
        min: 6.0,
        max: 8.0
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Chemical'
  },
  {
    id: 'level-001',
    name: 'Tank Level Sensor',
    description: 'Main tank fluid level',
    unit: '%',
    value: 68.3,
    status: 'normal',
    thresholds: {
      warning: {
        min: 20,
        max: 90
      },
      alarm: {
        min: 10,
        max: 95
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Level'
  },
  // New SAIL Demo Parameters
  {
    id: 'motor-001',
    name: 'Motor Speed',
    description: 'Main drive motor speed',
    unit: 'RPM',
    value: 1750,
    status: 'normal',
    thresholds: {
      warning: {
        min: 1600,
        max: 1800
      },
      alarm: {
        min: 1500,
        max: 1850
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Motor'
  },
  {
    id: 'torque-001',
    name: 'Drive Torque',
    description: 'Main drive torque output',
    unit: 'Nm',
    value: 85.4,
    status: 'normal',
    thresholds: {
      warning: {
        min: 70,
        max: 90
      },
      alarm: {
        min: 60,
        max: 95
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Motor'
  },
  {
    id: 'vibration-001',
    name: 'Vibration Sensor',
    description: 'Machine vibration level',
    unit: 'mm/s',
    value: 3.2,
    status: 'warning',
    thresholds: {
      warning: {
        min: 2.5,
        max: 4.0
      },
      alarm: {
        min: 0,
        max: 5.0
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Mechanical'
  },
  {
    id: 'humidity-001',
    name: 'Ambient Humidity',
    description: 'Control cabinet humidity',
    unit: '%RH',
    value: 45.7,
    status: 'normal',
    thresholds: {
      warning: {
        min: 30,
        max: 70
      },
      alarm: {
        min: 20,
        max: 80
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Environmental'
  },
  {
    id: 'temp-002',
    name: 'Ambient Temperature',
    description: 'Control cabinet temperature',
    unit: '°C',
    value: 24.3,
    status: 'normal',
    thresholds: {
      warning: {
        min: 15,
        max: 35
      },
      alarm: {
        min: 10,
        max: 40
      }
    },
    timestamp: new Date().toISOString(),
    category: 'Environmental'
  }
];

// Generate historical data with history of last 24 hours with 15 minute intervals
export const generateMockHistory = (parameterId: string, baseValue: number, variance: number): ParameterHistory => {
  const now = new Date();
  const data = [];
  
  for (let i = 0; i < 96; i++) { // 24 hours * 4 readings per hour = 96 readings
    const timestamp = new Date(now.getTime() - (i * 15 * 60 * 1000)).toISOString();
    const randomVariance = (Math.random() * variance * 2) - variance; // Value between -variance and +variance
    const value = baseValue + randomVariance;
    
    let status: 'normal' | 'warning' | 'alarm' = 'normal';
    const parameter = mockParameters.find(p => p.id === parameterId);
    
    if (parameter) {
      if (
        (parameter.thresholds.alarm.min !== null && value < parameter.thresholds.alarm.min) ||
        (parameter.thresholds.alarm.max !== null && value > parameter.thresholds.alarm.max)
      ) {
        status = 'alarm';
      } else if (
        (parameter.thresholds.warning.min !== null && value < parameter.thresholds.warning.min) ||
        (parameter.thresholds.warning.max !== null && value > parameter.thresholds.warning.max)
      ) {
        status = 'warning';
      }
    }
    
    data.push({
      timestamp,
      value,
      status
    });
  }
  
  return {
    parameterId,
    data: data.reverse() // Newest first
  };
};

// Mock alerts
export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    parameterId: 'press-001',
    parameterName: 'Pressure Sensor 1',
    value: 6.2,
    threshold: 6.0,
    status: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    acknowledged: false,
    notified: true
  },
  {
    id: 'alert-002',
    parameterId: 'amp-001',
    parameterName: 'Current Monitor 1',
    value: 15.7,
    threshold: 15.5,
    status: 'alarm',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    acknowledged: false,
    notified: true
  },
  {
    id: 'alert-003',
    parameterId: 'temp-001',
    parameterName: 'Temperature Sensor 1',
    value: 86.2,
    threshold: 85,
    status: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    acknowledged: true,
    notified: true
  }
];

// Utility to get history for a specific parameter
export const getMockParameterHistory = (parameterId: string): ParameterHistory => {
  const parameter = mockParameters.find(p => p.id === parameterId);
  if (!parameter) {
    return { parameterId, data: [] };
  }
  
  return generateMockHistory(parameterId, parameter.value, parameter.value * 0.15);
};

// Utility to get all parameters
export const getAllParameters = (): Parameter[] => {
  return mockParameters;
};

// Utility to get parameter by id
export const getParameterById = (id: string): Parameter | undefined => {
  return mockParameters.find(p => p.id === id);
};

// Utility to get all alerts
export const getAllAlerts = (): Alert[] => {
  return mockAlerts;
};
