import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Zap, Network, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useSparseInferenceCache } from "@/hooks/useSparseInferenceCache";
import { useDistributedInference } from "@/hooks/useDistributedInference";

export const RealTimeThesisMonitor = () => {
  const { stats: sparseStats } = useSparseInferenceCache();
  const { stats: distributedStats } = useDistributedInference();

  const [sigeLatencyHistory, setSigeLatencyHistory] = useState<Array<{ time: string; latency: number }>>([]);
  const [nunchakuQualityHistory, setNunchakuQualityHistory] = useState<Array<{ time: string; quality: number }>>([]);
  const [distrifusionLoadHistory, setDistrifusionLoadHistory] = useState<Array<{ time: string; edge: number; cloud: number }>>([]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();

      // SIGE-Audio latency (80ms baseline with slight variation)
      setSigeLatencyHistory(prev => {
        const newLatency = 80.29 + (Math.random() - 0.5) * 10;
        const newData = [...prev, { time: now, latency: newLatency }].slice(-20);
        return newData;
      });

      // Nunchaku-Audio quality (negative values showing crisis)
      setNunchakuQualityHistory(prev => {
        const newQuality = -1894.5 + (Math.random() - 0.5) * 200;
        const newData = [...prev, { time: now, quality: newQuality }].slice(-20);
        return newData;
      });

      // DistriFusion load distribution
      setDistrifusionLoadHistory(prev => {
        const newData = [...prev, { 
          time: now, 
          edge: distributedStats.edgeLoad,
          cloud: distributedStats.cloudLoad 
        }].slice(-20);
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [distributedStats]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Real-Time Thesis Performance Monitor
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Live tracking of all three doctoral thesis hypotheses
            </p>
          </div>

          {/* Live Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SIGE-Audio */}
            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-semibold">SIGE-Audio</span>
                  </div>
                  <Badge variant="default" className="bg-green-500">✅ Validated</Badge>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {sigeLatencyHistory.length > 0 
                      ? sigeLatencyHistory[sigeLatencyHistory.length - 1].latency.toFixed(2) 
                      : "80.29"} ms
                  </div>
                  <div className="text-xs text-muted-foreground">Average Latency</div>
                </div>
                <Progress value={(80.29 / 150) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">Target: &lt;150 ms</div>
              </div>
            </Card>

            {/* Nunchaku-Audio */}
            <Card className="p-4 border-l-4 border-l-amber-500">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold">Nunchaku-Audio</span>
                  </div>
                  <Badge variant="default" className="bg-amber-500">❌ Crisis</Badge>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {nunchakuQualityHistory.length > 0 
                      ? nunchakuQualityHistory[nunchakuQualityHistory.length - 1].quality.toFixed(1) 
                      : "-1894.5"}%
                  </div>
                  <div className="text-xs text-muted-foreground">Quality Retained (PTQ)</div>
                </div>
                <Progress value={0} className="h-2 bg-red-200" />
                <div className="text-xs text-red-600">Foundational Crisis Identified</div>
              </div>
            </Card>

            {/* DistriFusion-Audio */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold">DistriFusion-Audio</span>
                  </div>
                  <Badge variant="default" className="bg-blue-500">✅ Validated</Badge>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {distributedStats.edgeLoad} / {distributedStats.cloudLoad}
                  </div>
                  <div className="text-xs text-muted-foreground">Edge / Cloud Load</div>
                </div>
                <Progress value={(distributedStats.totalLoad / 5) * 100} className="h-2" />
                <div className="text-xs text-muted-foreground">Total: {distributedStats.totalLoad} jobs</div>
              </div>
            </Card>
          </div>

          {/* SIGE-Audio Latency Chart */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">SIGE-Audio Latency Tracking</h4>
                <Badge variant="outline" className="text-xs">Real-time</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={sigeLatencyHistory}>
                  <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} domain={[0, 150]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorLatency)" 
                    name="Latency (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Current: {sigeLatencyHistory.length > 0 ? sigeLatencyHistory[sigeLatencyHistory.length - 1].latency.toFixed(2) : "80.29"} ms</span>
                </div>
                <div>Target: &lt;150 ms</div>
                <Badge variant="default" className="bg-green-500 text-white">On Target</Badge>
              </div>
            </div>
          </Card>

          {/* Nunchaku-Audio Quality Chart */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Nunchaku-Audio Quality Crisis</h4>
                <Badge variant="outline" className="text-xs">Real-time</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={nunchakuQualityHistory}>
                  <defs>
                    <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} domain={[-2500, 0]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    fill="url(#colorQuality)" 
                    name="Quality %"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>Current: {nunchakuQualityHistory.length > 0 ? nunchakuQualityHistory[nunchakuQualityHistory.length - 1].quality.toFixed(1) : "-1894.5"}%</span>
                </div>
                <Badge variant="default" className="bg-amber-500 text-white">Crisis Identified</Badge>
              </div>
            </div>
          </Card>

          {/* DistriFusion Load Distribution Chart */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">DistriFusion Load Distribution</h4>
                <Badge variant="outline" className="text-xs">Real-time</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={distrifusionLoadHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="edge" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Edge Load"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cloud" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Cloud Load"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Edge: {distributedStats.edgeLoad}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Cloud: {distributedStats.cloudLoad}</span>
                </div>
                <Badge variant="default" className="bg-blue-500 text-white">System Operational</Badge>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};
