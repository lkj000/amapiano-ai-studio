import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SmartClipPlayerProps {
  audioUrl: string;
  title: string;
  duration?: number;
  autoPlay?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onProgressUpdate?: (progress: number) => void;
  clipData?: {
    start_time: number;
    duration: number;
    engagement_score: number;
  };
}

const SmartClipPlayer: React.FC<SmartClipPlayerProps> = ({
  audioUrl,
  title,
  duration = 30,
  autoPlay = false,
  onPlayStart,
  onPlayEnd,
  onProgressUpdate,
  clipData
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Smart clip parameters
  const startTime = clipData?.start_time || 0;
  const clipDuration = clipData?.duration || 30;
  const endTime = startTime + clipDuration;

  const resetToStart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  }, [startTime]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Start from clip start time if not already positioned correctly
      if (audioRef.current.currentTime < startTime || audioRef.current.currentTime >= endTime) {
        audioRef.current.currentTime = startTime;
      }
      audioRef.current.play();
      setIsPlaying(true);
      onPlayStart?.();
    }
  }, [isPlaying, startTime, endTime, onPlayStart]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!audioRef.current.muted);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setAudioDuration(audio.duration || duration);
      setIsLoading(false);
      // Set initial position to clip start
      audio.currentTime = startTime;
      setCurrentTime(startTime);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      
      // Auto-loop within clip bounds
      if (time >= endTime && isPlaying) {
        audio.currentTime = startTime;
        setCurrentTime(startTime);
      }

      // Update progress based on clip duration
      const clipProgress = ((time - startTime) / clipDuration) * 100;
      onProgressUpdate?.(Math.max(0, Math.min(100, clipProgress)));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      resetToStart();
      onPlayEnd?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handleError = () => {
      setIsLoading(false);
      console.error('Error loading audio');
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('error', handleError);
    };
  }, [startTime, endTime, clipDuration, isPlaying, onProgressUpdate, onPlayEnd, resetToStart, duration]);

  useEffect(() => {
    if (autoPlay && !isLoading && audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading, startTime]);

  const clipProgress = ((currentTime - startTime) / clipDuration) * 100;
  const normalizedProgress = Math.max(0, Math.min(100, clipProgress));

  return (
    <div className="space-y-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Track Info */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {clipDuration}s clip
            </Badge>
            {clipData?.engagement_score && (
              <Badge variant="outline" className="text-xs">
                Score: {clipData.engagement_score.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-8 w-8 p-0"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={normalizedProgress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.max(0, currentTime - startTime).toFixed(1)}s</span>
          <span>{clipDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Main Play Button */}
      <div className="flex justify-center">
        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="lg"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="h-12 w-12 rounded-full p-0"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default SmartClipPlayer;