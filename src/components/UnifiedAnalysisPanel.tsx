import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUnifiedMusicAnalysis } from '@/hooks/useUnifiedMusicAnalysis';
import { useRealtimeFeatureExtraction } from '@/hooks/useRealtimeFeatureExtraction';
import { 
  Music, Sparkles, TrendingUp, Brain, Target, 
  FileAudio, Zap, CheckCircle, Cpu
} from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedAnalysisPanelProps {
  file?: File;
  onAnalysisComplete?: (result: any) => void;
  className?: string;
  showOptions?: boolean;
}

export const UnifiedAnalysisPanel: React.FC<UnifiedAnalysisPanelProps> = ({
  file,
  onAnalysisComplete,
  className = '',
  showOptions = true
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(file || null);
  const [includeCultural, setIncludeCultural] = useState(true);
  const [includeTheory, setIncludeTheory] = useState(false);
  const [includeCommercial, setIncludeCommercial] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'quick' | 'comprehensive'>('comprehensive');
  const [useWASM, setUseWASM] = useState(true);

  const { 
    analyzeComprehensive, 
    analyzeQuick,
    isAnalyzing, 
    progress, 
    analysisStage, 
    result 
  } = useUnifiedMusicAnalysis();

  const wasmExtractor = useRealtimeFeatureExtraction();

  // Auto-initialize WASM
  useEffect(() => {
    if (useWASM && !wasmExtractor.isInitialized) {
      wasmExtractor.initialize();
    }
  }, [useWASM]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      if (!uploadedFile.type.startsWith('audio/')) {
        toast.error('Please upload an audio file');
        return;
      }
      setSelectedFile(uploadedFile);
      toast.success('File loaded. Ready to analyze.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      let analysisResult;
      
      if (analysisMode === 'quick') {
        analysisResult = await analyzeQuick(selectedFile);
      } else {
        analysisResult = await analyzeComprehensive(selectedFile, {
          includeCultural,
          includeTheory,
          includeCommercial
        });
      }

      onAnalysisComplete?.(analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-Powered Music Analysis
        </CardTitle>
        <CardDescription>
          Comprehensive Essentia analysis with deep learning models for genre, mood, and cultural insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        {!file && (
          <div className="space-y-2">
            <Label htmlFor="audio-file">Audio File</Label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="audio-file"
              />
              <label htmlFor="audio-file" className="flex-1">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <FileAudio className="mr-2 h-4 w-4" />
                    {selectedFile ? selectedFile.name : 'Select Audio File'}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {/* Analysis Options */}
        {showOptions && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Analysis Mode</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={analysisMode === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAnalysisMode('quick')}
                  className="flex-1"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Quick
                </Button>
                <Button
                  variant={analysisMode === 'comprehensive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAnalysisMode('comprehensive')}
                  className="flex-1"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Comprehensive
                </Button>
              </div>
            </div>

            {analysisMode === 'comprehensive' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Additional Analysis</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cultural" className="text-sm cursor-pointer">
                      Cultural Authenticity
                    </Label>
                    <Switch
                      id="cultural"
                      checked={includeCultural}
                      onCheckedChange={setIncludeCultural}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theory" className="text-sm cursor-pointer">
                      Music Theory
                    </Label>
                    <Switch
                      id="theory"
                      checked={includeTheory}
                      onCheckedChange={setIncludeTheory}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="commercial" className="text-sm cursor-pointer">
                      Commercial Potential
                    </Label>
                    <Switch
                      id="commercial"
                      checked={includeCommercial}
                      onCheckedChange={setIncludeCommercial}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !selectedFile}
          className="w-full"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with AI
            </>
          )}
        </Button>

        {/* Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{analysisStage}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            {progress > 97 && (
              <p className="text-xs text-muted-foreground animate-pulse flex items-center justify-center gap-2">
                <Sparkles className="h-3 w-3" />
                Running AI models for genre, mood, and cultural analysis...
              </p>
            )}
          </div>
        )}

        {/* Quick Results Summary */}
        {result && result.essentia?.deepLearning && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                AI Analysis Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.essentia.deepLearning.genres && (
                <div>
                  <span className="text-sm font-medium">Top Genre:</span>
                  <Badge variant="secondary" className="ml-2">
                    {result.essentia.deepLearning.genres[0].name}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    {(result.essentia.deepLearning.genres[0].confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              
              {result.essentia.deepLearning.mood && (
                <div>
                  <span className="text-sm font-medium">Mood:</span>
                  <Badge variant="outline" className="ml-2">
                    {result.essentia.deepLearning.mood.primary}
                  </Badge>
                </div>
              )}

              {result.essentia.deepLearning.danceability && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Danceability</span>
                    <span>{(result.essentia.deepLearning.danceability.score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={result.essentia.deepLearning.danceability.score * 100} className="h-2" />
                </div>
              )}

              {result.cultural && (
                <div className="space-y-1 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Cultural Authenticity</span>
                    <span>{(result.cultural.score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={result.cultural.score * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
