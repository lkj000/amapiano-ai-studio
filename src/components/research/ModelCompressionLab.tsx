import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Gauge, Package, TrendingDown, Download } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useModelQuantizer } from "@/hooks/useModelQuantizer";
import type { QuantizationMethod } from "@/lib/research/ModelQuantizer";

interface CompressionResult {
  method: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  inferenceSpeed: number;
  qualityScore: number;
  memoryUsage: number;
}

const ModelCompressionLab = () => {
  const { quantize, isQuantizing, metrics } = useModelQuantizer();
  const [selectedMethod, setSelectedMethod] = useState<QuantizationMethod>('ptq');
  const [pruningRatio, setPruningRatio] = useState(50);
  const [quantizationBits, setQuantizationBits] = useState(8);
  const [distillationTemp, setDistillationTemp] = useState(2.0);

  const [results] = useState<CompressionResult[]>([
    {
      method: 'Baseline',
      originalSize: 420,
      compressedSize: 420,
      compressionRatio: 1.0,
      inferenceSpeed: 1.0,
      qualityScore: 4.5,
      memoryUsage: 420
    },
    {
      method: 'Pruning (50%)',
      originalSize: 420,
      compressedSize: 210,
      compressionRatio: 2.0,
      inferenceSpeed: 1.8,
      qualityScore: 4.3,
      memoryUsage: 210
    },
    {
      method: 'Quantization (8-bit)',
      originalSize: 420,
      compressedSize: 105,
      compressionRatio: 4.0,
      inferenceSpeed: 3.2,
      qualityScore: 4.4,
      memoryUsage: 105
    },
    {
      method: 'Distillation',
      originalSize: 420,
      compressedSize: 168,
      compressionRatio: 2.5,
      inferenceSpeed: 2.1,
      qualityScore: 4.2,
      memoryUsage: 168
    },
    {
      method: 'Combined',
      originalSize: 420,
      compressedSize: 63,
      compressionRatio: 6.7,
      inferenceSpeed: 4.5,
      qualityScore: 4.1,
      memoryUsage: 63
    }
  ]);

  const handleCompress = async () => {
    toast.info(`Running ${selectedMethod} compression...`);
    
    try {
      // Generate sample model weights for testing
      const sampleWeights = new Float32Array(100000).map(() => (Math.random() - 0.5) * 2);
      const shape = [100, 1000];
      const modelName = `test-${selectedMethod}-model-${Date.now()}`;
      
      await quantize(
        sampleWeights,
        shape,
        modelName,
        selectedMethod,
        quantizationBits
      );
      
    } catch (error) {
      console.error('Compression failed:', error);
    }
  };

  const handleExport = () => {
    toast.success("Exporting compressed model...");
  };

  const comparisonData = results.map(r => ({
    name: r.method,
    'Model Size (MB)': r.compressedSize,
    'Speed (x)': r.inferenceSpeed,
    'Quality (MOS)': r.qualityScore
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Model Compression Laboratory</h2>
          <p className="text-muted-foreground">
            Experiment with pruning, quantization, and distillation techniques for efficient deployment
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Model
        </Button>
      </div>

      <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pruning">
            <TrendingDown className="w-4 h-4 mr-2" />
            Pruning
          </TabsTrigger>
          <TabsTrigger value="quantization">
            <Package className="w-4 h-4 mr-2" />
            Quantization
          </TabsTrigger>
          <TabsTrigger value="distillation">
            <Gauge className="w-4 h-4 mr-2" />
            Distillation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pruning" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Pruning Configuration</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Pruning Ratio: {pruningRatio}%
                  </Label>
                  <Slider
                    value={[pruningRatio]}
                    onValueChange={([value]) => setPruningRatio(value)}
                    min={10}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Remove {pruningRatio}% of least important weights
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pruning Strategy</Label>
                  <Select defaultValue="magnitude">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="magnitude">Magnitude-based</SelectItem>
                      <SelectItem value="structured">Structured Pruning</SelectItem>
                      <SelectItem value="gradient">Gradient-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleCompress}
                  disabled={isCompressing}
                  className="w-full"
                >
                  {isCompressing ? "Pruning..." : "Apply Pruning"}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Expected Results</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Model Size</span>
                    <Badge variant="secondary">
                      {(420 * (1 - pruningRatio / 100)).toFixed(0)} MB
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((pruningRatio / 100) * 420).toFixed(0)} MB saved
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Inference Speed</span>
                    <Badge variant="secondary">
                      {(1 + (pruningRatio / 100) * 1.5).toFixed(1)}x
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Faster due to reduced computations
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Quality (MOS)</span>
                    <Badge variant="secondary">
                      {(4.5 - (pruningRatio / 100) * 0.3).toFixed(1)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Minimal quality degradation expected
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quantization" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quantization Configuration</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Bit Precision: {quantizationBits}-bit
                  </Label>
                  <Slider
                    value={[quantizationBits]}
                    onValueChange={([value]) => setQuantizationBits(value)}
                    min={4}
                    max={16}
                    step={4}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower bits = smaller model, but may affect quality
                  </p>
                </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Quantization Method
                  </Label>
                  <Select value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as QuantizationMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="svdquant">SVDQuant-Audio</SelectItem>
                      <SelectItem value="nunchaku">Nunchaku-Audio</SelectItem>
                      <SelectItem value="ptq">Post-Training Quantization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleCompress}
                  disabled={isQuantizing}
                  className="w-full"
                >
                  {isQuantizing ? "Quantizing..." : "Apply Quantization"}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Expected Results</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Model Size</span>
                    <Badge variant="secondary">
                      {metrics.quantizedSizeMB > 0 
                        ? `${metrics.quantizedSizeMB.toFixed(0)} MB`
                        : `${(420 * (quantizationBits / 32)).toFixed(0)} MB`
                      }
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.originalSizeMB > 0
                      ? `${(metrics.originalSizeMB - metrics.quantizedSizeMB).toFixed(0)} MB saved`
                      : `${(420 - (420 * quantizationBits / 32)).toFixed(0)} MB saved (estimated)`
                    }
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Inference Speed</span>
                    <Badge variant="secondary">
                      {(32 / quantizationBits * 1.2).toFixed(1)}x
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Hardware acceleration benefits
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Quality (MOS)</span>
                    <Badge variant="secondary">
                      {(4.5 - (16 - quantizationBits) * 0.05).toFixed(1)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    8-bit maintains near-original quality
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distillation" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Distillation Configuration</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Temperature: {distillationTemp.toFixed(1)}
                  </Label>
                  <Slider
                    value={[distillationTemp * 10]}
                    onValueChange={([value]) => setDistillationTemp(value / 10)}
                    min={10}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls softness of probability distribution
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Student Model Size</Label>
                  <Select defaultValue="40">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20% of teacher</SelectItem>
                      <SelectItem value="40">40% of teacher</SelectItem>
                      <SelectItem value="60">60% of teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleCompress}
                  disabled={isCompressing}
                  className="w-full"
                >
                  {isCompressing ? "Distilling..." : "Apply Distillation"}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Expected Results</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Model Size</span>
                    <Badge variant="secondary">168 MB</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    252 MB saved (60% reduction)
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Inference Speed</span>
                    <Badge variant="secondary">2.1x</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Student model is significantly faster
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Quality (MOS)</span>
                    <Badge variant="secondary">4.2</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Learns from teacher's knowledge
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comparison Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Compression Methods Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Model Size (MB)" fill="hsl(var(--primary))" />
            <Bar dataKey="Speed (x)" fill="hsl(var(--chart-2))" />
            <Bar dataKey="Quality (MOS)" fill="hsl(var(--chart-3))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ModelCompressionLab;
