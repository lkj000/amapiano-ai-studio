import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Music, Loader2, Download, Sparkles } from 'lucide-react';
import LyricsGenerator from '@/components/music/LyricsGenerator';
import VocalRemover from '@/components/music/VocalRemover';
import SoundEffectGenerator from '@/components/music/SoundEffectGenerator';
import { MusicToolsSidebar } from '@/components/music/MusicToolsSidebar';

interface SunoGeneratorProps {
  user: User | null;
}

interface GeneratedTrack {
  audioUrl: string;
  streamAudioUrl?: string;
  imageUrl?: string;
  metadata: {
    title: string;
    genre: string;
    bpm: number;
    mood: string;
    style: string;
    source: string;
    hasVocals: boolean;
    duration: number;
    modelVersion: string;
    taskId: string;
  };
}

const SunoGenerator: React.FC<SunoGeneratorProps> = ({ user }) => {
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Amapiano');
  const [mood, setMood] = useState('energetic');
  const [bpm, setBpm] = useState([112]);
  const [instrumental, setInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<GeneratedTrack | null>(null);

  const genres = [
    'Amapiano', 'Afrobeats', 'Hip Hop', 'R&B', 'Pop', 'Electronic', 
    'House', 'Jazz', 'Rock', 'Classical', 'Reggae', 'Latin'
  ];

  const moods = [
    'energetic', 'chill', 'melancholic', 'uplifting', 'dark', 
    'romantic', 'aggressive', 'peaceful', 'nostalgic', 'euphoric'
  ];

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate songs');
      return;
    }

    if (!lyrics && !instrumental) {
      toast.error('Please enter lyrics or enable instrumental mode');
      return;
    }

    setIsGenerating(true);
    setGeneratedTrack(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-song-suno', {
        body: {
          lyrics: instrumental ? null : lyrics,
          title: title || `${genre} Track`,
          genre,
          mood,
          bpm: bpm[0],
          instrumental,
          customMode: true,
        },
      });

      if (error) throw error;

      if (data.requiresSetup) {
        toast.error(data.message || 'API key not configured');
        return;
      }

      if (data.pending) {
        toast.info('Generation in progress. This may take a few minutes.');
        return;
      }

      if (data.success && data.audioUrl) {
        setGeneratedTrack({
          audioUrl: data.audioUrl,
          streamAudioUrl: data.streamAudioUrl,
          imageUrl: data.imageUrl,
          metadata: data.metadata,
        });
        toast.success('Song generated successfully!');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate song');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <MusicToolsSidebar activeTool="music-generator" />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">Suno AI Music Generator</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Create professional AI-generated music with vocals using Suno V4
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Song Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure your song parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Song Title</Label>
                        <Input
                          id="title"
                          placeholder="My Amazing Track"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Select value={genre} onValueChange={setGenre}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            {genres.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mood">Mood</Label>
                        <Select value={mood} onValueChange={setMood}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mood" />
                          </SelectTrigger>
                          <SelectContent>
                            {moods.map((m) => (
                              <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>BPM: {bpm[0]}</Label>
                        <Slider
                          value={bpm}
                          onValueChange={setBpm}
                          min={60}
                          max={180}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="instrumental">Instrumental Only</Label>
                        <Switch
                          id="instrumental"
                          checked={instrumental}
                          onCheckedChange={setInstrumental}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Lyrics</CardTitle>
                      <CardDescription>
                        {instrumental ? 'Disabled for instrumental tracks' : 'Enter your song lyrics (max 3000 characters)'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder={instrumental ? 'Lyrics disabled for instrumental mode' : 'Enter your lyrics here...\n\n[Verse 1]\nYour lyrics...\n\n[Chorus]\nYour chorus...'}
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        disabled={instrumental}
                        className="min-h-[200px] resize-none"
                        maxLength={3000}
                      />
                      {!instrumental && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {lyrics.length}/3000 characters
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!lyrics && !instrumental)}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating... (this may take 2-3 minutes)
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Song
                    </>
                  )}
                </Button>

                {generatedTrack && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-primary" />
                        Generated Track
                      </CardTitle>
                      <CardDescription>
                        {generatedTrack.metadata.title} • {generatedTrack.metadata.genre} • {generatedTrack.metadata.bpm} BPM
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {generatedTrack.imageUrl && (
                        <div className="flex justify-center">
                          <img 
                            src={generatedTrack.imageUrl} 
                            alt="Track cover" 
                            className="w-48 h-48 rounded-lg object-cover"
                          />
                        </div>
                      )}
                      
                      <audio 
                        controls 
                        className="w-full" 
                        src={generatedTrack.streamAudioUrl || generatedTrack.audioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>

                      <div className="flex gap-4 justify-center">
                        <Button variant="outline" asChild>
                          <a 
                            href={generatedTrack.audioUrl} 
                            download={`${generatedTrack.metadata.title || 'track'}.mp3`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Model: Suno {generatedTrack.metadata.modelVersion}</p>
                        <p>Duration: ~{generatedTrack.metadata.duration}s</p>
                        <p>Type: {generatedTrack.metadata.hasVocals ? 'With Vocals' : 'Instrumental'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <LyricsGenerator compact onLyricsGenerated={(l) => setLyrics(l)} />
                <VocalRemover compact />
                <SoundEffectGenerator compact />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SunoGenerator;
