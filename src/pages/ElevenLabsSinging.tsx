import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Mic, Loader2, Download, Sparkles, Music } from 'lucide-react';
import LyricsGenerator from '@/components/music/LyricsGenerator';
import VocalRemover from '@/components/music/VocalRemover';
import SoundEffectGenerator from '@/components/music/SoundEffectGenerator';
import { MusicToolsSidebar } from '@/components/music/MusicToolsSidebar';
import { SA_LANGUAGES } from '@/constants/languages';
import { AMAPIANO_VOICE_CATEGORIES, SA_GENRES } from '@/constants/amapianoVoices';

interface ElevenLabsSingingProps {
  user: User | null;
}

interface GeneratedTrack {
  vocalUrl: string;
  instrumentalUrl?: string;
  metadata: {
    voiceType: string;
    voiceStyle: string;
    bpm: number;
    genre: string;
    source: string;
    hasVocals: boolean;
    hasBacking: boolean;
    duration: number;
  };
}

const ElevenLabsSinging: React.FC<ElevenLabsSingingProps> = ({ user }) => {
  const [lyrics, setLyrics] = useState('');
  const [voiceType, setVoiceType] = useState('nkosazana');
  const [voiceStyle, setVoiceStyle] = useState('melodic');
  const [genre, setGenre] = useState('Amapiano');
  const [language, setLanguage] = useState('zulu');
  const [bpm, setBpm] = useState([112]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<GeneratedTrack | null>(null);


  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate vocals');
      return;
    }

    if (!lyrics.trim()) {
      toast.error('Please enter lyrics');
      return;
    }

    setIsGenerating(true);
    setGeneratedTrack(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-song-elevenlabs-singing', {
        body: {
          lyrics,
          voiceType,
          voiceStyle,
          genre,
          language,
          bpm: bpm[0],
        },
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedTrack({
          vocalUrl: data.vocalUrl,
          instrumentalUrl: data.instrumentalUrl,
          metadata: data.metadata,
        });
        toast.success('Vocals generated successfully!');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate vocals');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <MusicToolsSidebar activeTool="vocal-generator" />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Mic className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">ElevenLabs Vocal Generator</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Generate AI vocals with instrumental backing using ElevenLabs TTS
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Voice Settings
                      </CardTitle>
                      <CardDescription>
                        Configure voice and music parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Voice Style</Label>
                        <Select value={voiceType} onValueChange={setVoiceType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Amapiano voice style" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px]">
                            {AMAPIANO_VOICE_CATEGORIES.map((cat) => (
                              <SelectGroup key={cat.category}>
                                <SelectLabel className="text-primary font-semibold">{cat.category}</SelectLabel>
                                {cat.voices.map((v) => (
                                  <SelectItem key={v.value} value={v.value}>
                                    <div className="flex flex-col">
                                      <span>{v.label}</span>
                                      <span className="text-xs text-muted-foreground">{v.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
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
                            {SA_GENRES.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {SA_LANGUAGES.map((l) => (
                              <SelectItem key={l.value} value={l.value}>
                                <div className="flex flex-col">
                                  <span>{l.label}</span>
                                  <span className="text-xs text-muted-foreground">{l.description}</span>
                                </div>
                              </SelectItem>
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
                      <CardTitle>Lyrics</CardTitle>
                      <CardDescription>
                        Enter lyrics to be converted to vocals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Enter your lyrics here...&#10;&#10;[Verse 1]&#10;Your lyrics...&#10;&#10;[Chorus]&#10;Your chorus..."
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="min-h-[200px] resize-none"
                        maxLength={2500}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {lyrics.length}/2500 characters
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !lyrics.trim()}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Vocals...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Generate Vocals
                    </>
                  )}
                </Button>

                {generatedTrack && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-primary" />
                        Generated Audio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="mb-2 block">Vocals</Label>
                        <audio controls className="w-full" src={generatedTrack.vocalUrl}>
                          Your browser does not support the audio element.
                        </audio>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <a href={generatedTrack.vocalUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download Vocals
                          </a>
                        </Button>
                      </div>

                      {generatedTrack.instrumentalUrl && (
                        <div>
                          <Label className="mb-2 block">Instrumental Backing</Label>
                          <audio controls className="w-full" src={generatedTrack.instrumentalUrl}>
                            Your browser does not support the audio element.
                          </audio>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <a href={generatedTrack.instrumentalUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" /> Download Instrumental
                            </a>
                          </Button>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p>Voice: {generatedTrack.metadata.voiceType}</p>
                        <p>Genre: {generatedTrack.metadata.genre}</p>
                        <p>Duration: ~{generatedTrack.metadata.duration}s</p>
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

export default ElevenLabsSinging;
