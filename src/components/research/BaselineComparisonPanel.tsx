import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface ComparisonData {
  method: string;
  latency?: number;
  quality: number;
  compressionRatio?: number;
  memoryUsage?: number;
  powerEfficiency?: number;
  status: 'success' | 'failure' | 'warning';
}

export const BaselineComparisonPanel = () => {
  const [selectedObjective, setSelectedObjective] = useState<'sparse' | 'quantization' | 'distributed'>('sparse');

  // Sparse Inference Data (SIGE-Audio)
  const sparseData: ComparisonData[] = [
    { 
      method: "Baseline (No Optimization)", 
      latency: 450, 
      quality: 95, 
      memoryUsage: 512, 
      powerEfficiency: 60,
      status: 'warning' 
    },
    { 
      method: "Standard Caching", 
      latency: 320, 
      quality: 95, 
      memoryUsage: 480, 
      powerEfficiency: 65,
      status: 'warning' 
    },
    { 
      method: "SIGE-Audio (Proposed)", 
      latency: 77.92, 
      quality: 94, 
      memoryUsage: 245, 
      powerEfficiency: 92,
      status: 'success' 
    }
  ];

  // Quantization Data (Nunchaku-Audio)
  const quantizationData: ComparisonData[] = [
    { 
      method: "FP32 (No Quantization)", 
      quality: 100, 
      compressionRatio: 1, 
      memoryUsage: 512,
      powerEfficiency: 50,
      status: 'success' 
    },
    { 
      method: "PTQ 8-bit (Baseline)", 
      quality: -1893.24, 
      compressionRatio: 4, 
      memoryUsage: 128,
      powerEfficiency: 75,
      status: 'failure' 
    },
    { 
      method: "SVDQuant 8-bit (Proposed)", 
      quality: -7936.80, 
      compressionRatio: 4, 
      memoryUsage: 128,
      powerEfficiency: 78,
      status: 'failure' 
    },
    { 
      method: "PTQ 4-bit", 
      quality: -6828.23, 
      compressionRatio: 8, 
      memoryUsage: 64,
      powerEfficiency: 85,
      status: 'failure' 
    }
  ];

  // Distributed System Data (DistriFusion-Audio)
  const distributedData: ComparisonData[] = [
    { 
      method: "Cloud-Only", 
      latency: 850, 
      quality: 95, 
      memoryUsage: 0, 
      powerEfficiency: 40,
      status: 'warning' 
    },
    { 
      method: "Edge-Only", 
      latency: 120, 
      quality: 80, 
      memoryUsage: 512, 
      powerEfficiency: 95,
      status: 'warning' 
    },
    { 
      method: "DistriFusion (Proposed)", 
      latency: 0, 
      quality: 0, 
      memoryUsage: 0, 
      powerEfficiency: 0,
      status: 'failure' 
    }
  ];

  const getCurrentData = () => {
    switch (selectedObjective) {
      case 'sparse': return sparseData;
      case 'quantization': return quantizationData;
      case 'distributed': return distributedData;
      default: return sparseData;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'failure': return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500">Success</Badge>;
      case 'failure': return <Badge className="bg-red-500">Critical Failure</Badge>;
      case 'warning': return <Badge className="bg-yellow-500">Suboptimal</Badge>;
      default: return null;
    }
  };

  // Prepare radar chart data
  const radarData = getCurrentData().map(item => ({
    method: item.method.split(' ').slice(0, 2).join(' '),
    Quality: Math.max(0, Math.min(100, item.quality)),
    Performance: item.latency ? Math.max(0, 100 - (item.latency / 10)) : 50,
    Efficiency: item.powerEfficiency || 50,
    Memory: item.memoryUsage ? Math.max(0, 100 - (item.memoryUsage / 10)) : 50,
  }));

  const objectiveTitle = {
    sparse: "SIGE-Audio: Sparse Inference Comparison",
    quantization: "Nunchaku-Audio: Quantization Comparison",
    distributed: "DistriFusion-Audio: System Architecture Comparison"
  };

  const objectiveDescription = {
    sparse: "Comparing sparse inference methods for real-time music generation",
    quantization: "Comparing quantization methods for model compression",
    distributed: "Comparing distributed system architectures for scalability"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Baseline Comparison Analysis</CardTitle>
          <CardDescription>
            Comprehensive comparison of proposed methods against established baselines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedObjective} onValueChange={(v) => setSelectedObjective(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sparse">Sparse Inference</TabsTrigger>
              <TabsTrigger value="quantization">Quantization</TabsTrigger>
              <TabsTrigger value="distributed">Distributed System</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedObjective} className="space-y-6 mt-6">
              {/* Header */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{objectiveTitle[selectedObjective]}</h3>
                <p className="text-sm text-muted-foreground">{objectiveDescription[selectedObjective]}</p>
              </div>

              {/* Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Method Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Method</th>
                          {selectedObjective !== 'distributed' && <th className="text-right py-3 px-4">Latency (ms)</th>}
                          <th className="text-right py-3 px-4">Quality (%)</th>
                          {selectedObjective === 'quantization' && <th className="text-right py-3 px-4">Compression</th>}
                          <th className="text-right py-3 px-4">Memory (MB)</th>
                          <th className="text-center py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentData().map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-4 font-medium">{item.method}</td>
                            {selectedObjective !== 'distributed' && (
                              <td className="text-right py-3 px-4">
                                {item.latency?.toFixed(2) || 'N/A'}
                              </td>
                            )}
                            <td className="text-right py-3 px-4">
                              <span className={item.quality < 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                                {item.quality.toFixed(2)}
                              </span>
                            </td>
                            {selectedObjective === 'quantization' && (
                              <td className="text-right py-3 px-4">
                                {item.compressionRatio ? `${item.compressionRatio}x` : 'N/A'}
                              </td>
                            )}
                            <td className="text-right py-3 px-4">{item.memoryUsage || 'N/A'}</td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                {getStatusIcon(item.status)}
                                {getStatusBadge(item.status)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getCurrentData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="method" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {selectedObjective === 'sparse' && (
                          <>
                            <Bar dataKey="latency" fill="#3b82f6" name="Latency (ms)" />
                            <Bar dataKey="quality" fill="#10b981" name="Quality (%)" />
                          </>
                        )}
                        {selectedObjective === 'quantization' && (
                          <>
                            <Bar dataKey="compressionRatio" fill="#8b5cf6" name="Compression" />
                            <Bar dataKey="memoryUsage" fill="#f59e0b" name="Memory (MB)" />
                          </>
                        )}
                        {selectedObjective === 'distributed' && (
                          <>
                            <Bar dataKey="latency" fill="#3b82f6" name="Latency (ms)" />
                            <Bar dataKey="powerEfficiency" fill="#10b981" name="Efficiency" />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Radar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Multi-Dimensional Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="method" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="Quality" dataKey="Quality" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                        <Radar name="Performance" dataKey="Performance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Key Findings */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedObjective === 'sparse' && (
                      <>
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="font-medium">SIGE-Audio achieves 5.8x latency reduction</p>
                            <p className="text-sm text-muted-foreground">77.92ms vs 450ms baseline, well below 150ms real-time target</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="font-medium">52% memory reduction with minimal quality loss</p>
                            <p className="text-sm text-muted-foreground">245MB vs 512MB baseline, only 1% quality degradation</p>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedObjective === 'quantization' && (
                      <>
                        <div className="flex items-start gap-2">
                          <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div>
                            <p className="font-medium">All quantization methods exhibit catastrophic failure</p>
                            <p className="text-sm text-muted-foreground">PTQ 8-bit: -1893.24%, SVDQuant 8-bit: -7936.80% quality degradation</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="font-medium">Proposed method performs worse than baseline</p>
                            <p className="text-sm text-muted-foreground">Reveals fundamental stability issues requiring novel QAT approach</p>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedObjective === 'distributed' && (
                      <>
                        <div className="flex items-start gap-2">
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div>
                            <p className="font-medium">DistriFusion system currently non-functional</p>
                            <p className="text-sm text-muted-foreground">System bug prevents load distribution testing - Year 4 priority</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
