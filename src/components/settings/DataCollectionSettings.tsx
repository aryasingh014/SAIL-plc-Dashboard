
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DataCollectionSettings = () => {
  const [pollingRate, setPollingRate] = useState(5);
  const [historicalLogging, setHistoricalLogging] = useState(true);
  const [alarmNotifications, setAlarmNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save settings to localStorage
      const settings = {
        pollingRate,
        historicalLogging,
        alarmNotifications
      };
      
      localStorage.setItem('dataCollectionSettings', JSON.stringify(settings));
      
      toast("Settings Saved", {
        description: "Data collection settings have been updated."
      });
    } catch (error) {
      toast("Save Failed", {
        description: "Failed to save data collection settings."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Collection Settings</CardTitle>
        <CardDescription>
          Configure how the system collects and processes data from the PLC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="polling-rate">Polling Rate (seconds)</Label>
              <span className="text-sm font-medium">{pollingRate}s</span>
            </div>
            <Slider
              id="polling-rate"
              min={1}
              max={60}
              step={1}
              value={[pollingRate]}
              onValueChange={(value) => setPollingRate(value[0])}
            />
            <p className="text-sm text-muted-foreground">
              How often the system requests new data from the PLC.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="historical-logging">Historical Logging</Label>
              <p className="text-sm text-muted-foreground">
                Store historical data for trends and analysis
              </p>
            </div>
            <Switch
              id="historical-logging"
              checked={historicalLogging}
              onCheckedChange={setHistoricalLogging}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="alarm-notifications">Alarm Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when parameters exceed thresholds
              </p>
            </div>
            <Switch
              id="alarm-notifications"
              checked={alarmNotifications}
              onCheckedChange={setAlarmNotifications}
            />
          </div>
          
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataCollectionSettings;
