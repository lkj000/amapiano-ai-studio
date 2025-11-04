import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAutoTimeStretch } from '@/hooks/useAutoTimeStretch';
import { Clock, Zap, FileAudio } from 'lucide-react';

interface AutoTimeStretchPanelProps {
  audioContext?: AudioContext;
  onStretchComplete?: (buffer: AudioBuffer, originalBPM: number, targetBPM: number) => void;
  className?: string;
}

export function AutoTimeStretchPanel({ 
  audioContext,
  onStretchComplete,
  className 
}: AutoTimeStretchPanelProps) {
  const [targetBPM, setTargetBPM] = useState(112);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const { timeStretch, detectTempo, isProcessing } = useAutoTimeStretch();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);

    // Detect tempo
    const arrayBuffer = await file.arrayBuffer();
    const ctx = audioContext || new AudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    const bpm = detectTempo(audioBuffer);
    setDetectedBPM(bpm);
    
    toast({
      title: "Tempo Detected",
      description: `Original BPM: ${bpm}`,
    });
  };

  const handleTimeStretch = async () => {
    if (!audioFile || !audioContext) {
      toast({
        title: "Error",
        description: "Please select an audio file first",
        variant: "destructive",
      });
      return;
    }

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const result = await timeStretch(audioBuffer, targetBPM, audioContext);
      
      onStretchComplete?.(result.stretchedBuffer, result.originalTempo, result.targetTempo);
    } catch (error) {
      toast({
        title: "Time-Stretch Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={className}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Auto Time-Stretch Engine</h3>
          <span className="ml-auto text-xs text-muted-foreground">90% faster</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audio-file">Select Audio File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="audio-file"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="flex-1"
              />
              {audioFile && (
                <FileAudio className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>

          {detectedBPM && (
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">Detected Tempo: {detectedBPM} BPM</p>
              <p className="text-xs text-muted-foreground mt-1">
                AI-powered tempo detection
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="target-bpm">Target BPM (108-118)</Label>
            <Input
              id="target-bpm"
              type="number"
              min={108}
              max={118}
              value={targetBPM}
              onChange={(e) => setTargetBPM(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Optimal Amapiano range
            </p>
          </div>

          <Button
            onClick={handleTimeStretch}
            disabled={!audioFile || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Zap className="mr-2 h-4 w-4 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Time-Stretch Audio
              </>
            )}
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-medium">Features:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Automatic tempo detection</li>
            <li>• Pitch-preserving time-stretch</li>
            <li>• Optimized for percussion loops</li>
            <li>• 90% reduction in manual work</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
