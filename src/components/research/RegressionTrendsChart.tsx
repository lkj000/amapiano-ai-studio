import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const RegressionTrendsChart = () => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("all");

  const fetchRegressionHistory = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view regression history");
        return;
      }

      const { data, error } = await supabase
        .from('regression_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Transform data for charting
      const chartData = transformDataForChart(data || []);
      setHistoricalData(chartData);

      if (!data || data.length === 0) {
        toast.info("No regression history found", {
          description: "Run tests to start tracking metrics"
        });
      }
    } catch (error) {
      console.error("Error fetching regression history:", error);
      toast.error("Failed to fetch regression history");
    } finally {
      setIsLoading(false);
    }
  };

  const transformDataForChart = (data: any[]) => {
    // Group by timestamp and aggregate metrics
    const grouped = data.reduce((acc: any, item: any) => {
      const timestamp = new Date(item.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (!acc[timestamp]) {
        acc[timestamp] = { timestamp };
      }

      // Add metric to this timestamp
      acc[timestamp][item.metric_name] = parseFloat(item.value);
      
      return acc;
    }, {});

    return Object.values(grouped);
  };

  useEffect(() => {
    fetchRegressionHistory();
  }, []);

  const metrics = [
    { name: "Average Latency", key: "Average Latency", color: "#8884d8" },
    { name: "Cache Hit Rate", key: "Cache Hit Rate", color: "#82ca9d" },
    { name: "PTQ 8-bit Quality", key: "PTQ 8-bit Quality", color: "#ffc658" },
    { name: "SVDQuant 8-bit Quality", key: "SVDQuant 8-bit Quality", color: "#ff7c7c" }
  ];

  const filteredMetrics = selectedMetric === "all" 
    ? metrics 
    : metrics.filter(m => m.key === selectedMetric);

  // Calculate trend statistics
  const calculateTrend = (metricKey: string) => {
    const values = historicalData
      .map(d => d[metricKey])
      .filter(v => v !== undefined);
    
    if (values.length < 2) return null;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      change: change.toFixed(1),
      isImproving: change < 0 // For latency, lower is better
    };
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-primary" />
            <div>
              <h3 className="text-xl font-semibold text-foreground">Regression Trends</h3>
              <p className="text-sm text-muted-foreground">
                Historical performance metrics over time
              </p>
            </div>
          </div>
          <Button onClick={fetchRegressionHistory} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={selectedMetric === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMetric("all")}
          >
            All Metrics
          </Button>
          {metrics.map((metric) => (
            <Button
              key={metric.key}
              variant={selectedMetric === metric.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMetric(metric.key)}
            >
              {metric.name}
            </Button>
          ))}
        </div>

        {historicalData.length > 0 ? (
          <>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {filteredMetrics.map((metric) => (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {metrics.map((metric) => {
                const trend = calculateTrend(metric.key);
                if (!trend) return null;

                return (
                  <Card key={metric.key} className="p-4">
                    <div className="text-sm text-muted-foreground mb-1">{metric.name}</div>
                    <div className="flex items-center gap-2">
                      {trend.isImproving ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      )}
                      <span className={`text-lg font-bold ${trend.isImproving ? 'text-green-500' : 'text-destructive'}`}>
                        {parseFloat(trend.change) > 0 ? '+' : ''}{trend.change}%
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card className="p-8 text-center">
            <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold text-lg mb-2">No Historical Data</h4>
            <p className="text-sm text-muted-foreground">
              Run regression detection tests to start tracking metrics over time
            </p>
          </Card>
        )}
      </Card>
    </div>
  );
};
