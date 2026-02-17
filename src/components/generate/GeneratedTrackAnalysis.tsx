import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3 } from 'lucide-react';
import { analyzeReferenceBuffer } from '@/lib/audio/ReferenceToGenerate';

interface GeneratedTrackAnalysisProps {
  audioUrl: string;
}

export const GeneratedTrackAnalysis: React.FC<GeneratedTrackAnalysisProps> = ({ audioUrl }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio');
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 22050 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const constraints = await analyzeReferenceBuffer(audioBuffer);
      await audioContext.close();

      setAnalysis({
        bpm: Math.round(constraints.bpm * 10) / 10,
        key: constraints.key,
        camelot: constraints.camelot,
        energy: constraints.avgEnergy,
        mood: constraints.avgEnergy > 0.6 ? 'Energetic' : constraints.avgEnergy > 0.35 ? 'Groovy' : 'Mellow',
        genre: constraints.genre.subgenre?.replace(/_/g, ' ') || 'Amapiano',
        isAmapiano: constraints.isAmapiano,
        lufs: constraints.targetLufs,
        duration: Math.round(audioBuffer.duration),
      });
    } catch (err) {
      console.error('Generated track analysis failed:', err);
      setError('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!analysis && !isAnalyzing) {
    return (
      <Button variant="outline" size="sm" onClick={runAnalysis} className="w-full gap-2">
        <BarChart3 className="w-4 h-4" />
        Analyze Generated Track
      </Button>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Analyzing generated track...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">BPM</span>
        <span className="font-medium">{analysis.bpm}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Key</span>
        <span className="font-medium">{analysis.key}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Genre</span>
        <span className="font-medium capitalize">{analysis.genre}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Mood</span>
        <span className="font-medium">{analysis.mood}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Energy</span>
        <div className="flex items-center gap-2">
          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${analysis.energy * 100}%` }} />
          </div>
          <span className="font-medium">{Math.round(analysis.energy * 100)}%</span>
        </div>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">LUFS</span>
        <span className="font-medium">{analysis.lufs?.toFixed(1) ?? '—'}</span>
      </div>
      {analysis.isAmapiano && (
        <div className="col-span-2">
          <Badge variant="secondary" className="text-xs">✅ Amapiano Detected</Badge>
        </div>
      )}
    </div>
  );
};
