
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

  if (!isOffline) return null;

  return (
    <Badge 
      variant="outline" 
      className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1 px-2 py-1"
    >
      <WifiOff size={14} />
      Offline Mode
    </Badge>
  );
};

export default OfflineIndicator;
