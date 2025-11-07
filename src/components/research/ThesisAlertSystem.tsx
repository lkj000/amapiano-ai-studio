import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, BellOff, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { toast } from "sonner";

interface ThesisAlert {
  id: string;
  type: "success" | "warning" | "info" | "critical";
  title: string;
  message: string;
  pillar: string;
  timestamp: Date;
  dismissed: boolean;
}

interface ThesisAlertSystemProps {
  validationData: {
    sigeAudio?: { validated: boolean; cacheHitRate?: number; avgLatency?: number };
    nunchakuAudio?: { validated: boolean; qualityRetention?: number };
    distriFusionAudio?: { validated: boolean; edgeLoad?: number; cloudLoad?: number };
  };
}

export const ThesisAlertSystem = ({ validationData }: ThesisAlertSystemProps) => {
  const [alerts, setAlerts] = useState<ThesisAlert[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Generate alerts based on validation data
  useEffect(() => {
    const newAlerts: ThesisAlert[] = [];

    // SIGE-Audio alerts
    if (validationData.sigeAudio) {
      if (validationData.sigeAudio.validated) {
        newAlerts.push({
          id: `sige-validated-${Date.now()}`,
          type: "success",
          title: "SIGE-Audio Validated ✓",
          message: `Cache hit rate: ${validationData.sigeAudio.cacheHitRate}%, Latency: ${validationData.sigeAudio.avgLatency}ms - Target objectives met!`,
          pillar: "SIGE-Audio",
          timestamp: new Date(),
          dismissed: false
        });
      }

      if (validationData.sigeAudio.cacheHitRate && validationData.sigeAudio.cacheHitRate > 70) {
        newAlerts.push({
          id: `sige-excellent-${Date.now()}`,
          type: "success",
          title: "Exceptional Cache Performance",
          message: `SIGE-Audio achieving ${validationData.sigeAudio.cacheHitRate}% cache hit rate - exceeds thesis requirements`,
          pillar: "SIGE-Audio",
          timestamp: new Date(),
          dismissed: false
        });
      }
    }

    // Nunchaku-Audio alerts
    if (validationData.nunchakuAudio) {
      if (!validationData.nunchakuAudio.validated) {
        newAlerts.push({
          id: `nunchaku-pivot-${Date.now()}`,
          type: "warning",
          title: "Nunchaku-Audio: Pivot Required",
          message: "Quantization stability crisis identified. Recommend reframing as diagnostic study + QAT methodology development.",
          pillar: "Nunchaku-Audio",
          timestamp: new Date(),
          dismissed: false
        });
      }

      if (validationData.nunchakuAudio.qualityRetention && validationData.nunchakuAudio.qualityRetention < 0) {
        newAlerts.push({
          id: `nunchaku-critical-${Date.now()}`,
          type: "critical",
          title: "Critical Quality Degradation",
          message: `Quality retention: ${validationData.nunchakuAudio.qualityRetention}% - Novel research problem discovered requiring foundational work`,
          pillar: "Nunchaku-Audio",
          timestamp: new Date(),
          dismissed: false
        });
      }
    }

    // DistriFusion-Audio alerts
    if (validationData.distriFusionAudio) {
      if (validationData.distriFusionAudio.validated) {
        newAlerts.push({
          id: `distri-validated-${Date.now()}`,
          type: "success",
          title: "DistriFusion-Audio Validated ✓",
          message: `Load distribution working: Edge ${validationData.distriFusionAudio.edgeLoad}, Cloud ${validationData.distriFusionAudio.cloudLoad}`,
          pillar: "DistriFusion-Audio",
          timestamp: new Date(),
          dismissed: false
        });
      } else if (validationData.distriFusionAudio.edgeLoad === 0 && validationData.distriFusionAudio.cloudLoad === 0) {
        newAlerts.push({
          id: `distri-debug-${Date.now()}`,
          type: "info",
          title: "DistriFusion-Audio: Debug Mode",
          message: "No active load detected. Run diagnostic tests to validate job routing and load distribution.",
          pillar: "DistriFusion-Audio",
          timestamp: new Date(),
          dismissed: false
        });
      }
    }

    // Thesis milestone alerts
    const validatedCount = [
      validationData.sigeAudio?.validated,
      validationData.nunchakuAudio?.validated,
      validationData.distriFusionAudio?.validated
    ].filter(Boolean).length;

    if (validatedCount >= 2) {
      newAlerts.push({
        id: `milestone-major-${Date.now()}`,
        type: "success",
        title: "Major Thesis Milestone",
        message: `${validatedCount}/3 pillars validated - thesis defense readiness increasing`,
        pillar: "Overall",
        timestamp: new Date(),
        dismissed: false
      });
    }

    // Only add new alerts that aren't already in the list
    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const filtered = newAlerts.filter(a => !existingIds.has(a.id));
      return [...filtered, ...prev].slice(0, 20); // Keep last 20 alerts
    });

    setLastCheck(new Date());
  }, [validationData]);

  // Show toast for new critical alerts
  useEffect(() => {
    if (notificationsEnabled) {
      const recentCritical = alerts.filter(
        a => a.type === "critical" && !a.dismissed && 
        (new Date().getTime() - a.timestamp.getTime()) < 5000
      );

      recentCritical.forEach(alert => {
        toast.error(alert.title, {
          description: alert.message,
        });
      });
    }
  }, [alerts, notificationsEnabled]);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const clearAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })));
    toast.success("All alerts dismissed");
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.type === "critical").length;
  const warningCount = activeAlerts.filter(a => a.type === "warning").length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "critical": return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === "critical" ? "destructive" : "default";
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Thesis Alerts
          </h3>
          {criticalCount > 0 && (
            <Badge variant="destructive">{criticalCount} Critical</Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary">{warningCount} Warning</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setNotificationsEnabled(!notificationsEnabled);
              toast.success(notificationsEnabled ? "Notifications disabled" : "Notifications enabled");
            }}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          {activeAlerts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllAlerts}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {activeAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active alerts. All thesis validation checks passing.
          </p>
        ) : (
          activeAlerts.map((alert) => (
            <Alert key={alert.id} variant={getAlertVariant(alert.type)} className="relative pr-12">
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <AlertTitle className="mb-1 flex items-center gap-2">
                    {alert.title}
                    <Badge variant="outline" className="text-xs">
                      {alert.pillar}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {alert.message}
                  </AlertDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => dismissAlert(alert.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </Alert>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Last checked: {lastCheck.toLocaleTimeString()} • {activeAlerts.length} active alerts
        </p>
      </div>
    </Card>
  );
};
