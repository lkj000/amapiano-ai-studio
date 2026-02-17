import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Music2, Loader2, Download, Sparkles } from 'lucide-react';
import VocalRemover from '@/components/music/VocalRemover';
import SoundEffectGenerator from '@/components/music/SoundEffectGenerator';
import { MusicToolsSidebar } from '@/components/music/MusicToolsSidebar';
import { SA_GENRES } from '@/constants/amapianoVoices';
import { GENERATION_MOODS, getGenreDefaults } from '@/constants/genreDefaults';
import { GenreAwareBpmKey } from '@/components/music/GenreAwareBpmKey';
import { CulturalAuthenticityControls, type CulturalSettings } from '@/components/music/CulturalAuthenticityControls';

interface InstrumentalGeneratorProps {
  user: User | null;
}

interface GeneratedTrack {
  audioUrl: string;
  metadata: {
    genre: string;
    bpm: number;
    mood: string;
    energy: number;
    source: string;
    hasVocals: boolean;
    duration: number;
  };
}

const InstrumentalGenerator: React.FC<InstrumentalGeneratorProps> = ({ user }) => {
  const [genre, setGenre] = useState('Amapiano');
  const [mood, setMood] = useState('energetic');
  const [bpm, setBpm] = useState([115]);
  const [musicalKey, setMusicalKey] = useState('Am');
  const [energy, setEnergy] = useState([70]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<GeneratedTrack | null>(null);
  const [culturalSettings, setCulturalSettings] = useState<CulturalSettings>({
    swing: [55], gaspTiming: 'beat1', logDrumIntensity: [50],
  });

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate instrumentals');
      return;
    }

    setIsGenerating(true);
    setGeneratedTrack(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-instrumental', {
        body: {
          genre,
          mood,
          bpm: bpm[0],
          energy: energy[0],
          key: musicalKey,
          culturalSwing: culturalSettings.swing[0],
          logDrumIntensity: culturalSettings.logDrumIntensity[0],
          gaspTiming: culturalSettings.gaspTiming,
        },
      });

      if (error) throw error;

      if (data.success && data.audioUrl) {
        setGeneratedTrack({
          audioUrl: data.audioUrl,
          metadata: data.metadata,
        });
        toast.success('Instrumental generated successfully!');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate instrumental');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <MusicToolsSidebar activeTool="instrumental" />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Music2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">Instrumental Generator</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Generate pure instrumental tracks using AI
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Track Configuration
                    </CardTitle>
                    <CardDescription>Configure your instrumental parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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

                    <GenreAwareBpmKey
                      genre={genre}
                      bpm={bpm}
                      onBpmChange={setBpm}
                      musicalKey={musicalKey}
                      onKeyChange={setMusicalKey}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Mood</Label>
                        <Select value={mood} onValueChange={setMood}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mood" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENERATION_MOODS.map((m) => (
                              <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Energy: {energy[0]}%</Label>
                        <Slider
                          value={energy}
                          onValueChange={setEnergy}
                          min={0} max={100} step={5}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          {energy[0] > 70 ? 'High energy, driving' : energy[0] > 40 ? 'Medium energy, groovy' : 'Chill, laid-back'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cultural Authenticity */}
                <CulturalAuthenticityControls
                  settings={culturalSettings}
                  onChange={setCulturalSettings}
                  genre={genre}
                />

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating... (this may take 1-2 minutes)</>
                  ) : (
                    <><Music2 className="mr-2 h-5 w-5" /> Generate Instrumental</>
                  )}
                </Button>

                {generatedTrack && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music2 className="h-5 w-5 text-primary" />
                        Generated Instrumental
                      </CardTitle>
                      <CardDescription>
                        {generatedTrack.metadata.genre} • {generatedTrack.metadata.bpm} BPM • {generatedTrack.metadata.energy}% Energy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <audio controls className="w-full" src={generatedTrack.audioUrl}>
                        Your browser does not support the audio element.
                      </audio>
                      <div className="flex gap-4 justify-center">
                        <Button variant="outline" asChild>
                          <a href={generatedTrack.audioUrl} download="instrumental.mp3" target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" /> Download
                          </a>
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Source: {generatedTrack.metadata.source}</p>
                        <p>Duration: ~{generatedTrack.metadata.duration}s</p>
                        <p>Type: Pure Instrumental (No Vocals)</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
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

export default InstrumentalGenerator;
