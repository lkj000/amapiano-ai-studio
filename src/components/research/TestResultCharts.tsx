import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TestResultChartsProps {
  testResults: {
    sparse?: any;
    quantization?: any;
    distributed?: any;
  };
}

export const TestResultCharts = ({ testResults }: TestResultChartsProps) => {
  const sparseData = testResults.sparse?.results?.map((result: any, idx: number) => ({
    iteration: `Iter ${idx + 1}`,
    latency: result.latency,
    cached: result.cached ? 1 : 0
  })) || [];

  const quantData = testResults.quantization?.results?.map((result: any) => ({
    method: result.method,
    quality: result.qualityRetained,
    compression: result.compressionRatio,
    size: result.quantizedSizeMB
  })) || [];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Sparse Inference Latency Chart */}
      {testResults.sparse && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Sparse Inference Latency per Iteration
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sparseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" />
              <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Quantization Quality Chart */}
      {testResults.quantization && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Quantization Quality Retained
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" />
              <YAxis domain={[90, 100]} label={{ value: 'Quality (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quality" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Quantization Compression Chart */}
      {testResults.quantization && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Compression Ratio by Method
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" />
              <YAxis label={{ value: 'Compression Ratio (x)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="compression" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Cache Hit Visualization */}
      {testResults.sparse && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Cache Hits vs Misses
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sparseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" />
              <YAxis domain={[0, 1]} ticks={[0, 1]} label={{ value: 'Cache Hit', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => value === 1 ? 'Hit' : 'Miss'} />
              <Bar 
                dataKey="cached" 
                fill="hsl(var(--primary))"
                shape={(props: any) => {
                  const { fill, x, y, width, height, payload } = props;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={payload.cached ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};
