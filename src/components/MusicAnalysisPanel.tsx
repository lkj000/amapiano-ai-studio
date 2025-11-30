import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Zap, Music } from 'lucide-react';
import { musicAnalyzer, MusicAnalysisResult } from '@/lib/audio/musicAnalysis';
import { audioSampleLoader } from '@/lib/audio/sampleLoader';
import { toast } from 'sonner';

interface MusicAnalysisPanelProps {
  audioUrl?: string;
  onAnalysisComplete?: (result: MusicAnalysisResult) => void;
}

export function MusicAnalysisPanel({ audioUrl, onAnalysisComplete }: MusicAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MusicAnalysisResult | null>(null);

  const runAnalysis = async () => {
    if (!audioUrl) {
      toast.error('No audio URL provided');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Initialize audio context
      const audioContext = new AudioContext();
      audioSampleLoader.initialize(audioContext);
      musicAnalyzer.initialize(audioContext);

      // Load audio
      toast.info('Loading audio...');
      const audioBuffer = await audioSampleLoader.loadSample(audioUrl);

      // Analyze
      toast.info('Analyzing musicality metrics...');
      const analysisResult = await musicAnalyzer.analyzeAudio(audioBuffer);
      
      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
      
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number): { variant: 'default' | 'secondary' | 'destructive'; label: string } => {
    if (score >= 80) return { variant: 'default', label: 'Excellent' };
    if (score >= 60) return { variant: 'secondary', label: 'Good' };
    return { variant: 'destructive', label: 'Needs Improvement' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Musicality Analysis
        </CardTitle>
        <CardDescription>
          Objective metrics for audio quality assessment (WP5 Benchmarking)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button 
          onClick={runAnalysis} 
          disabled={isAnalyzing || !audioUrl}
          className="w-full"
        >
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>

        {result && (
          <div className="space-y-4">
            {/* Beat Consistency Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Beat Consistency Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(result.beatConsistencyScore)}`}>
                    {result.beatConsistencyScore.toFixed(1)}
                  </span>
                  <Badge {...getScoreBadge(result.beatConsistencyScore)}>
                    {getScoreBadge(result.beatConsistencyScore).label}
                  </Badge>
                </div>
              </div>
              <Progress value={result.beatConsistencyScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Tempo stability · Estimated BPM: {result.estimatedBPM}
              </p>
            </div>

            {/* Key Stability Index */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Key Stability Index</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(result.keyStabilityIndex)}`}>
                    {result.keyStabilityIndex.toFixed(1)}
                  </span>
                  <Badge {...getScoreBadge(result.keyStabilityIndex)}>
                    {getScoreBadge(result.keyStabilityIndex).label}
                  </Badge>
                </div>
              </div>
              <Progress value={result.keyStabilityIndex} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Pitch drift detection · Dominant freq: {result.dominantFrequency.toFixed(1)} Hz
              </p>
            </div>

            {/* Transient Preservation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Transient Preservation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor((1 - result.transientSmearingRatio) * 100)}`}>
                    {((1 - result.transientSmearingRatio) * 100).toFixed(1)}
                  </span>
                  <Badge {...getScoreBadge((1 - result.transientSmearingRatio) * 100)}>
                    {getScoreBadge((1 - result.transientSmearingRatio) * 100).label}
                  </Badge>
                </div>
              </div>
              <Progress value={(1 - result.transientSmearingRatio) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Attack clarity · Lower smearing = better
              </p>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Spectral Flatness</p>
                <p className="text-lg font-semibold">{result.spectralFlatness.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Crest Factor</p>
                <p className="text-lg font-semibold">{result.crestFactor.toFixed(1)} dB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dynamic Range</p>
                <p className="text-lg font-semibold">{result.dynamicRange.toFixed(1)} dB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall Quality</p>
                <Badge variant="outline" className="text-sm">
                  {((result.beatConsistencyScore + result.keyStabilityIndex + (1 - result.transientSmearingRatio) * 100) / 3).toFixed(1)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
