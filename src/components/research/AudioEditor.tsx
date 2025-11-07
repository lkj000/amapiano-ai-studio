import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Scissors, Volume2, Wand2, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioEditorProps {
  audioUrl: string;
  onExport: (blob: Blob) => void;
}

export const AudioEditor = ({ audioUrl, onExport }: AudioEditorProps) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([100]);
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const [fadeIn, setFadeIn] = useState([0]);
  const [fadeOut, setFadeOut] = useState([0]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audio file",
        variant: "destructive",
      });
    }
  };

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
      const wavBlob = await audioBufferToWav(renderedBuffer);
      
      onExport(wavBlob);
      
      toast({
        title: "Success",
        description: "Audio effects applied successfully",
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

  const reset = () => {
    setVolume([100]);
    setTrimStart([0]);
    setTrimEnd([100]);
    setFadeIn([0]);
    setFadeOut([0]);
    stopPlayback();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Audio Editor</h3>
        <div className="flex gap-2">
          <Button onClick={playPreview} variant="outline" size="sm">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button onClick={reset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
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

      <Button onClick={applyEffects} className="w-full" disabled={!audioBuffer}>
        <Wand2 className="mr-2 h-4 w-4" />
        Apply Effects & Export
      </Button>
    </Card>
  );
};
