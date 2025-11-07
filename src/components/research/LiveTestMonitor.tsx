import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Clock, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface TestMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  target?: number;
}

interface TestSuite {
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  duration: number;
  metrics: TestMetric[];
}

export const LiveTestMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: "SIGE-Audio Sparse Inference",
      status: 'completed',
      progress: 100,
      duration: 1250,
      metrics: [
        { name: "Avg Latency", value: 77.92, unit: "ms", status: 'good', trend: 'down', target: 150 },
        { name: "Cache Hit Rate", value: 70.0, unit: "%", status: 'good', trend: 'up' },
        { name: "Memory Usage", value: 245, unit: "MB", status: 'good', trend: 'stable' }
      ]
    },
    {
      name: "Nunchaku-Audio PTQ 8-bit",
      status: 'completed',
      progress: 100,
      duration: 3420,
      metrics: [
        { name: "Quality Retained", value: -1893.24, unit: "%", status: 'critical', trend: 'down', target: 85 },
        { name: "Compression Ratio", value: 4.0, unit: "x", status: 'good', trend: 'stable' },
        { name: "Processing Time", value: 892, unit: "ms", status: 'warning', trend: 'up' }
      ]
    },
    {
      name: "Nunchaku-Audio SVDQuant 8-bit",
      status: 'completed',
      progress: 100,
      duration: 4150,
      metrics: [
        { name: "Quality Retained", value: -7936.80, unit: "%", status: 'critical', trend: 'down', target: 90 },
        { name: "Compression Ratio", value: 4.0, unit: "x", status: 'good', trend: 'stable' },
        { name: "Processing Time", value: 1124, unit: "ms", status: 'warning', trend: 'up' }
      ]
    },
    {
      name: "DistriFusion-Audio System",
      status: 'failed',
      progress: 0,
      duration: 0,
      metrics: [
        { name: "Edge Load", value: 0, unit: "tasks", status: 'critical', trend: 'stable' },
        { name: "Cloud Load", value: 0, unit: "tasks", status: 'critical', trend: 'stable' },
        { name: "Distribution Ratio", value: 0, unit: "%", status: 'critical', trend: 'stable' }
      ]
    }
  ]);

  // Simulate live monitoring updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setTestSuites(prev => prev.map(suite => {
        if (suite.status === 'running' && suite.progress < 100) {
          return {
            ...suite,
            progress: Math.min(100, suite.progress + Math.random() * 10),
            duration: suite.duration + 100,
            metrics: suite.metrics.map(metric => ({
              ...metric,
              value: metric.value + (Math.random() - 0.5) * 2
            }))
          };
        }
        return suite;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Test Monitor
            </div>
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "Monitoring Active" : "Static View"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time monitoring of thesis validation tests and performance metrics
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Test Suites */}
      <div className="grid gap-4">
        {testSuites.map((suite, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(suite.status)} ${suite.status === 'running' ? 'animate-pulse' : ''}`} />
                  <CardTitle className="text-base">{suite.name}</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {suite.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDuration(suite.duration)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              {suite.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{suite.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={suite.progress} />
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suite.metrics.map((metric, metricIdx) => (
                  <div key={metricIdx} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {metric.name}
                      </span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                        {metric.value.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    {metric.target && (
                      <div className="text-xs text-muted-foreground">
                        Target: {metric.target} {metric.unit}
                        {metric.status === 'critical' && (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            Failed to meet target
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Status Message */}
              {suite.status === 'failed' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    Test suite failed - system bug detected. Requires debugging.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Suites</p>
              <p className="text-2xl font-bold">{testSuites.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {testSuites.filter(s => s.status === 'completed').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {testSuites.filter(s => s.status === 'failed').length}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="text-2xl font-bold">
                {formatDuration(testSuites.reduce((sum, s) => sum + s.duration, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
