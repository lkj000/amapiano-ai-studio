import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealtimePerformanceMonitoring } from "@/hooks/useRealtimePerformanceMonitoring";
import { toast } from "sonner";
import { Play, Zap, AlertTriangle } from "lucide-react";

export const PerformanceTestingPanel = () => {
  const { recordMetric } = useRealtimePerformanceMonitoring();
  const [metricType, setMetricType] = useState<string>("latency");
  const [metricValue, setMetricValue] = useState<string>("100");
  const [method, setMethod] = useState<string>("wasm");
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordMetric = async () => {
    try {
      setIsRecording(true);
      await recordMetric(
        metricType as any,
        parseFloat(metricValue),
        method as any,
        {
          test: true,
          timestamp: Date.now()
        }
      );
      toast.success("Metric recorded successfully");
    } catch (error) {
      toast.error("Failed to record metric");
      console.error(error);
    } finally {
      setIsRecording(false);
    }
  };

  const runLoadTest = async () => {
    toast.info("Running load test...");
    setIsRecording(true);

    try {
      // Simulate multiple metric recordings
      const metrics = [
        { metric_type: "latency", value: 150, method: "wasm" },
        { metric_type: "latency", value: 180, method: "js" },
        { metric_type: "cpu", value: 45, method: "wasm" },
        { metric_type: "cpu", value: 78, method: "js" },
        { metric_type: "memory", value: 128, method: "wasm" },
        { metric_type: "memory", value: 256, method: "js" },
        { metric_type: "cost", value: 0.002, method: "wasm" },
        { metric_type: "cost", value: 0.005, method: "js" },
      ];

      for (const metric of metrics) {
        await recordMetric(metric.metric_type as any, metric.value, metric.method as any, {});
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast.success("Load test completed");
    } catch (error) {
      toast.error("Load test failed");
      console.error(error);
    } finally {
      setIsRecording(false);
    }
  };

  const simulateAnomaly = async () => {
    toast.info("Simulating anomaly...");
    setIsRecording(true);

    try {
      // Record metrics that should trigger anomaly detection
      await recordMetric(
        "latency",
        5000, // Very high latency
        "wasm",
        { simulated: true }
      );

      await recordMetric(
        "cpu",
        98, // Very high CPU
        "js",
        { simulated: true }
      );

      toast.success("Anomaly metrics recorded - run detection to see results");
    } catch (error) {
      toast.error("Failed to simulate anomaly");
      console.error(error);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Performance Testing
        </CardTitle>
        <CardDescription>
          Test the performance monitoring system with sample data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Metric Recording */}
        <div className="space-y-4">
          <h3 className="font-semibold">Record Individual Metric</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Metric Type</Label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latency">Latency (ms)</SelectItem>
                  <SelectItem value="cpu">CPU (%)</SelectItem>
                  <SelectItem value="memory">Memory (MB)</SelectItem>
                  <SelectItem value="cost">Cost ($)</SelectItem>
                  <SelectItem value="throughput">Throughput</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                placeholder="Enter value"
              />
            </div>

            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wasm">WASM</SelectItem>
                  <SelectItem value="js">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleRecordMetric}
            disabled={isRecording}
            className="w-full"
          >
            Record Metric
          </Button>
        </div>

        {/* Quick Test Scenarios */}
        <div className="space-y-4">
          <h3 className="font-semibold">Quick Test Scenarios</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={runLoadTest}
              disabled={isRecording}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <Zap className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Load Test</div>
                <div className="text-xs text-muted-foreground">
                  Record multiple metrics
                </div>
              </div>
            </Button>

            <Button
              onClick={simulateAnomaly}
              disabled={isRecording}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <AlertTriangle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Simulate Anomaly</div>
                <div className="text-xs text-muted-foreground">
                  Record anomalous metrics
                </div>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
