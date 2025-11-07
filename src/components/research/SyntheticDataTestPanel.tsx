import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useModelQuantizer } from "@/hooks/useModelQuantizer";

interface SyntheticTestResult {
  method: string;
  bits: number;
  quality: number;
  compressionRatio: number;
  snr: number;
  mse: number;
}

export const SyntheticDataTestPanel = () => {
  const [syntheticData, setSyntheticData] = useState<Float32Array | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<SyntheticTestResult[]>([]);
  const quantizer = useModelQuantizer();

  const loadSyntheticFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      if (!json.metadata || !json.data) {
        throw new Error("Invalid synthetic data format");
      }

      const data = new Float32Array(json.data);
      setSyntheticData(data);
      setMetadata(json.metadata);
      toast.success(`Loaded ${json.metadata.signalType} signal: ${json.metadata.samples.toLocaleString()} samples`);
    } catch (error) {
      console.error("Failed to load synthetic data:", error);
      toast.error("Failed to load synthetic data file");
    } finally {
      setIsLoading(false);
    }
  };

  const runQuantizationTests = async () => {
    if (!syntheticData) {
      toast.error("Please load synthetic data first");
      return;
    }

    setIsTesting(true);
    toast.info("🧪 Testing quantization on synthetic data...");

    try {
      const results: SyntheticTestResult[] = [];
      const shape = [1, syntheticData.length];
      
      const testConfigs = [
        { method: 'ptq' as const, bits: 8, name: 'PTQ 8-bit' },
        { method: 'ptq' as const, bits: 4, name: 'PTQ 4-bit' },
        { method: 'svdquant' as const, bits: 8, name: 'SVDQuant 8-bit' },
      ];

      for (const config of testConfigs) {
        const quantized = await quantizer.quantize(
          syntheticData,
          shape,
          `synthetic-${metadata.signalType}-${config.name}`,
          config.method,
          config.bits
        );

        const dequantized = quantizer.dequantize(quantized);
        if (!dequantized) continue;

        const comparison = quantizer.compareModels(syntheticData, dequantized);
        
        results.push({
          method: config.name,
          bits: config.bits,
          quality: comparison.qualityRetained,
          compressionRatio: 32 / config.bits,
          snr: comparison.snr,
          mse: comparison.mse
        });
      }

      setTestResults(results);
      toast.success("✅ Quantization tests complete!");
    } catch (error) {
      console.error("Quantization test failed:", error);
      toast.error("❌ Quantization test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality < 0) return "text-red-600 dark:text-red-400";
    if (quality < 50) return "text-orange-600 dark:text-orange-400";
    if (quality < 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Synthetic Data Testing
          </CardTitle>
          <CardDescription>
            Load synthetic audio data for controlled quantization experiments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="synthetic-file">Load Synthetic Data (JSON)</Label>
            <Input
              id="synthetic-file"
              type="file"
              accept=".json"
              onChange={loadSyntheticFile}
              disabled={isLoading}
            />
          </div>

          {/* Metadata Display */}
          {metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Signal Type</p>
                <p className="text-sm font-semibold capitalize">{metadata.signalType}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                <p className="text-sm font-semibold">{metadata.frequency} Hz</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="text-sm font-semibold">{metadata.duration}s</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Samples</p>
                <p className="text-sm font-semibold">{metadata.samples.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Test Button */}
          <Button
            onClick={runQuantizationTests}
            disabled={!syntheticData || isTesting}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isTesting ? "Testing..." : "Run Quantization Tests"}
          </Button>

          {/* Progress */}
          {isTesting && (
            <div className="space-y-2">
              <Progress value={50} />
              <p className="text-sm text-muted-foreground text-center">
                Testing quantization methods on synthetic data...
              </p>
            </div>
          )}

          {/* Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <Badge variant="outline">
                  {testResults.length} methods tested
                </Badge>
              </div>

              <div className="space-y-3">
                {testResults.map((result, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{result.method}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.bits}-bit
                          </span>
                        </div>
                        {result.quality >= 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Quality</p>
                          <p className={`font-bold text-lg ${getQualityColor(result.quality)}`}>
                            {result.quality.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">SNR</p>
                          <p className="font-semibold">
                            {Number.isFinite(result.snr) ? `${result.snr.toFixed(2)} dB` : '∞'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">MSE</p>
                          <p className="font-semibold">
                            {result.mse.toExponential(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Compression</p>
                          <p className="font-semibold">{result.compressionRatio}x</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Analysis */}
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Synthetic Data Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Best Method:</strong>{" "}
                      {testResults.reduce((best, current) => 
                        current.quality > best.quality ? current : best
                      ).method}
                    </p>
                    <p>
                      <strong>Signal Type:</strong> {metadata?.signalType} ({metadata?.frequency}Hz)
                    </p>
                    <p className="text-muted-foreground">
                      Synthetic data allows for precise isolation of quantization artifacts
                      in phase coherence and spectral stability.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
