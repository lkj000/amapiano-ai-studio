import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  BarChart3, 
  Scissors,
  Music,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface GeneratedTrackPanelProps {
  audioUrl: string;
  metadata: {
    style?: string;
    quality_score?: number;
    cultural_authenticity?: number;
    ai_models_used?: string[];
    generation_time?: number;
  };
  orchestrationResult?: any;
}

export const GeneratedTrackPanel: React.FC<GeneratedTrackPanelProps> = ({
  audioUrl,
  metadata,
  orchestrationResult
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-track-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your track is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the track",
        variant: "destructive",
      });
    }
  };

  const handleUploadToDAW = () => {
    // Store track info in localStorage for DAW to pick up
    localStorage.setItem('pendingDAWTrack', JSON.stringify({
      url: audioUrl,
      metadata,
      orchestrationResult
    }));
    
    toast({
      title: "Opening DAW",
      description: "Track will be loaded into the DAW",
    });
    
    navigate('/daw');
  };

  const handleAnalyze = () => {
    // Store track info for analyzer
    localStorage.setItem('pendingAnalysisTrack', JSON.stringify({
      url: audioUrl,
      metadata,
      orchestrationResult
    }));
    
    toast({
      title: "Opening Analyzer",
      description: "Track will be analyzed",
    });
    
    navigate('/analyze');
  };

  const handleSourceSeparation = () => {
    // Store track for source separation
    localStorage.setItem('pendingStemTrack', JSON.stringify({
      url: audioUrl,
      metadata,
      orchestrationResult
    }));
    
    toast({
      title: "Source Separation",
      description: "Opening stem separation tool",
    });
    
    // Navigate to AI Hub with stem separation active
    navigate('/ai-hub?tool=stem-separation');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Generated Track
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              </CardTitle>
              <CardDescription>
                {metadata.style || 'Amapiano'} • Quality: {((metadata.quality_score || 0) * 100).toFixed(1)}% • 
                Authenticity: {((metadata.cultural_authenticity || 0) * 100).toFixed(1)}%
              </CardDescription>
            </div>
          </div>
          {metadata.ai_models_used && (
            <div className="flex gap-1">
              {metadata.ai_models_used.map((model, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {model.split('/')[1]?.split('-')[0] || model}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Audio Player */}
        <div className="space-y-3">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={togglePlay}
              className="rounded-full w-12 h-12 p-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            <div className="flex-1 space-y-1">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          
          <Button
            variant="outline"
            onClick={handleUploadToDAW}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Open in DAW
          </Button>
          
          <Button
            variant="outline"
            onClick={handleAnalyze}
            className="w-full"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analyze
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSourceSeparation}
            className="w-full"
          >
            <Scissors className="w-4 h-4 mr-2" />
            Separate Stems
          </Button>
        </div>

        {/* Quality Metrics */}
        {orchestrationResult && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {((orchestrationResult.quality_assessment?.overall_score || 0) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Quality Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {((orchestrationResult.cultural_validation?.overall_score || 0) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Authenticity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {orchestrationResult.execution_results?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">AI Steps</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
