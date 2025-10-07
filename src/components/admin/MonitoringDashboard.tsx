/**
 * Monitoring Dashboard - Real-time system health and performance metrics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AuraBridge } from '@/lib/AuraBridge';
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';

export const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [functionMetrics, setFunctionMetrics] = useState<any[]>([]);

  useEffect(() => {
    const updateMetrics = () => {
      const current = AuraBridge.getMetrics();
      const byFunction = AuraBridge.getMetricsByFunction();
      
      setMetrics(current);
      setFunctionMetrics(byFunction);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500';
    if (latency < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-500';
    if (rate >= 85) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className={`h-4 w-4 ${getSuccessRateColor(metrics.successRate)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(metrics.successRate)}`}>
              {metrics.successRate.toFixed(1)}%
            </div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className={`h-4 w-4 ${getLatencyColor(metrics.avgLatency)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLatencyColor(metrics.avgLatency)}`}>
              {metrics.avgLatency}ms
            </div>
            <p className="text-xs text-muted-foreground">Target: &lt;100ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics.failed}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successful} successful
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Function-Level Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Function Performance
          </CardTitle>
          <CardDescription>
            Performance metrics by API function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {functionMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No function metrics available</p>
            ) : (
              functionMetrics.map((func) => (
                <div key={func.functionName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{func.functionName}</span>
                      <Badge variant="outline">{func.callCount} calls</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={getLatencyColor(func.avgLatency)}>
                        {func.avgLatency}ms
                      </span>
                      <span className={getSuccessRateColor(func.successRate)}>
                        {func.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={func.successRate} className="h-2" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent API Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Last 20 API calls with status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.recentCalls.map((call: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded border border-border"
              >
                <div className="flex items-center gap-3">
                  {call.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-mono">{call.functionName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={getLatencyColor(call.latency)}>
                    {Math.round(call.latency)}ms
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
