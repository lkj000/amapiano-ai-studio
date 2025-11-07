import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingDown, TrendingUp, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RegressionDetectorProps {
  testResults?: any;
}

interface RegressionAlert {
  metric: string;
  category: string;
  current: number;
  baseline: number;
  change: number;
  severity: "critical" | "warning" | "info";
  timestamp: string;
}

export const RegressionDetector = ({ testResults }: RegressionDetectorProps) => {
  const [regressions, setRegressions] = useState<RegressionAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  const baselines = {
    sparse: {
      avgLatency: 150,
      cacheHitRate: 0.5
    },
    quantization: {
      ptq8bit: 80,
      svdquant8bit: 75
    },
    distributed: {
      edgeLoad: 10,
      cloudLoad: 10
    }
  };

  const detectRegressions = () => {
    setIsScanning(true);
    const detected: RegressionAlert[] = [];

    try {
      // Check sparse inference metrics
      if (testResults?.sparse) {
        const latency = testResults.sparse.avgLatency || 0;
        const cacheHit = testResults.sparse.cacheHitRate || 0;

        if (latency > baselines.sparse.avgLatency * 1.2) {
          detected.push({
            metric: "Average Latency",
            category: "Sparse Inference",
            current: latency,
            baseline: baselines.sparse.avgLatency,
            change: ((latency - baselines.sparse.avgLatency) / baselines.sparse.avgLatency) * 100,
            severity: latency > baselines.sparse.avgLatency * 1.5 ? "critical" : "warning",
            timestamp: new Date().toISOString()
          });
        }

        if (cacheHit < baselines.sparse.cacheHitRate * 0.8) {
          detected.push({
            metric: "Cache Hit Rate",
            category: "Sparse Inference",
            current: cacheHit * 100,
            baseline: baselines.sparse.cacheHitRate * 100,
            change: ((cacheHit - baselines.sparse.cacheHitRate) / baselines.sparse.cacheHitRate) * 100,
            severity: cacheHit < baselines.sparse.cacheHitRate * 0.6 ? "critical" : "warning",
            timestamp: new Date().toISOString()
          });
        }
      }

      // Check quantization metrics
      if (testResults?.quantization) {
        const ptq = testResults.quantization.ptq8bit || 0;
        const svd = testResults.quantization.svdquant8bit || 0;

        if (ptq < baselines.quantization.ptq8bit * 0.8) {
          detected.push({
            metric: "PTQ 8-bit Quality",
            category: "Quantization",
            current: ptq,
            baseline: baselines.quantization.ptq8bit,
            change: ((ptq - baselines.quantization.ptq8bit) / baselines.quantization.ptq8bit) * 100,
            severity: ptq < 0 ? "critical" : "warning",
            timestamp: new Date().toISOString()
          });
        }

        if (svd < baselines.quantization.svdquant8bit * 0.8) {
          detected.push({
            metric: "SVDQuant 8-bit Quality",
            category: "Quantization",
            current: svd,
            baseline: baselines.quantization.svdquant8bit,
            change: ((svd - baselines.quantization.svdquant8bit) / baselines.quantization.svdquant8bit) * 100,
            severity: svd < 0 ? "critical" : "warning",
            timestamp: new Date().toISOString()
          });
        }
      }

      setRegressions(detected);
      setLastScan(new Date());

      if (detected.length === 0) {
        toast.success("No regressions detected", {
          description: "All metrics are within acceptable ranges"
        });
      } else {
        const critical = detected.filter(r => r.severity === "critical").length;
        toast.warning(`${detected.length} regression(s) detected`, {
          description: critical > 0 ? `${critical} critical issue(s) require attention` : "Review warnings"
        });
      }
    } catch (error) {
      console.error("Error detecting regressions:", error);
      toast.error("Failed to detect regressions");
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // Auto-scan on mount if test results are available
    if (testResults) {
      detectRegressions();
    }
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive";
      case "warning":
        return "text-yellow-600 dark:text-yellow-500";
      default:
        return "text-blue-600 dark:text-blue-500";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const criticalCount = regressions.filter(r => r.severity === "critical").length;
  const warningCount = regressions.filter(r => r.severity === "warning").length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Regression Detection</h3>
              <p className="text-sm text-muted-foreground">
                Automated monitoring of performance degradation
              </p>
            </div>
          </div>
          <Button onClick={detectRegressions} disabled={isScanning} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning..." : "Scan Now"}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Regressions</div>
            <div className="text-3xl font-bold text-foreground">{regressions.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Critical Issues</div>
            <div className="text-3xl font-bold text-destructive">{criticalCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Warnings</div>
            <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
          </Card>
        </div>

        {lastScan && (
          <div className="text-sm text-muted-foreground mb-4">
            Last scan: {lastScan.toLocaleString()}
          </div>
        )}

        <div className="space-y-4">
          {regressions.length === 0 ? (
            <Card className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="font-semibold text-lg mb-2">No Regressions Detected</h4>
              <p className="text-sm text-muted-foreground">
                All metrics are performing within expected parameters
              </p>
            </Card>
          ) : (
            regressions.map((regression, index) => (
              <Card key={index} className="p-4 border-l-4" style={{
                borderLeftColor: regression.severity === "critical" ? "hsl(var(--destructive))" : 
                                 regression.severity === "warning" ? "#ca8a04" : "hsl(var(--primary))"
              }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {regression.change < 0 ? (
                      <TrendingDown className={`w-5 h-5 mt-1 ${getSeverityColor(regression.severity)}`} />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 mt-1 ${getSeverityColor(regression.severity)}`} />
                    )}
                    <div>
                      <div className="font-semibold text-foreground">{regression.metric}</div>
                      <div className="text-sm text-muted-foreground">{regression.category}</div>
                    </div>
                  </div>
                  {getSeverityBadge(regression.severity)}
                </div>

                <div className="space-y-2 ml-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Value:</span>
                    <span className={`font-mono font-semibold ${getSeverityColor(regression.severity)}`}>
                      {regression.current.toFixed(2)}{regression.metric.includes("Rate") ? "%" : regression.metric.includes("Latency") ? "ms" : "%"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Baseline:</span>
                    <span className="font-mono">{regression.baseline.toFixed(2)}{regression.metric.includes("Rate") ? "%" : regression.metric.includes("Latency") ? "ms" : "%"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change:</span>
                    <span className={`font-mono font-semibold ${getSeverityColor(regression.severity)}`}>
                      {regression.change > 0 ? "+" : ""}{regression.change.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.abs(regression.change)} 
                    className="h-2"
                  />
                </div>

                <div className="mt-3 ml-8 text-xs text-muted-foreground">
                  Detected: {new Date(regression.timestamp).toLocaleString()}
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 bg-muted/50">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Baseline Thresholds
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-2">Sparse Inference</div>
            <div className="space-y-1 text-muted-foreground">
              <div>• Latency: &lt;{baselines.sparse.avgLatency}ms</div>
              <div>• Cache Hit Rate: &gt;{(baselines.sparse.cacheHitRate * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Quantization</div>
            <div className="space-y-1 text-muted-foreground">
              <div>• PTQ 8-bit: &gt;{baselines.quantization.ptq8bit}%</div>
              <div>• SVDQuant 8-bit: &gt;{baselines.quantization.svdquant8bit}%</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
