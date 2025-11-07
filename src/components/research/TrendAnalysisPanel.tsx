import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTrendAnalysis } from "@/hooks/useTrendAnalysis";

export const TrendAnalysisPanel = () => {
  const { trends, anomalies, isLoading, refreshAnalysis } = useTrendAnalysis();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Trend Analysis & Anomaly Detection</h3>
          </div>
          <Button onClick={refreshAnalysis} variant="outline" size="sm">
            Refresh Analysis
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Analyzing historical test data to identify performance trends and detect anomalies
        </p>
      </Card>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h4 className="font-semibold">Detected Anomalies ({anomalies.length})</h4>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{anomaly.metricName}</span>
                    <Badge variant="destructive" className="text-xs">
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Value: {anomaly.value.toFixed(2)} (Expected: {anomaly.expectedRange.min.toFixed(2)} - {anomaly.expectedRange.max.toFixed(2)})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Detected on {new Date(anomaly.timestamp).toLocaleDateString()}
                  </p>
                </div>
                {anomaly.deviation > 0 ? (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-blue-500" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trends Charts */}
      {Object.entries(trends).map(([metricType, trendData]) => (
        <Card key={metricType} className="p-6">
          <h4 className="font-semibold mb-4 capitalize">{metricType} Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData.dataPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => value.toFixed(2)}
              />
              <Legend />
              <ReferenceLine
                y={trendData.mean}
                stroke="green"
                strokeDasharray="3 3"
                label="Mean"
              />
              <ReferenceLine
                y={trendData.mean + trendData.stdDev}
                stroke="orange"
                strokeDasharray="3 3"
                label="+1σ"
              />
              <ReferenceLine
                y={trendData.mean - trendData.stdDev}
                stroke="orange"
                strokeDasharray="3 3"
                label="-1σ"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Mean</p>
              <p className="text-sm font-medium">{trendData.mean.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Std Dev</p>
              <p className="text-sm font-medium">{trendData.stdDev.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Min</p>
              <p className="text-sm font-medium">{trendData.min.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max</p>
              <p className="text-sm font-medium">{trendData.max.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      ))}

      {Object.keys(trends).length === 0 && anomalies.length === 0 && (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No historical data available. Run some tests to see trends and anomalies.
          </p>
        </Card>
      )}
    </div>
  );
};

export default TrendAnalysisPanel;
