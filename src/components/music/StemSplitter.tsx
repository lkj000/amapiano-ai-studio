import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Upload, Loader2, Play, Pause, Download, Music, Mic2, Drum, Guitar, FileArchive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StemSplitterProps {
  compact?: boolean;
}

interface StemResult {
  vocals?: string;
  drums?: string;
  bass?: string;
  other?: string;
}

const StemSplitter: React.FC<StemSplitterProps> = ({ compact = false }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stems, setStems] = useState<StemResult | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-load from localStorage (handoff from Generate page)
  useEffect(() => {
    const pending = localStorage.getItem('pendingStemTrack');
    if (pending) {
      localStorage.removeItem('pendingStemTrack');
      try {
        const data = JSON.parse(pending);
        if (data.audioUrl) {
          toast.info(`Loading reference track for stem splitting...`);
          // Fetch the blob URL or public URL and create a File
          fetch(data.audioUrl)
            .then(res => res.blob())
            .then(blob => {
              const fileName = data.title || 'reference-track';
              const f = new File([blob], `${fileName}.mp3`, { type: blob.type || 'audio/mpeg' });
              setFile(f);
              toast.success(`"${fileName}" loaded — click Split into Stems to proceed`);
            })
            .catch(err => {
              console.error('[StemSplitter] Failed to load pending track:', err);
              toast.error('Failed to load reference track');
            });
        }
      } catch (e) {
        console.error('[StemSplitter] Invalid pending data:', e);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('audio/')) {
        toast.error('Please select an audio file');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setStems(null);
    }
  };

  const handleSplit = async () => {
    if (!file) {
      toast.error('Please select an audio file');
      return;
    }

    setIsProcessing(true);
    setStems(null);

    try {
      const formData = new FormData();
      formData.append('audio', file);

      // Step 1: Start the separation job
      toast.info('Uploading audio for AI stem separation...');
      
      const startResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stem-splitter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      const startData = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(startData.error || 'Failed to start stem separation');
      }

      if (!startData.predictionId) {
        throw new Error(startData.error || 'No prediction ID returned');
      }

      console.log('[StemSplitter] Job started:', startData.predictionId);
      toast.info('AI is separating stems... This may take 2-4 minutes.');

      // Step 2: Poll for completion
      const maxAttempts = 120; // 4 minutes (2s intervals)
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        const pollResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stem-splitter`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ predictionId: startData.predictionId }),
          }
        );

        if (!pollResponse.ok) {
          console.warn('[StemSplitter] Poll failed:', pollResponse.status);
          continue;
        }

        const pollData = await pollResponse.json();
        console.log('[StemSplitter] Poll status:', pollData.status);

        if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Stem separation failed');
        }

        if (pollData.status === 'succeeded' && pollData.stems) {
          console.log('[StemSplitter] Received stems:', pollData.stems);
          setStems(pollData.stems);
          toast.success('Stems separated successfully!');
          return;
        }
      }

      throw new Error('Stem separation timed out after 4 minutes');
    } catch (error) {
      console.error('Stem splitting error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to split stems');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = (trackName: string, url: string) => {
    const audio = audioRefs.current[trackName];
    
    if (playingTrack === trackName && audio) {
      audio.pause();
      setPlayingTrack(null);
    } else {
      // Pause any currently playing track
      Object.values(audioRefs.current).forEach(a => a?.pause());
      
      if (!audio) {
        const newAudio = new Audio(url);
        newAudio.crossOrigin = 'anonymous';
        newAudio.onended = () => setPlayingTrack(null);
        newAudio.onerror = (e) => {
          console.error('[StemSplitter] Audio playback error:', e, 'URL:', url);
          toast.error(`Failed to play ${trackName}. The stem URL may have expired.`);
          setPlayingTrack(null);
        };
        newAudio.oncanplay = () => {
          console.log('[StemSplitter] Audio ready to play:', trackName);
        };
        audioRefs.current[trackName] = newAudio;
        newAudio.play().catch(err => {
          console.error('[StemSplitter] Play failed:', err);
          toast.error(`Playback blocked: ${err.message}`);
          setPlayingTrack(null);
        });
      } else {
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error('[StemSplitter] Resume failed:', err);
          toast.error(`Playback error: ${err.message}`);
          setPlayingTrack(null);
        });
      }
      setPlayingTrack(trackName);
    }
  };

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const stemItems = [
    { key: 'vocals', label: 'Vocals', icon: Mic2, color: 'text-pink-500' },
    { key: 'drums', label: 'Drums', icon: Drum, color: 'text-orange-500' },
    { key: 'bass', label: 'Bass', icon: Guitar, color: 'text-blue-500' },
    { key: 'other', label: 'Other', icon: Music, color: 'text-green-500' },
  ];

  const downloadAllAsZip = async () => {
    if (!stems) return;
    
    const stemsWithUrls = stemItems
      .filter(item => stems[item.key as keyof StemResult])
      .map(item => ({
        name: `${item.key}.wav`,
        url: stems[item.key as keyof StemResult]!,
      }));

    if (stemsWithUrls.length === 0) {
      toast.error('No stems available to download');
      return;
    }

    setIsDownloadingZip(true);
    try {
      toast.info('Creating ZIP archive...');

      const { data, error } = await supabase.functions.invoke('zip-stems', {
        body: {
          stems: stemsWithUrls,
          projectName: file?.name.replace(/\.[^.]+$/, '') || 'stems',
        },
      });

      if (error) throw error;
      if (!data?.zipData) throw new Error('No ZIP data returned');

      // Convert base64 to blob and download
      const binaryString = atob(data.zipData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || 'stems-export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('ZIP file downloaded!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`ZIP download failed: ${msg}`);
      console.error('[ZIP] Error:', error);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const importToDAW = () => {
    if (!stems) return;
    
    const stemData = stemItems
      .filter(item => stems[item.key as keyof StemResult])
      .map(item => ({
        name: item.label,
        instrument: item.key,
        color: item.color.replace('text-', 'bg-'),
        volume: 80,
        audioUrl: stems[item.key as keyof StemResult],
      }));

    localStorage.setItem('pendingDAWImport', JSON.stringify({
      stems: stemData,
      timestamp: Date.now(),
    }));

    window.location.href = '/daw';
    toast.success('Navigating to DAW...');
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Music className="h-5 w-5" />
            Stem Splitter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {file ? file.name : 'Select Audio File'}
          </Button>
          <Button
            onClick={handleSplit}
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Split Stems'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-6 w-6" />
          AI Stem Splitter
        </CardTitle>
        <CardDescription>
          Separate audio into vocals, drums, bass, and other instruments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="local" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">My Music</TabsTrigger>
            <TabsTrigger value="local">Local File</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="py-4">
            <div className="text-center text-muted-foreground py-8">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No music available in your library yet.</p>
              <p className="text-sm mt-2">Generate some music first or upload a local file.</p>
            </div>
          </TabsContent>
          <TabsContent value="local" className="py-4">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Click to upload audio</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports MP3, WAV, FLAC (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSplit}
          disabled={!file || isProcessing}
          className="w-full h-12"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Separating Stems... (this may take 2-4 minutes)
            </>
          ) : (
            <>
              <Music className="mr-2 h-5 w-5" />
              Split into Stems
            </>
          )}
        </Button>

        {stems && (
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-lg">Separated Stems</h3>
            <div className="grid gap-3">
              {stemItems.map(({ key, label, icon: Icon, color }) => {
                const url = stems[key as keyof StemResult];
                if (!url) return null;
                
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePlay(key, url)}
                      >
                        {playingTrack === key ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={url} download={`${key}.mp3`} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Batch Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                onClick={downloadAllAsZip}
                disabled={isDownloadingZip}
                variant="outline"
              >
                {isDownloadingZip ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileArchive className="mr-2 h-4 w-4" />
                )}
                Download All as ZIP
              </Button>
              <Button onClick={importToDAW} variant="outline">
                <Music className="mr-2 h-4 w-4" />
                Import to DAW
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StemSplitter;
