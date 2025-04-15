
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Badge 
      variant="outline" 
      className={isOffline ? 
        "bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1 px-2 py-1" :
        "bg-green-100 text-green-800 border-green-300 flex items-center gap-1 px-2 py-1"
      }
    >
      {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
      {isOffline ? "Offline Mode" : "Online"}
    </Badge>
  );
};

export default OfflineIndicator;
