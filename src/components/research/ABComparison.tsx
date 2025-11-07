import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  volume: number;
  fadeIn: number;
  fadeOut: number;
  trimStart: number;
  trimEnd: number;
}

interface ABComparisonProps {
  audioUrl: string;
  settingsA: Settings;
  settingsB: Settings;
  onSettingsAChange: (settings: Settings) => void;
  onSettingsBChange: (settings: Settings) => void;
}

export const ABComparison = ({
  audioUrl,
  settingsA,
  settingsB,
  onSettingsAChange,
  onSettingsBChange
}: ABComparisonProps) => {
  const { toast } = useToast();
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceARef = useRef<AudioBufferSourceNode | null>(null);
  const sourceBRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    loadAudio();
    return () => {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load audio",
        variant: "destructive",
      });
    }
  };

  const playVersion = (version: 'A' | 'B') => {
    if (!audioBuffer || !audioContextRef.current) return;

    const settings = version === 'A' ? settingsA : settingsB;
    const setPlaying = version === 'A' ? setPlayingA : setPlayingB;
    const sourceRef = version === 'A' ? sourceARef : sourceBRef;

    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
      setPlaying(false);
      return;
    }

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.value = settings.volume / 100;

    const duration = audioBuffer.duration;
    const startTime = (settings.trimStart / 100) * duration;
    const endTime = (settings.trimEnd / 100) * duration;
    const playDuration = endTime - startTime;

    source.start(0, startTime, playDuration);
    sourceRef.current = source;
    setPlaying(true);

    source.onended = () => {
      setPlaying(false);
      sourceRef.current = null;
    };
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Version A</Label>
          <Button
            onClick={() => playVersion('A')}
            variant="outline"
            size="sm"
          >
            {playingA ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Volume: {settingsA.volume}%</Label>
            <Slider
              value={[settingsA.volume]}
              onValueChange={([v]) => onSettingsAChange({ ...settingsA, volume: v })}
              max={200}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Fade In: {settingsA.fadeIn}%</Label>
            <Slider
              value={[settingsA.fadeIn]}
              onValueChange={([v]) => onSettingsAChange({ ...settingsA, fadeIn: v })}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Fade Out: {settingsA.fadeOut}%</Label>
            <Slider
              value={[settingsA.fadeOut]}
              onValueChange={([v]) => onSettingsAChange({ ...settingsA, fadeOut: v })}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Trim Start: {settingsA.trimStart}%</Label>
            <Slider
              value={[settingsA.trimStart]}
              onValueChange={([v]) => onSettingsAChange({ ...settingsA, trimStart: v })}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Trim End: {settingsA.trimEnd}%</Label>
            <Slider
              value={[settingsA.trimEnd]}
              onValueChange={([v]) => onSettingsAChange({ ...settingsA, trimEnd: v })}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Version B</Label>
          <Button
            onClick={() => playVersion('B')}
            variant="outline"
            size="sm"
          >
            {playingB ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Volume: {settingsB.volume}%</Label>
            <Slider
              value={[settingsB.volume]}
              onValueChange={([v]) => onSettingsBChange({ ...settingsB, volume: v })}
              max={200}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Fade In: {settingsB.fadeIn}%</Label>
            <Slider
              value={[settingsB.fadeIn]}
              onValueChange={([v]) => onSettingsBChange({ ...settingsB, fadeIn: v })}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Fade Out: {settingsB.fadeOut}%</Label>
            <Slider
              value={[settingsB.fadeOut]}
              onValueChange={([v]) => onSettingsBChange({ ...settingsB, fadeOut: v })}
              max={50}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Trim Start: {settingsB.trimStart}%</Label>
            <Slider
              value={[settingsB.trimStart]}
              onValueChange={([v]) => onSettingsBChange({ ...settingsB, trimStart: v })}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs">Trim End: {settingsB.trimEnd}%</Label>
            <Slider
              value={[settingsB.trimEnd]}
              onValueChange={([v]) => onSettingsBChange({ ...settingsB, trimEnd: v })}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
