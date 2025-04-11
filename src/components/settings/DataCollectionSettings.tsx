
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DataCollectionSettings = () => {
  const [pollInterval, setPollInterval] = useState('5');
  const [dataRetention, setDataRetention] = useState('30');
  const [highResolutionHistory, setHighResolutionHistory] = useState(false);

  const handleSaveDataSettings = () => {
    toast({
      title: "Data Collection Settings Saved",
      description: "Data collection settings have been updated."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Collection Settings</CardTitle>
        <CardDescription>
          Configure how data is collected and stored from the PLC.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="poll-interval">Polling Interval (seconds)</Label>
            <Input 
              id="poll-interval" 
              type="number" 
              min="1" 
              max="60"
              value={pollInterval}
              onChange={(e) => setPollInterval(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="data-retention">Data Retention (days)</Label>
            <Input 
              id="data-retention" 
              type="number" 
              min="1" 
              max="365"
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="high-resolution" 
            checked={highResolutionHistory}
            onCheckedChange={setHighResolutionHistory}
          />
          <Label htmlFor="high-resolution">
            Enable high resolution historical data (increases storage requirements)
          </Label>
        </div>
        
        <Button onClick={handleSaveDataSettings}>Save Data Settings</Button>
      </CardContent>
    </Card>
  );
};

export default DataCollectionSettings;
