import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtimePerformanceMonitoring } from "@/hooks/useRealtimePerformanceMonitoring";
import { useDistributedInference } from "@/hooks/useDistributedInference";
import { useSparseInferenceCache } from "@/hooks/useSparseInferenceCache";
import { Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from "react";

interface ThesisMetric {
  hypothesis: string;
  status: 'passing' | 'warning' | 'failing';
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export const LiveThesisMonitor = () => {
  const { metrics, isConnected } = useRealtimePerformanceMonitoring();
  const { stats: distriStats, isInitialized } = useDistributedInference();
  const { stats: cacheStats } = useSparseInferenceCache();

  const [thesisMetrics, setThesisMetrics] = useState<ThesisMetric[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<any[]>([]);

  useEffect(() => {
    // Update thesis metrics based on live data
    const sigeLatency = metrics
      .filter(m => m.metric_type === 'latency')
      .slice(-1)[0]?.value || 0;

    const newMetrics: ThesisMetric[] = [
      {
        hypothesis: 'SIGE-Audio: Sparse Inference',
        status: sigeLatency < 150 ? 'passing' : sigeLatency < 200 ? 'warning' : 'failing',
        currentValue: sigeLatency,
        targetValue: 150,
        unit: 'ms',
        trend: sigeLatency < 150 ? 'down' : 'up'
      },
      {
        hypothesis: 'SIGE-Audio: Cache Hit Rate',
        status: cacheStats.hitRate > 50 ? 'passing' : cacheStats.hitRate > 30 ? 'warning' : 'failing',
        currentValue: cacheStats.hitRate,
        targetValue: 50,
        unit: '%',
        trend: cacheStats.hitRate > 50 ? 'up' : 'down'
      },
      {
        hypothesis: 'DistriFusion: Edge Load',
        status: distriStats.edgeLoad > 0 ? 'passing' : 'warning',
        currentValue: distriStats.edgeLoad,
        targetValue: 1,
        unit: 'jobs',
        trend: distriStats.edgeLoad > 0 ? 'up' : 'stable'
      },
      {
        hypothesis: 'DistriFusion: Cloud Load',
        status: distriStats.cloudLoad > 0 ? 'passing' : 'warning',
        currentValue: distriStats.cloudLoad,
        targetValue: 1,
        unit: 'jobs',
        trend: distriStats.cloudLoad > 0 ? 'up' : 'stable'
      }
    ];

    setThesisMetrics(newMetrics);

    // Update latency history
    if (sigeLatency > 0) {
      setLatencyHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString(),
          latency: sigeLatency,
          target: 150
        }];
        return newHistory.slice(-20); // Keep last 20 points
      });
    }
  }, [metrics, distriStats, cacheStats]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passing': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'failing': return <AlertCircle className="w-5 h-5 text-destructive" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passing': return <Badge className="bg-green-500">Validated</Badge>;
      case 'warning': return <Badge variant="secondary">Needs Review</Badge>;
      case 'failing': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Live Thesis Monitoring Dashboard
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time validation of doctoral thesis hypotheses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-destructive'} animate-pulse`} />
          <span className="text-sm">{isConnected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Real-time Hypothesis Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {thesisMetrics.map((metric, idx) => (
          <Card key={idx} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(metric.status)}
                <h4 className="font-semibold text-sm">{metric.hypothesis}</h4>
              </div>
              {getStatusBadge(metric.status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metric.currentValue.toFixed(1)}</span>
                <span className="text-muted-foreground">{metric.unit}</span>
                {metric.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Target: {metric.targetValue} {metric.unit}
                {metric.status === 'passing' && ' ✓ Met'}
                {metric.status === 'warning' && ' ⚠ Close'}
                {metric.status === 'failing' && ' ✗ Not Met'}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Real-time Latency Chart */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">SIGE-Audio: Real-Time Latency</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={latencyHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="latency" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              name="Current Latency"
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target (150ms)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* System Status Summary */}
      <Card className="p-6 border-primary">
        <h4 className="text-lg font-semibold mb-4">Thesis Validation Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Hypotheses Validated</p>
            <p className="text-3xl font-bold">
              {thesisMetrics.filter(m => m.status === 'passing').length}/{thesisMetrics.length}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">System Status</p>
            <p className="text-lg font-semibold">
              {isInitialized ? '✓ Operational' : '⚠ Initializing'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Data Connection</p>
            <p className="text-lg font-semibold">
              {isConnected ? '✓ Live Streaming' : '✗ Offline'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
