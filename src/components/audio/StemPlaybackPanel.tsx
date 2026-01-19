import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Music, 
  Mic2, 
  Drum, 
  Guitar, 
  Piano,
  Waves,
  FolderDown
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Stem {
  id: string;
  name: string;
  audioUrl: string;
  category?: string;
}

interface StemPlaybackPanelProps {
  originalAudioUrl?: string;
  originalFileName?: string;
  stems: Stem[];
  enhancedAudioUrl?: string;
  title?: string;
}

const STEM_ICONS: Record<string, React.ReactNode> = {
  vocals: <Mic2 className="w-4 h-4" />,
  drums: <Drum className="w-4 h-4" />,
  bass: <Waves className="w-4 h-4" />,
  guitar: <Guitar className="w-4 h-4" />,
  piano: <Piano className="w-4 h-4" />,
  keys: <Piano className="w-4 h-4" />,
  other: <Music className="w-4 h-4" />,
  synth: <Music className="w-4 h-4" />,
};

const STEM_COLORS: Record<string, string> = {
  vocals: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
  drums: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  bass: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  guitar: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  piano: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  keys: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  other: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
  synth: 'bg-green-500/20 text-green-500 border-green-500/30',
};

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

const StemPlayer: React.FC<{ stem: Stem; onDownload: (stem: Stem) => void }> = ({ stem, onDownload }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setState(s => ({ ...s, currentTime: audio.currentTime }));
    const handleDurationChange = () => setState(s => ({ ...s, duration: audio.duration || 0 }));
    const handleEnded = () => setState(s => ({ ...s, isPlaying: false, currentTime: 0 }));

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setState(s => ({ ...s, isPlaying: !s.isPlaying }));
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setState(s => ({ ...s, currentTime: value[0] }));
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value[0];
    setState(s => ({ ...s, volume: value[0], isMuted: value[0] === 0 }));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !state.isMuted;
    setState(s => ({ ...s, isMuted: !s.isMuted }));
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const category = stem.category || stem.id.toLowerCase();
  const icon = STEM_ICONS[category] || STEM_ICONS.other;
  const colorClass = STEM_COLORS[category] || STEM_COLORS.other;

  return (
    <div className={`p-3 rounded-lg border ${colorClass} space-y-2`}>
      <audio ref={audioRef} src={stem.audioUrl} preload="metadata" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{stem.name || stem.id}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {category}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDownload(stem)}
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={togglePlay}
        >
          {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs w-10">{formatTime(state.currentTime)}</span>
          <Slider
            value={[state.currentTime]}
            max={state.duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-xs w-10 text-right">{formatTime(state.duration)}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggleMute}
        >
          {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        
        <Slider
          value={[state.isMuted ? 0 : state.volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-20"
        />
      </div>
    </div>
  );
};

export const StemPlaybackPanel: React.FC<StemPlaybackPanelProps> = ({
  originalAudioUrl,
  originalFileName,
  stems,
  enhancedAudioUrl,
  title = 'Audio Playback'
}) => {
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const downloadStem = async (stem: Stem) => {
    try {
      toast.info(`Downloading ${stem.name || stem.id}...`);
      
      const response = await fetch(stem.audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${stem.name || stem.id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${stem.name || stem.id}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download stem');
    }
  };

  const downloadAllStems = async () => {
    if (stems.length === 0) {
      toast.error('No stems to download');
      return;
    }

    setIsDownloadingAll(true);
    toast.info('Preparing stems ZIP file...');

    try {
      const stemData = stems.map(stem => ({
        url: stem.audioUrl,
        name: `${stem.name || stem.id}.mp3`
      }));

      const { data, error } = await supabase.functions.invoke('zip-stems', {
        body: {
          stems: stemData,
          projectName: originalFileName?.replace(/\.[^/.]+$/, '') || 'separated-stems'
        }
      });

      if (error) throw error;

      // Create download from base64
      const binaryStr = atob(data.zipBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || 'stems.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('All stems downloaded as ZIP!');
    } catch (error) {
      console.error('ZIP download error:', error);
      toast.error('Failed to create ZIP. Downloading individually...');
      
      // Fallback to individual downloads
      for (const stem of stems) {
        await downloadStem(stem);
        await new Promise(r => setTimeout(r, 500));
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          {stems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAllStems}
              disabled={isDownloadingAll}
            >
              <FolderDown className="w-4 h-4 mr-2" />
              {isDownloadingAll ? 'Creating ZIP...' : 'Download All'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Track */}
        {originalAudioUrl && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Original Track</h4>
            <StemPlayer
              stem={{
                id: 'original',
                name: originalFileName || 'Original',
                audioUrl: originalAudioUrl,
                category: 'other'
              }}
              onDownload={downloadStem}
            />
          </div>
        )}

        {/* Separated Stems */}
        {stems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Separated Stems ({stems.length})
            </h4>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-4">
                {stems.map((stem) => (
                  <StemPlayer key={stem.id} stem={stem} onDownload={downloadStem} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Enhanced/Amapianorized Track */}
        {enhancedAudioUrl && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Amapianorized Output</h4>
            <StemPlayer
              stem={{
                id: 'enhanced',
                name: 'Amapianorized Mix',
                audioUrl: enhancedAudioUrl,
                category: 'synth'
              }}
              onDownload={downloadStem}
            />
          </div>
        )}

        {!originalAudioUrl && stems.length === 0 && !enhancedAudioUrl && (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No audio files available yet</p>
            <p className="text-sm">Upload and process a track to see playback options</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
