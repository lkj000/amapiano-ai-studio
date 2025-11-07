import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Activity, BarChart3, Radio } from "lucide-react";

interface QualityMetrics {
  peakLevel: number;
  rmsLevel: number;
  dynamicRange: number;
  clippingCount: number;
  stereoWidth: number;
  frequencyBalance: {
    low: number;
    mid: number;
    high: number;
  };
}

interface QualityAnalyzerProps {
  audioUrl: string;
}

export const QualityAnalyzer = ({ audioUrl }: QualityAnalyzerProps) => {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeAudio();
  }, [audioUrl]);

  const analyzeAudio = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      
      // Calculate peak level
      let peakLevel = 0;
      let rmsSum = 0;
      let clippingCount = 0;
      
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.abs(channelData[i]);
        if (sample > peakLevel) peakLevel = sample;
        rmsSum += sample * sample;
        if (sample >= 0.99) clippingCount++;
      }

      const rmsLevel = Math.sqrt(rmsSum / channelData.length);
      const dynamicRange = peakLevel / (rmsLevel + 0.001);

      // Simple frequency analysis using FFT
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.getByteFrequencyData(frequencyData);

      const third = frequencyData.length / 3;
      const low = Array.from(frequencyData.slice(0, third)).reduce((a, b) => a + b, 0) / third;
      const mid = Array.from(frequencyData.slice(third, third * 2)).reduce((a, b) => a + b, 0) / third;
      const high = Array.from(frequencyData.slice(third * 2)).reduce((a, b) => a + b, 0) / third;

      setMetrics({
        peakLevel: peakLevel * 100,
        rmsLevel: rmsLevel * 100,
        dynamicRange: Math.min(dynamicRange * 10, 100),
        clippingCount,
        stereoWidth: audioBuffer.numberOfChannels > 1 ? 100 : 0,
        frequencyBalance: {
          low: (low / 255) * 100,
          mid: (mid / 255) * 100,
          high: (high / 255) * 100
        }
      });

      await audioContext.close();
    } catch (error) {
      console.error("Error analyzing audio:", error);
    }
    setIsAnalyzing(false);
  };

  const getQualityScore = () => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // Penalize clipping
    if (metrics.clippingCount > 0) score -= 20;
    
    // Penalize low dynamic range
    if (metrics.dynamicRange < 30) score -= 15;
    
    // Penalize if too quiet
    if (metrics.rmsLevel < 10) score -= 10;
    
    // Penalize if too loud
    if (metrics.peakLevel > 95) score -= 10;
    
    return Math.max(0, score);
  };

  if (isAnalyzing) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-3">
          <Activity className="h-8 w-8 mx-auto animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing audio quality...</p>
        </div>
      </Card>
    );
  }

  if (!metrics) return null;

  const qualityScore = getQualityScore();

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quality Analysis</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">{qualityScore}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <Label>Peak Level</Label>
            <span className="ml-auto text-sm text-muted-foreground">
              {metrics.peakLevel.toFixed(1)}%
            </span>
          </div>
          <Progress value={metrics.peakLevel} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <Label>RMS Level</Label>
            <span className="ml-auto text-sm text-muted-foreground">
              {metrics.rmsLevel.toFixed(1)}%
            </span>
          </div>
          <Progress value={metrics.rmsLevel} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <Label>Dynamic Range</Label>
            <span className="ml-auto text-sm text-muted-foreground">
              {metrics.dynamicRange.toFixed(0)}%
            </span>
          </div>
          <Progress value={metrics.dynamicRange} className="h-2" />
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <Label>Frequency Balance</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12">Low</span>
              <Progress value={metrics.frequencyBalance.low} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {metrics.frequencyBalance.low.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12">Mid</span>
              <Progress value={metrics.frequencyBalance.mid} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {metrics.frequencyBalance.mid.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12">High</span>
              <Progress value={metrics.frequencyBalance.high} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {metrics.frequencyBalance.high.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {metrics.clippingCount > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              ⚠️ Detected {metrics.clippingCount} clipping samples
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
