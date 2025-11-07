import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface SpectrumAnalyzerProps {
  audioUrl: string;
}

export const SpectrumAnalyzer = ({ audioUrl }: SpectrumAnalyzerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      source?.stop();
      audioContext?.close();
    };
  }, []);

  const togglePlayback = async () => {
    if (isPlaying) {
      source?.stop();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    try {
      const ctx = new AudioContext();
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.85;

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const bufferSource = ctx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      bufferSource.start();

      setAudioContext(ctx);
      setAnalyser(analyserNode);
      setSource(bufferSource);
      setIsPlaying(true);

      bufferSource.onended = () => {
        setIsPlaying(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      visualize(analyserNode);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const visualize = (analyserNode: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyserNode.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      // Clear with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw frequency bars
      const barCount = 128;
      const barWidth = width / barCount;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step];
        const percent = value / 255;
        const barHeight = percent * height * 0.9;
        const x = i * barWidth;
        const y = height - barHeight;

        // Color gradient based on frequency range
        let color;
        if (i < barCount / 3) {
          color = `hsl(240, 80%, ${40 + percent * 30}%)`; // Low (blue)
        } else if (i < (barCount * 2) / 3) {
          color = `hsl(120, 80%, ${40 + percent * 30}%)`; // Mid (green)
        } else {
          color = `hsl(0, 80%, ${40 + percent * 30}%)`; // High (red)
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }

      // Draw frequency labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px monospace';
      ctx.fillText('Low', 10, height - 5);
      ctx.fillText('Mid', width / 2 - 15, height - 5);
      ctx.fillText('High', width - 35, height - 5);

      // Draw level indicators
      const avgLow = Array.from(dataArray.slice(0, bufferLength / 3)).reduce((a, b) => a + b, 0) / (bufferLength / 3);
      const avgMid = Array.from(dataArray.slice(bufferLength / 3, (bufferLength * 2) / 3)).reduce((a, b) => a + b, 0) / (bufferLength / 3);
      const avgHigh = Array.from(dataArray.slice((bufferLength * 2) / 3)).reduce((a, b) => a + b, 0) / (bufferLength / 3);

      ctx.fillStyle = '#3b82f6';
      ctx.fillText(`${Math.round((avgLow / 255) * 100)}%`, 10, 15);
      ctx.fillText(`${Math.round((avgMid / 255) * 100)}%`, width / 2 - 15, 15);
      ctx.fillText(`${Math.round((avgHigh / 255) * 100)}%`, width - 35, 15);
    };

    draw();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">Spectrum Analyzer</Label>
        <Button onClick={togglePlayback} variant="outline" size="sm">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full border border-border rounded-lg bg-background"
      />

      <div className="grid grid-cols-3 gap-4 text-center text-xs">
        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
          <div className="text-blue-400 font-semibold">Low</div>
          <div className="text-muted-foreground">20Hz - 250Hz</div>
        </div>
        <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
          <div className="text-green-400 font-semibold">Mid</div>
          <div className="text-muted-foreground">250Hz - 4kHz</div>
        </div>
        <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
          <div className="text-red-400 font-semibold">High</div>
          <div className="text-muted-foreground">4kHz - 20kHz</div>
        </div>
      </div>
    </Card>
  );
};
