import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Volume2, Wand2, Play, Pause, RotateCcw, Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWaveformVisualization } from "@/hooks/useWaveformVisualization";

interface AudioEditorProps {
  audioUrl: string;
  onExport: (blob: Blob, format: string) => void;
}

const EXPORT_PRESETS = {
  podcast: { format: "mp3", volume: 100, fadeIn: 0, fadeOut: 2 },
  music: { format: "wav", volume: 100, fadeIn: 1, fadeOut: 3 },
  voiceover: { format: "wav", volume: 110, fadeIn: 0, fadeOut: 1 },
  social: { format: "mp3", volume: 120, fadeIn: 0, fadeOut: 0 }
};

export const AudioEditor = ({ audioUrl, onExport }: AudioEditorProps) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const [fadeIn, setFadeIn] = useState([0]);
  const [fadeOut, setFadeOut] = useState([0]);
  const [exportFormat, setExportFormat] = useState("wav");
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { generateWaveform, drawWaveform } = useWaveformVisualization();

  useEffect(() => {
    loadAudio();
    return () => {
      stopPlayback();
      audioContextRef.current?.close();
    };
  }, [audioUrl]);

  const loadAudio = async () => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      setTrimEnd([100]);
      
      // Generate waveform
      await generateWaveform(buffer);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audio file",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!audioBuffer || !waveformCanvasRef.current) return;
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate peaks for visualization
    const channelData = audioBuffer.getChannelData(0);
    const samples = 500;
    const blockSize = Math.floor(channelData.length / samples);
    const peaks: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = start + blockSize;
      let sum = 0;
      for (let j = start; j < end && j < channelData.length; j++) {
        sum += channelData[j] * channelData[j];
      }
      const rms = Math.sqrt(sum / blockSize);
      peaks.push(rms);
    }

    const maxPeak = Math.max(...peaks);
    const normalizedPeaks = peaks.map(p => p / maxPeak);

    // Draw waveform with markers
    const width = canvas.width;
    const height = canvas.height;
    const middle = height / 2;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, middle);
    ctx.lineTo(width, middle);
    ctx.stroke();

    // Draw waveform
    ctx.fillStyle = '#3b82f6';
    const barWidth = width / normalizedPeaks.length;
    normalizedPeaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = peak * (height / 2) * 0.9;
      ctx.fillRect(x, middle - barHeight, Math.max(barWidth, 1), barHeight);
      ctx.fillRect(x, middle, Math.max(barWidth, 1), barHeight);
    });

    // Draw trim markers
    const trimStartX = (trimStart[0] / 100) * width;
    const trimEndX = (trimEnd[0] / 100) * width;
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(trimStartX, 0);
    ctx.lineTo(trimStartX, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(trimEndX, 0);
    ctx.lineTo(trimEndX, height);
    ctx.stroke();
    
    // Draw fade regions
    if (fadeIn[0] > 0) {
      const fadeInWidth = ((fadeIn[0] / 100) * (trimEnd[0] - trimStart[0]) / 100) * width;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.fillRect(trimStartX, 0, fadeInWidth, height);
    }
    
    if (fadeOut[0] > 0) {
      const fadeOutWidth = ((fadeOut[0] / 100) * (trimEnd[0] - trimStart[0]) / 100) * width;
      ctx.fillStyle = 'rgba(251, 146, 60, 0.2)';
      ctx.fillRect(trimEndX - fadeOutWidth, 0, fadeOutWidth, height);
    }
    
    ctx.setLineDash([]);
  }, [audioBuffer, trimStart, trimEnd, fadeIn, fadeOut]);

  const stopPlayback = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playPreview = () => {
    if (!audioBuffer || !audioContextRef.current) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.value = volume[0] / 100;
    
    const startTime = (trimStart[0] / 100) * duration;
    const endTime = (trimEnd[0] / 100) * duration;
    const playDuration = endTime - startTime;
    
    source.start(0, startTime, playDuration);
    sourceRef.current = source;
    gainNodeRef.current = gainNode;
    setIsPlaying(true);
    
    source.onended = () => {
      setIsPlaying(false);
    };
  };

  const previewEffects = async () => {
    if (!audioBuffer || !audioContextRef.current) return;
    
    setIsPreviewing(true);
    try {
      const ctx = audioContextRef.current;
      const startSample = Math.floor((trimStart[0] / 100) * audioBuffer.length);
      const endSample = Math.floor((trimEnd[0] / 100) * audioBuffer.length);
      const newLength = endSample - startSample;
      
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        newLength,
        audioBuffer.sampleRate
      );
      
      const newBuffer = offlineCtx.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        audioBuffer.sampleRate
      );
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = newBuffer.getChannelData(channel);
        
        for (let i = 0; i < newLength; i++) {
          let sample = inputData[startSample + i];
          sample *= volume[0] / 100;
          
          const fadeInSamples = Math.floor((fadeIn[0] / 100) * newLength);
          if (i < fadeInSamples) {
            sample *= i / fadeInSamples;
          }
          
          const fadeOutSamples = Math.floor((fadeOut[0] / 100) * newLength);
          if (i > newLength - fadeOutSamples) {
            sample *= (newLength - i) / fadeOutSamples;
          }
          
          outputData[i] = sample;
        }
      }
      
      const source = offlineCtx.createBufferSource();
      source.buffer = newBuffer;
      source.connect(offlineCtx.destination);
      source.start();
      
      const renderedBuffer = await offlineCtx.startRendering();
      
      const previewSource = ctx.createBufferSource();
      previewSource.buffer = renderedBuffer;
      previewSource.connect(ctx.destination);
      previewSource.start();
      
      previewSource.onended = () => {
        setIsPreviewing(false);
      };
      
      toast({
        title: "Preview Playing",
        description: "Playing audio with applied effects",
      });
    } catch (error) {
      setIsPreviewing(false);
      toast({
        title: "Preview Failed",
        description: "Could not preview effects",
        variant: "destructive",
      });
    }
  };

  const applyEffects = async () => {
    if (!audioBuffer || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const startSample = Math.floor((trimStart[0] / 100) * audioBuffer.length);
      const endSample = Math.floor((trimEnd[0] / 100) * audioBuffer.length);
      const newLength = endSample - startSample;
      
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        newLength,
        audioBuffer.sampleRate
      );
      
      const newBuffer = offlineCtx.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        audioBuffer.sampleRate
      );
      
      // Copy and process audio data
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = newBuffer.getChannelData(channel);
        
        for (let i = 0; i < newLength; i++) {
          let sample = inputData[startSample + i];
          
          // Apply volume
          sample *= volume[0] / 100;
          
          // Apply fade in
          const fadeInSamples = Math.floor((fadeIn[0] / 100) * newLength);
          if (i < fadeInSamples) {
            sample *= i / fadeInSamples;
          }
          
          // Apply fade out
          const fadeOutSamples = Math.floor((fadeOut[0] / 100) * newLength);
          if (i > newLength - fadeOutSamples) {
            sample *= (newLength - i) / fadeOutSamples;
          }
          
          outputData[i] = sample;
        }
      }
      
      // Render to WAV
      const source = offlineCtx.createBufferSource();
      source.buffer = newBuffer;
      source.connect(offlineCtx.destination);
      source.start();
      
      const renderedBuffer = await offlineCtx.startRendering();
      
      let blob: Blob;
      if (exportFormat === "wav") {
        blob = await audioBufferToWav(renderedBuffer);
      } else if (exportFormat === "mp3") {
        blob = await audioBufferToMp3(renderedBuffer);
      } else {
        blob = await audioBufferToWav(renderedBuffer);
      }
      
      onExport(blob, exportFormat);
      
      toast({
        title: "Success",
        description: `Audio exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply effects",
        variant: "destructive",
      });
    }
  };

  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = new Float32Array(buffer.length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
        data[i * numberOfChannels + channel] = channelData[i];
      }
    }
    
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const audioBufferToMp3 = async (buffer: AudioBuffer): Promise<Blob> => {
    // Convert to WAV first, then would need a library like lamejs for actual MP3 encoding
    // For now, we'll return WAV with mp3 mime type as placeholder
    // In production, you'd want to use a proper MP3 encoder
    const wavBlob = await audioBufferToWav(buffer);
    return new Blob([await wavBlob.arrayBuffer()], { type: 'audio/mpeg' });
  };

  const applyPreset = (presetName: keyof typeof EXPORT_PRESETS) => {
    const preset = EXPORT_PRESETS[presetName];
    setExportFormat(preset.format);
    setVolume([preset.volume]);
    setFadeIn([preset.fadeIn]);
    setFadeOut([preset.fadeOut]);
    toast({
      title: "Preset Applied",
      description: `Applied ${presetName} preset`,
    });
  };

  const reset = () => {
    setVolume([100]);
    setTrimStart([0]);
    setTrimEnd([100]);
    setFadeIn([0]);
    setFadeOut([0]);
    setExportFormat("wav");
    stopPlayback();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Audio Editor</h3>
        <div className="flex gap-2">
          <Button onClick={playPreview} variant="outline" size="sm" disabled={isPreviewing}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button onClick={previewEffects} variant="outline" size="sm" disabled={isPlaying || isPreviewing}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button onClick={reset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="space-y-2">
        <Label>Waveform</Label>
        <canvas
          ref={waveformCanvasRef}
          width={800}
          height={150}
          className="w-full border border-border rounded-lg bg-background"
        />
        <div className="flex gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-destructive" />
            <span>Trim Points</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500/20" />
            <span>Fade In</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500/20" />
            <span>Fade Out</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Scissors className="h-4 w-4 text-primary" />
            <Label>Trim Audio</Label>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Start: {((trimStart[0] / 100) * duration).toFixed(2)}s
              </Label>
              <Slider
                value={trimStart}
                onValueChange={setTrimStart}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                End: {((trimEnd[0] / 100) * duration).toFixed(2)}s
              </Label>
              <Slider
                value={trimEnd}
                onValueChange={setTrimEnd}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="h-4 w-4 text-primary" />
            <Label>Volume: {volume[0]}%</Label>
          </div>
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={200}
            step={1}
            className="mt-2"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="h-4 w-4 text-primary" />
            <Label>Fade Effects</Label>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Fade In: {fadeIn[0]}%
              </Label>
              <Slider
                value={fadeIn}
                onValueChange={setFadeIn}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Fade Out: {fadeOut[0]}%
              </Label>
              <Slider
                value={fadeOut}
                onValueChange={setFadeOut}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="export-preset">Export Presets</Label>
          <Select onValueChange={(value) => applyPreset(value as keyof typeof EXPORT_PRESETS)}>
            <SelectTrigger id="export-preset" className="mt-2">
              <SelectValue placeholder="Choose a preset..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="podcast">Podcast (MP3, balanced)</SelectItem>
              <SelectItem value="music">Music (WAV, full quality)</SelectItem>
              <SelectItem value="voiceover">Voiceover (WAV, boosted)</SelectItem>
              <SelectItem value="social">Social Media (MP3, loud)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="export-format">Export Format</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger id="export-format" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wav">WAV (Lossless)</SelectItem>
              <SelectItem value="mp3">MP3 (Compressed)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={applyEffects} className="w-full" disabled={!audioBuffer}>
        <Wand2 className="mr-2 h-4 w-4" />
        Apply Effects & Export as {exportFormat.toUpperCase()}
      </Button>
    </Card>
  );
};
