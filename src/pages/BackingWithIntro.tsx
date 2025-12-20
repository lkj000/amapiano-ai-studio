import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Radio, Loader2, Download, Sparkles, Music, Mic2 } from 'lucide-react';

interface BackingWithIntroProps {
  user: User | null;
}

interface GeneratedTracks {
  instrumentalUrl: string;
  introUrl?: string;
  metadata: {
    genre: string;
    bpm: number;
    mood: string;
    source: string;
    hasVocals: boolean;
    hasIntro: boolean;
    duration: number;
  };
}

const BackingWithIntro: React.FC<BackingWithIntroProps> = ({ user }) => {
  const [lyrics, setLyrics] = useState('');
  const [artistName, setArtistName] = useState('');
  const [voiceType, setVoiceType] = useState('hype');
  const [genre, setGenre] = useState('Amapiano');
  const [mood, setMood] = useState('energetic African dance');
  const [bpm, setBpm] = useState([112]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTracks | null>(null);

  const voiceTypes = [
    { value: 'male', label: 'Male (Daniel)' },
    { value: 'female', label: 'Female (Sarah)' },
    { value: 'hype', label: 'Hype (Eric)' },
  ];

  const genres = [
    'Amapiano', 'Afrobeats', 'House', 'Hip Hop', 'R&B', 'Pop', 'Electronic'
  ];

  const moods = [
    'energetic African dance',
    'chill vibes',
    'party anthem',
    'deep and groovy',
    'uplifting celebration',
    'smooth and mellow'
  ];

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate tracks');
      return;
    }

    setIsGenerating(true);
    setGeneratedTracks(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-backing-with-intro', {
        body: {
          lyrics,
          artistName: artistName || 'Amapiano Studios',
          voiceType,
          genre,
          mood,
          bpm: bpm[0],
        },
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedTracks({
          instrumentalUrl: data.instrumentalUrl,
          introUrl: data.introUrl,
          metadata: data.metadata,
        });
        toast.success('Tracks generated successfully!');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate tracks');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/20">
            <Radio className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Backing Track with Intro</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Generate instrumental backing with a spoken intro/hook
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Track Settings
            </CardTitle>
            <CardDescription>
              Configure your backing track
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Artist/Producer Name</Label>
              <Input
                placeholder="e.g., DJ Beats"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used in the intro tagline</p>
            </div>

            <div className="space-y-2">
              <Label>Intro Voice</Label>
              <Select value={voiceType} onValueChange={setVoiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voiceTypes.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Genre</Label>
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
              <Label>Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lyrics / Hook</CardTitle>
            <CardDescription>
              Enter lyrics - the first lines will be used for the intro hook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your lyrics here...&#10;&#10;The first 1-2 lines will be used as the spoken intro hook."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="min-h-[240px] resize-none"
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
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
              <Radio className="mr-2 h-5 w-5" />
              Generate Backing + Intro
            </>
          )}
        </Button>
      </div>

      {generatedTracks && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Generated Tracks
            </CardTitle>
            <CardDescription>
              {generatedTracks.metadata.genre} • {generatedTracks.metadata.bpm} BPM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Music className="h-4 w-4" /> Instrumental Backing
              </Label>
              <audio controls className="w-full" src={generatedTracks.instrumentalUrl}>
                Your browser does not support the audio element.
              </audio>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href={generatedTracks.instrumentalUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Download Instrumental
                </a>
              </Button>
            </div>

            {generatedTracks.introUrl && (
              <div>
                <Label className="mb-2 flex items-center gap-2">
                  <Mic2 className="h-4 w-4" /> Spoken Intro
                </Label>
                <audio controls className="w-full" src={generatedTracks.introUrl}>
                  Your browser does not support the audio element.
                </audio>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href={generatedTracks.introUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download Intro
                  </a>
                </Button>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>Source: {generatedTracks.metadata.source}</p>
              <p>Duration: ~{generatedTracks.metadata.duration}s</p>
              <p>Has Intro: {generatedTracks.metadata.hasIntro ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackingWithIntro;
