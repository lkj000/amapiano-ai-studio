import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Calendar } from "lucide-react";
import { toast } from "sonner";

interface AutomatedTestSchedulerProps {
  onRunTests: () => Promise<void>;
}

export const AutomatedTestScheduler = ({ onRunTests }: AutomatedTestSchedulerProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [interval, setInterval] = useState<string>("hourly");
  const [nextRun, setNextRun] = useState<Date | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setNextRun(null);
      return;
    }

    // Calculate next run time
    const now = new Date();
    const next = new Date(now);

    switch (interval) {
      case "15min":
        next.setMinutes(now.getMinutes() + 15);
        break;
      case "30min":
        next.setMinutes(now.getMinutes() + 30);
        break;
      case "hourly":
        next.setHours(now.getHours() + 1);
        break;
      case "daily":
        next.setDate(now.getDate() + 1);
        break;
      case "weekly":
        next.setDate(now.getDate() + 7);
        break;
    }

    setNextRun(next);

    // Set up interval
    const intervalMs = {
      "15min": 15 * 60 * 1000,
      "30min": 30 * 60 * 1000,
      "hourly": 60 * 60 * 1000,
      "daily": 24 * 60 * 60 * 1000,
      "weekly": 7 * 24 * 60 * 60 * 1000,
    }[interval] as number;

    const timer = window.setInterval(() => {
      if (isEnabled && !isRunning) {
        setIsRunning(true);
        toast.info("🤖 Automated test suite starting...");
        
        onRunTests().then(() => {
          setLastRun(new Date());
          toast.success("✅ Automated tests completed successfully");
        }).catch((error) => {
          console.error("Automated test failed:", error);
          toast.error("❌ Automated tests failed");
        }).finally(() => {
          setIsRunning(false);
        });
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isEnabled, interval, onRunTests, isRunning]);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (enabled) {
      toast.success("🔄 Automated testing enabled");
    } else {
      toast.info("⏸️ Automated testing paused");
    }
  };

  const runNow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    toast.info("▶️ Running tests manually...");
    
    try {
      await onRunTests();
      setLastRun(new Date());
      toast.success("✅ Manual test run completed");
    } catch (error) {
      console.error("Manual test failed:", error);
      toast.error("❌ Manual test run failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Automated Test Scheduling</h3>
          <p className="text-sm text-muted-foreground">
            Schedule tests to run automatically at regular intervals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isRunning}
          />
          <Label className="text-sm font-medium text-foreground">
            {isEnabled ? "Enabled" : "Disabled"}
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-sm text-muted-foreground mb-2 block">Test Interval</Label>
            <Select value={interval} onValueChange={setInterval} disabled={isRunning}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15min">Every 15 minutes</SelectItem>
                <SelectItem value="30min">Every 30 minutes</SelectItem>
                <SelectItem value="hourly">Every hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={runNow}
            disabled={isRunning}
            variant="outline"
            className="mt-6"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Now
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Next Run</p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {nextRun && isEnabled
                ? nextRun.toLocaleString()
                : "Not scheduled"}
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Last Run</p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {lastRun ? lastRun.toLocaleString() : "Never"}
            </p>
          </div>
        </div>

        {isEnabled && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-500 font-semibold">ℹ️ Info:</span> Tests will run 
              automatically {interval === "15min" ? "every 15 minutes" : 
                          interval === "30min" ? "every 30 minutes" :
                          interval === "hourly" ? "every hour" :
                          interval === "daily" ? "daily" : "weekly"}.
              Results will be saved to your test history.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
