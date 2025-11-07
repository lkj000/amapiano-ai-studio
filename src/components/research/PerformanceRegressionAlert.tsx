import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, TrendingUp, X } from "lucide-react";
import { useTestHistory } from "@/hooks/useTestHistory";

interface RegressionAlert {
  metric: string;
  currentValue: number;
  baselineValue: number;
  percentageChange: number;
  severity: "warning" | "critical";
  testType: string;
}

export const PerformanceRegressionAlert = () => {
  const { history } = useTestHistory();
  const [alerts, setAlerts] = useState<RegressionAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!history || history.length < 2) return;

    const detectedAlerts: RegressionAlert[] = [];

    // Group by test type
    const testsByType: Record<string, typeof history> = {};
    history.forEach((test) => {
      if (!testsByType[test.test_type]) {
        testsByType[test.test_type] = [];
      }
      testsByType[test.test_type].push(test);
    });

    // Check each test type for regressions
    Object.entries(testsByType).forEach(([testType, tests]) => {
      if (tests.length < 2) return;

      // Sort by date
      const sortedTests = tests.sort(
        (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      );

      const latest = sortedTests[0];
      const baseline = sortedTests[Math.min(5, sortedTests.length - 1)]; // Use 5-test baseline

      if (!latest.summary_metrics || !baseline.summary_metrics) return;

      // Compare metrics
      Object.entries(latest.summary_metrics).forEach(([metric, currentValue]) => {
        if (typeof currentValue !== "number") return;

        const baselineValue = baseline.summary_metrics?.[metric];
        if (typeof baselineValue !== "number") return;

        // Calculate percentage change
        const percentageChange = ((currentValue - baselineValue) / baselineValue) * 100;

        // Define regression thresholds (metric-specific)
        const isRegression =
          (metric.toLowerCase().includes("latency") && percentageChange > 10) || // Latency increased by 10%
          (metric.toLowerCase().includes("quality") && percentageChange < -5) || // Quality decreased by 5%
          (metric.toLowerCase().includes("cache") && percentageChange < -15) || // Cache hit rate decreased by 15%
          (metric.toLowerCase().includes("error") && percentageChange > 20); // Error rate increased by 20%

        if (isRegression) {
          const severity: "warning" | "critical" =
            Math.abs(percentageChange) > 25 ? "critical" : "warning";

          detectedAlerts.push({
            metric,
            currentValue,
            baselineValue,
            percentageChange,
            severity,
            testType,
          });
        }
      });
    });

    setAlerts(detectedAlerts);
  }, [history]);

  const dismissAlert = (metric: string, testType: string) => {
    const key = `${testType}-${metric}`;
    setDismissed((prev) => new Set([...prev, key]));
  };

  const activeAlerts = alerts.filter(
    (alert) => !dismissed.has(`${alert.testType}-${alert.metric}`)
  );

  if (activeAlerts.length === 0) return null;

  return (
    <Card className="p-6 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <h3 className="font-semibold text-orange-900 dark:text-orange-100">
          Performance Regression Detected
        </h3>
        <Badge variant="destructive">{activeAlerts.length}</Badge>
      </div>

      <div className="space-y-3">
        {activeAlerts.map((alert, idx) => (
          <Alert
            key={idx}
            variant={alert.severity === "critical" ? "destructive" : "default"}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  {alert.percentageChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="capitalize">{alert.testType}</span> - {alert.metric}
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-medium">{alert.currentValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Baseline</p>
                      <p className="font-medium">{alert.baselineValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Change</p>
                      <p className="font-medium">
                        {alert.percentageChange > 0 ? "+" : ""}
                        {alert.percentageChange.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs">
                    Performance has regressed compared to the 5-test baseline average.
                  </p>
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.metric, alert.testType)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
};

export default PerformanceRegressionAlert;
