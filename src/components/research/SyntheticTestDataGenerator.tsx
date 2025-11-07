import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Waves, Zap, Download } from "lucide-react";
import { toast } from "sonner";

type SignalType = 'harmonic' | 'percussive' | 'noisy' | 'mixed';

interface GeneratorConfig {
  signalType: SignalType;
  frequency: number;
  duration: number;
  sampleRate: number;
  amplitude: number;
  noiseLevel: number;
}

export const SyntheticTestDataGenerator = () => {
  const [config, setConfig] = useState<GeneratorConfig>({
    signalType: 'harmonic',
    frequency: 440,
    duration: 1.0,
    sampleRate: 44100,
    amplitude: 0.8,
    noiseLevel: 0.1
  });

  const [generatedData, setGeneratedData] = useState<Float32Array | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHarmonic = (freq: number, samples: number, sr: number, amp: number): Float32Array => {
    const data = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const t = i / sr;
      // Fundamental + harmonics for realistic audio
      data[i] = amp * (
        Math.sin(2 * Math.PI * freq * t) +
        0.5 * Math.sin(2 * Math.PI * freq * 2 * t) +
        0.25 * Math.sin(2 * Math.PI * freq * 3 * t)
      );
    }
    return data;
  };

  const generatePercussive = (samples: number, sr: number, amp: number): Float32Array => {
    const data = new Float32Array(samples);
    // Attack-decay-sustain-release envelope
    for (let i = 0; i < samples; i++) {
      const t = i / sr;
      const env = Math.exp(-5 * t); // Fast decay
      const noise = (Math.random() - 0.5) * 2;
      const tone = Math.sin(2 * Math.PI * 200 * t * Math.exp(-3 * t)); // Pitch bend down
      data[i] = amp * env * (0.7 * tone + 0.3 * noise);
    }
    return data;
  };

  const generateNoisy = (samples: number, amp: number): Float32Array => {
    const data = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      data[i] = amp * (Math.random() - 0.5) * 2;
    }
    return data;
  };

  const generateMixed = (freq: number, samples: number, sr: number, amp: number, noise: number): Float32Array => {
    const harmonic = generateHarmonic(freq, samples, sr, amp);
    const noiseData = generateNoisy(samples, amp * noise);
    
    const data = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      data[i] = harmonic[i] * (1 - noise) + noiseData[i];
    }
    return data;
  };

  const generateSignal = () => {
    setIsGenerating(true);
    
    try {
      const samples = Math.floor(config.duration * config.sampleRate);
      let data: Float32Array;

      switch (config.signalType) {
        case 'harmonic':
          data = generateHarmonic(config.frequency, samples, config.sampleRate, config.amplitude);
          break;
        case 'percussive':
          data = generatePercussive(samples, config.sampleRate, config.amplitude);
          break;
        case 'noisy':
          data = generateNoisy(samples, config.amplitude);
          break;
        case 'mixed':
          data = generateMixed(config.frequency, samples, config.sampleRate, config.amplitude, config.noiseLevel);
          break;
        default:
          data = new Float32Array(samples);
      }

      setGeneratedData(data);
      toast.success(`Generated ${config.signalType} signal with ${samples} samples`);
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate signal');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportData = () => {
    if (!generatedData) {
      toast.error('No data to export');
      return;
    }

    const metadata = {
      signalType: config.signalType,
      frequency: config.frequency,
      duration: config.duration,
      sampleRate: config.sampleRate,
      samples: generatedData.length,
      timestamp: new Date().toISOString()
    };

    const exportData = {
      metadata,
      data: Array.from(generatedData)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synthetic-${config.signalType}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Test data exported');
  };

  const getSignalIcon = () => {
    switch (config.signalType) {
      case 'harmonic':
        return <Waves className="w-5 h-5" />;
      case 'percussive':
        return <Zap className="w-5 h-5" />;
      default:
        return <Waves className="w-5 h-5" />;
    }
  };

  const getSignalDescription = () => {
    switch (config.signalType) {
      case 'harmonic':
        return 'Pure tones with harmonics - tests frequency preservation';
      case 'percussive':
        return 'Transient-rich signals - tests temporal accuracy';
      case 'noisy':
        return 'Random noise - tests worst-case quantization';
      case 'mixed':
        return 'Realistic audio with tones and noise - comprehensive test';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {getSignalIcon()}
          Synthetic Test Data Generator
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Signal Type</Label>
              <Select
                value={config.signalType}
                onValueChange={(value: SignalType) => setConfig({ ...config, signalType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harmonic">Harmonic (Tonal)</SelectItem>
                  <SelectItem value="percussive">Percussive (Transient)</SelectItem>
                  <SelectItem value="noisy">Noisy (Stochastic)</SelectItem>
                  <SelectItem value="mixed">Mixed (Realistic)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{getSignalDescription()}</p>
            </div>

            {(config.signalType === 'harmonic' || config.signalType === 'mixed') && (
              <div>
                <Label>Frequency: {config.frequency} Hz</Label>
                <Slider
                  value={[config.frequency]}
                  onValueChange={([value]) => setConfig({ ...config, frequency: value })}
                  min={20}
                  max={2000}
                  step={10}
                />
              </div>
            )}

            <div>
              <Label>Duration: {config.duration.toFixed(2)} seconds</Label>
              <Slider
                value={[config.duration]}
                onValueChange={([value]) => setConfig({ ...config, duration: value })}
                min={0.1}
                max={5.0}
                step={0.1}
              />
            </div>

            <div>
              <Label>Amplitude: {config.amplitude.toFixed(2)}</Label>
              <Slider
                value={[config.amplitude]}
                onValueChange={([value]) => setConfig({ ...config, amplitude: value })}
                min={0.1}
                max={1.0}
                step={0.05}
              />
            </div>

            {config.signalType === 'mixed' && (
              <div>
                <Label>Noise Level: {(config.noiseLevel * 100).toFixed(0)}%</Label>
                <Slider
                  value={[config.noiseLevel]}
                  onValueChange={([value]) => setConfig({ ...config, noiseLevel: value })}
                  min={0}
                  max={0.5}
                  step={0.05}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Generation Info</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sample Rate:</span>
                  <span className="font-mono">{config.sampleRate} Hz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Samples:</span>
                  <span className="font-mono">{Math.floor(config.duration * config.sampleRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size (Float32):</span>
                  <span className="font-mono">
                    {((config.duration * config.sampleRate * 4) / 1024).toFixed(2)} KB
                  </span>
                </div>
              </div>
            </Card>

            {generatedData && (
              <Card className="p-4 bg-primary/5">
                <h4 className="font-medium mb-2 text-primary">Generation Complete</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Samples:</span>
                    <span className="font-mono">{generatedData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peak Amplitude:</span>
                    <span className="font-mono">{Math.max(...Array.from(generatedData)).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RMS Power:</span>
                    <span className="font-mono">
                      {Math.sqrt(Array.from(generatedData).reduce((sum, v) => sum + v * v, 0) / generatedData.length).toFixed(3)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={generateSignal} disabled={isGenerating} className="flex-1">
            <Waves className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Signal'}
          </Button>
          <Button onClick={exportData} variant="outline" disabled={!generatedData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-muted/30">
        <h4 className="font-medium mb-3">Usage Guide</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Harmonic:</strong> Use for testing quantization on tonal music (melody, chords). Clean signals show pure quantization effects.</p>
          <p><strong>Percussive:</strong> Use for testing transient preservation (drums, plucks). Tests temporal accuracy and attack preservation.</p>
          <p><strong>Noisy:</strong> Use for worst-case testing. Random signals stress-test quantization noise handling.</p>
          <p><strong>Mixed:</strong> Use for realistic validation. Combines tones and noise to simulate actual audio content.</p>
        </div>
      </Card>
    </div>
  );
};
