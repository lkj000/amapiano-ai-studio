import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Zap, Users, Globe } from "lucide-react";

const ThesisResearchDashboard = () => {
  // Simulated research metrics
  const systemMetrics = {
    modelAccuracy: 94.2,
    culturalFidelity: 91.8,
    latency: 127, // ms
    throughput: 23.4, // tracks/min
    userSatisfaction: 4.6,
    edgeOffloadRatio: 67.3,
  };

  const performanceData = [
    { name: "Baseline", latency: 450, quality: 72, throughput: 8.2 },
    { name: "Edge-Only", latency: 280, quality: 78, throughput: 12.5 },
    { name: "Cloud-Only", latency: 520, quality: 88, throughput: 18.3 },
    { name: "Hybrid (Ours)", latency: 127, quality: 94, throughput: 23.4 },
  ];

  const culturalMetrics = [
    { style: "Log Drum", preservation: 96, authenticity: 94 },
    { style: "Piano Motifs", preservation: 93, authenticity: 91 },
    { style: "Bass Patterns", preservation: 95, authenticity: 93 },
    { style: "Vocal Samples", preservation: 89, authenticity: 87 },
  ];

  const contributions = [
    {
      title: "Amapianorize Engine",
      description: "Cultural style transfer with 94.2% fidelity",
      progress: 95,
      status: "Validated",
    },
    {
      title: "AURA-X Federated Learning",
      description: "Privacy-preserving distributed training across 847 nodes",
      progress: 88,
      status: "In Progress",
    },
    {
      title: "VAST Real-time Engine",
      description: "127ms latency, 3.6x speedup over baselines",
      progress: 92,
      status: "Validated",
    },
    {
      title: "Hybrid Edge-Cloud",
      description: "67% edge offload, 4.2x energy efficiency",
      progress: 89,
      status: "Validated",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.modelAccuracy}%</div>
            <Progress value={systemMetrics.modelAccuracy} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +2.3% vs baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cultural Fidelity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.culturalFidelity}%</div>
            <Progress value={systemMetrics.culturalFidelity} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Globe className="w-3 h-3 inline mr-1" />
              Amapiano-specific
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.latency}ms</div>
            <Progress value={100 - (systemMetrics.latency / 5)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Zap className="w-3 h-3 inline mr-1" />
              3.6x faster
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.throughput}</div>
            <p className="text-xs text-muted-foreground">tracks/minute</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Users className="w-3 h-3 inline mr-1" />
              847 active nodes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Thesis Contributions */}
      <Card>
        <CardHeader>
          <CardTitle>Thesis Contributions</CardTitle>
          <CardDescription>Four major research contributions validated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contributions.map((contribution, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{contribution.title}</h4>
                  <p className="text-sm text-muted-foreground">{contribution.description}</p>
                </div>
                <Badge variant={contribution.status === "Validated" ? "default" : "secondary"}>
                  {contribution.status}
                </Badge>
              </div>
              <Progress value={contribution.progress} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance Comparison</CardTitle>
          <CardDescription>Hybrid approach vs. traditional architectures</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="latency" fill="hsl(var(--primary))" name="Latency (ms)" />
              <Bar yAxisId="left" dataKey="quality" fill="hsl(var(--accent))" name="Quality Score" />
              <Bar yAxisId="right" dataKey="throughput" fill="hsl(var(--secondary))" name="Throughput" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cultural Preservation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Cultural Style Preservation</CardTitle>
          <CardDescription>Amapiano-specific element fidelity metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={culturalMetrics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="style" type="category" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="preservation" fill="hsl(var(--primary))" name="Preservation %" />
              <Bar dataKey="authenticity" fill="hsl(var(--accent))" name="Authenticity %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThesisResearchDashboard;
