import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  BarChart3,
  Info
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimePerformanceMonitoring } from '@/hooks/useRealtimePerformanceMonitoring';

interface Benchmark {
  id: string;
  benchmark_name: string;
  metric_type: 'latency' | 'cpu' | 'throughput' | 'cost';
  industry_average: number;
  percentile_50: number;
  percentile_75: number;
  percentile_90: number;
  percentile_95: number;
  percentile_99: number;
  unit: string;
  description: string;
  source: string;
}

export function PerformanceBenchmarkPanel() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { metrics } = useRealtimePerformanceMonitoring();

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_benchmarks')
        .select('*')
        .order('metric_type');

      if (error) throw error;
      setBenchmarks((data || []) as Benchmark[]);
    } catch (error) {
      console.error('Error loading benchmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserPercentile = (userValue: number, benchmark: Benchmark): number => {
    if (userValue <= benchmark.percentile_50) return 50;
    if (userValue <= benchmark.percentile_75) return 75;
    if (userValue <= benchmark.percentile_90) return 90;
    if (userValue <= benchmark.percentile_95) return 95;
    if (userValue <= benchmark.percentile_99) return 99;
    return 100;
  };

  const getUserMetricValue = (metricType: string): number | null => {
    if (!metrics.length) return null;

    const relevantMetrics = metrics.filter(m => m.metric_type === metricType);
    if (!relevantMetrics.length) return null;

    const sum = relevantMetrics.reduce((acc, m) => acc + Number(m.value), 0);
    return sum / relevantMetrics.length;
  };

  const getPerformanceColor = (percentile: number): string => {
    if (percentile <= 50) return 'text-green-500';
    if (percentile <= 75) return 'text-blue-500';
    if (percentile <= 90) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceLabel = (percentile: number): string => {
    if (percentile <= 50) return 'Top 50% - Excellent';
    if (percentile <= 75) return 'Top 25% - Good';
    if (percentile <= 90) return 'Top 10% - Average';
    return 'Below Average';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Loading benchmarks...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Performance Benchmarking
          </CardTitle>
          <CardDescription>
            Compare your performance against industry standards and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Benchmarks are based on industry surveys and represent typical performance
              across similar AI music generation platforms.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarks.map(benchmark => {
          const userValue = getUserMetricValue(benchmark.metric_type);
          const percentile = userValue ? calculateUserPercentile(userValue, benchmark) : null;
          const hasData = userValue !== null;

          return (
            <Card key={benchmark.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{benchmark.benchmark_name}</CardTitle>
                  {hasData && percentile && (
                    <Badge className={getPerformanceColor(percentile)}>
                      {getPerformanceLabel(percentile)}
                    </Badge>
                  )}
                </div>
                <CardDescription>{benchmark.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasData && userValue ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Your Performance</span>
                      <span className="text-2xl font-bold">
                        {userValue.toFixed(2)} {benchmark.unit}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>vs. Industry Average</span>
                        <span className="font-medium">
                          {benchmark.industry_average} {benchmark.unit}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((userValue / benchmark.industry_average) * 100, 100)}
                        className="h-2"
                      />
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="text-sm font-medium mb-2">Percentile Breakdown</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded bg-muted">
                          <span>50th</span>
                          <span className="font-medium">{benchmark.percentile_50} {benchmark.unit}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-muted">
                          <span>75th</span>
                          <span className="font-medium">{benchmark.percentile_75} {benchmark.unit}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-muted">
                          <span>90th</span>
                          <span className="font-medium">{benchmark.percentile_90} {benchmark.unit}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-muted">
                          <span>99th</span>
                          <span className="font-medium">{benchmark.percentile_99} {benchmark.unit}</span>
                        </div>
                      </div>
                    </div>

                    {percentile && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-2">
                          {percentile <= 75 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            You're in the <strong>{percentile}th percentile</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No data available yet</p>
                    <p className="text-xs mt-1">
                      Start generating music to see how you compare
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t text-xs text-muted-foreground">
                  Source: {benchmark.source}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
