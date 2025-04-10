
import { useMemo } from 'react';
import { Parameter, StatusType } from '@/types/parameter';

export function useSystemStatus(parameters: Parameter[], connectionStatus: StatusType) {
  const systemStatus = useMemo((): StatusType => {
    if (connectionStatus === 'disconnected') return 'disconnected';
    if (connectionStatus === 'connecting') return 'connecting';
    
    if (parameters.some(p => p.status === 'alarm')) {
      return 'alarm';
    }
    
    if (parameters.some(p => p.status === 'warning')) {
      return 'warning';
    }
    
    return 'normal';
  }, [parameters, connectionStatus]);

  return systemStatus;
}
