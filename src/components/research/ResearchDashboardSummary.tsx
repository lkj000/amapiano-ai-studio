import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import { useTestHistory } from "@/hooks/useTestHistory";
import { useTrendAnalysis } from "@/hooks/useTrendAnalysis";

export const ResearchDashboardSummary = () => {
  const { history, isLoading } = useTestHistory();
  const { anomalies } = useTrendAnalysis();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  // Calculate summary stats
  const totalTests = history.length;
  const recentTests = history.filter(
    (test) => new Date(test.test_date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  const testsByType = history.reduce((acc, test) => {
    acc[test.test_type] = (acc[test.test_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get latest metrics for each test type
  const latestMetrics: Record<string, any> = {};
  ["sparse", "quantization", "distributed"].forEach((type) => {
    const testsOfType = history
      .filter((t) => t.test_type === type)
      .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());

    if (testsOfType.length > 0) {
      latestMetrics[type] = testsOfType[0].summary_metrics;
    }
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <FlaskConical className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Research Dashboard Summary</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tests */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Tests Run</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{totalTests}</p>
            {recentTests > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{recentTests} this week
              </Badge>
            )}
          </div>
        </div>

        {/* Anomalies */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Anomalies Detected</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{anomalies.length}</p>
            {anomalies.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Test Types */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Test Coverage</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(testsByType).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-xs capitalize">
                {type}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Performance Trend */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Performance Trend</p>
          <div className="flex items-center gap-2">
            {latestMetrics.sparse?.avgLatency && (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-sm font-medium">
                  {latestMetrics.sparse.avgLatency.toFixed(0)}ms latency
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sparse Inference */}
        {latestMetrics.sparse && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sparse Inference</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cache Hit Rate</span>
                <span className="font-medium">
                  {latestMetrics.sparse.cacheHitRate?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg Latency</span>
                <span className="font-medium">
                  {latestMetrics.sparse.avgLatency?.toFixed(1)}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quantization */}
        {latestMetrics.quantization && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Quantization</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg Compression</span>
                <span className="font-medium">
                  {latestMetrics.quantization.avgCompressionRatio?.toFixed(1)}x
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg Quality</span>
                <span className="font-medium">
                  {latestMetrics.quantization.avgQualityRetained?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Distributed */}
        {latestMetrics.distributed && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Distributed Inference</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Edge Load</span>
                <span className="font-medium">{latestMetrics.distributed.edgeLoad}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cloud Load</span>
                <span className="font-medium">{latestMetrics.distributed.cloudLoad}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResearchDashboardSummary;
