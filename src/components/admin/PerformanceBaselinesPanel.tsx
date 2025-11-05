import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Baseline {
  metric_type: string;
  baseline_value: number;
  current_value: number;
  deviation_percent: number;
  status: 'good' | 'warning' | 'critical';
}

export const PerformanceBaselinesPanel = () => {
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null);

  const calculateBaselines = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view baselines");
        return;
      }

      // Fetch historical metrics from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: historicalMetrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo);

      if (error) throw error;

      if (!historicalMetrics || historicalMetrics.length === 0) {
        toast.info("Not enough historical data to calculate baselines");
        return;
      }

      // Calculate baselines by metric type
      const metricTypes = ['latency', 'cpu', 'throughput', 'cost'];
      const calculatedBaselines: Baseline[] = [];

      for (const metricType of metricTypes) {
        const metricsOfType = historicalMetrics.filter(m => m.metric_type === metricType);
        
        if (metricsOfType.length === 0) continue;

        // Calculate baseline (average of historical data)
        const baselineValue = metricsOfType.reduce((sum, m) => sum + m.value, 0) / metricsOfType.length;

        // Get recent metrics (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentMetrics = metricsOfType.filter(m => m.created_at >= oneDayAgo);

        if (recentMetrics.length === 0) continue;

        const currentValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
        const deviationPercent = ((currentValue - baselineValue) / baselineValue) * 100;

        // Determine status based on deviation
        let status: 'good' | 'warning' | 'critical' = 'good';
        if (Math.abs(deviationPercent) > 50) {
          status = 'critical';
        } else if (Math.abs(deviationPercent) > 25) {
          status = 'warning';
        }

        calculatedBaselines.push({
          metric_type: metricType,
          baseline_value: baselineValue,
          current_value: currentValue,
          deviation_percent: deviationPercent,
          status
        });
      }

      setBaselines(calculatedBaselines);
      setLastCalculated(new Date());
      toast.success("Baselines calculated successfully");
    } catch (error) {
      console.error("Error calculating baselines:", error);
      toast.error("Failed to calculate baselines");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateBaselines();
  }, []);

  const getStatusIcon = (status: Baseline['status']) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Baseline['status']) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-500">Normal</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
    }
  };

  const formatMetricValue = (type: string, value: number) => {
    switch (type) {
      case 'latency':
        return `${value.toFixed(0)}ms`;
      case 'cpu':
        return `${value.toFixed(1)}%`;
      case 'cost':
        return `$${value.toFixed(4)}`;
      case 'throughput':
        return value.toFixed(1);
      default:
        return value.toFixed(2);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Baselines</CardTitle>
            <CardDescription>
              Compare current performance against 30-day historical averages
            </CardDescription>
          </div>
          <Button
            onClick={calculateBaselines}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        </div>
        {lastCalculated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last calculated: {lastCalculated.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {baselines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No baseline data available. Record some metrics to establish baselines.
          </div>
        ) : (
          <div className="space-y-4">
            {baselines.map((baseline) => (
              <div key={baseline.metric_type} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(baseline.status)}
                    <span className="font-semibold capitalize">{baseline.metric_type}</span>
                  </div>
                  {getStatusBadge(baseline.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Baseline (30d avg)</p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(baseline.metric_type, baseline.baseline_value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current (24h avg)</p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(baseline.metric_type, baseline.current_value)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deviation</span>
                    <div className="flex items-center gap-2">
                      {baseline.deviation_percent > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                      <span className={baseline.deviation_percent > 0 ? 'text-red-500' : 'text-green-500'}>
                        {Math.abs(baseline.deviation_percent).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(Math.abs(baseline.deviation_percent), 100)}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
