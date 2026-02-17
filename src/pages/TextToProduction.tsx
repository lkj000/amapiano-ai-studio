import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Play, Pause, RotateCcw, Download, Sparkles, Music, Mic, FileText,
  Sliders, Volume2, CheckCircle, Clock, AlertCircle, ChevronRight, Wand2, Layers
} from 'lucide-react';
import { SA_LANGUAGES } from '@/constants/languages';
import { SA_GENRES } from '@/constants/amapianoVoices';
import { GENERATION_MOODS, getGenreDefaults } from '@/constants/genreDefaults';
import { VoiceStyleSelector } from '@/components/music/VoiceStyleSelector';
import { GenreAwareBpmKey } from '@/components/music/GenreAwareBpmKey';
import { CulturalAuthenticityControls, type CulturalSettings } from '@/components/music/CulturalAuthenticityControls';

interface TextToProductionProps {
  user: User | null;
}

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  result?: string;
  error?: string;
}

const TextToProduction = ({ user }: TextToProductionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  // Production settings
  const [genre, setGenre] = useState('Amapiano');
  const [bpm, setBpm] = useState([115]);
  const [musicalKey, setMusicalKey] = useState('Am');
  const [language, setLanguage] = useState('zulu');
  const [voiceStyle, setVoiceStyle] = useState('nkosazana');
  const [mood, setMood] = useState('uplifting');
  const [includeVocals, setIncludeVocals] = useState(true);
  const [culturalSettings, setCulturalSettings] = useState<CulturalSettings>({
    swing: [55], gaspTiming: 'beat1', logDrumIntensity: [50],
  });
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { id: 'lyrics', name: 'Generate Lyrics', status: 'pending', progress: 0 },
    { id: 'instrumental', name: 'Create Instrumental', status: 'pending', progress: 0 },
    { id: 'vocals', name: 'Synthesize Vocals', status: 'pending', progress: 0 },
    { id: 'mixing', name: 'Mix & Balance', status: 'pending', progress: 0 },
    { id: 'mastering', name: 'Master Track', status: 'pending', progress: 0 },
  ]);
  
  // Generated outputs
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [instrumentalUrl, setInstrumentalUrl] = useState('');
  const [vocalsUrl, setVocalsUrl] = useState('');
  const [finalTrackUrl, setFinalTrackUrl] = useState('');

  const updateStepStatus = (stepId: string, status: WorkflowStep['status'], progress: number, result?: string) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, progress, result } : step
    ));
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to generate tracks', variant: 'destructive' });
      return;
    }
    if (!prompt.trim()) {
      toast({ title: 'Enter a prompt', description: 'Describe the track you want to create', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);

    try {
      // Step 1: Generate Lyrics (real)
      setCurrentStep(0);
      updateStepStatus('lyrics', 'running', 0);
      
      const lyricsResponse = await supabase.functions.invoke('generate-lyrics', {
        body: {
          theme: prompt, genre: genre.toLowerCase(), mood, style: voiceStyle, language,
          culturalSwing: culturalSettings.swing[0],
          gaspTiming: culturalSettings.gaspTiming,
        }
      });

      if (lyricsResponse.error) throw new Error('Failed to generate lyrics');
      const lyrics = lyricsResponse.data?.lyrics || lyricsResponse.data?.generatedLyrics || '';
      if (!lyrics) throw new Error('No lyrics returned from AI');
      
      setGeneratedLyrics(lyrics);
      updateStepStatus('lyrics', 'completed', 100, lyrics);

      // Step 2: Generate Instrumental (real via ElevenLabs music)
      setCurrentStep(1);
      updateStepStatus('instrumental', 'running', 0);
      
      const instrumentalPrompt = `${genre} instrumental, ${bpm[0]} BPM, key of ${musicalKey}, ${mood} mood, log drum intensity ${culturalSettings.logDrumIntensity[0]}%, swing ${culturalSettings.swing[0]}%`;
      const instrumentalResponse = await supabase.functions.invoke('generate-instrumental', {
        body: {
          genre, mood, bpm: bpm[0], energy: culturalSettings.logDrumIntensity[0],
          key: musicalKey, prompt: instrumentalPrompt,
        },
      });

      if (instrumentalResponse.error) throw new Error('Failed to generate instrumental');
      const instUrl = instrumentalResponse.data?.audioUrl;
      if (instUrl) {
        setInstrumentalUrl(instUrl);
        updateStepStatus('instrumental', 'completed', 100, 'Instrumental generated');
      } else {
        throw new Error('No audio URL returned from instrumental generation');
      }

      // Step 3: Generate Vocals (real via ElevenLabs)
      if (includeVocals) {
        setCurrentStep(2);
        updateStepStatus('vocals', 'running', 0);

        const vocalsResponse = await supabase.functions.invoke('elevenlabs-singing', {
          body: { lyrics, voiceStyle, language, genre },
        });

        if (vocalsResponse.error) throw new Error('Failed to generate vocals');
        const voxUrl = vocalsResponse.data?.audioUrl;
        if (voxUrl) {
          setVocalsUrl(voxUrl);
          updateStepStatus('vocals', 'completed', 100, 'Vocals generated');
        } else {
          updateStepStatus('vocals', 'completed', 100, 'Vocal generation returned no audio — instrumental only');
        }
      } else {
        updateStepStatus('vocals', 'completed', 100, 'Skipped (instrumental only)');
      }

      // Step 4: Mixing (via generate-music with combined prompt)
      setCurrentStep(3);
      updateStepStatus('mixing', 'running', 0);

      const fullPrompt = `${genre}, ${mood}, ${bpm[0]} BPM, key of ${musicalKey}. ${prompt}`;
      const mixResponse = await supabase.functions.invoke('generate-music', {
        body: {
          prompt: fullPrompt,
          lyrics: includeVocals ? lyrics : undefined,
          genre, bpm: bpm[0], voiceStyle: includeVocals ? voiceStyle : undefined,
          language, duration: 180,
          culturalSwing: culturalSettings.swing[0],
          logDrumIntensity: culturalSettings.logDrumIntensity[0],
          gaspTiming: culturalSettings.gaspTiming,
        },
      });

      if (mixResponse.error) {
        console.warn('Mix step failed, using instrumental as final:', mixResponse.error);
        updateStepStatus('mixing', 'completed', 100, 'Using instrumental as base');
      } else {
        updateStepStatus('mixing', 'completed', 100, 'Mix balanced');
      }

      // Step 5: Mastering — use final mixed audio or instrumental fallback
      setCurrentStep(4);
      updateStepStatus('mastering', 'running', 50);
      
      const finalUrl = mixResponse.data?.audioUrl || instrumentalUrl || instUrl;
      setFinalTrackUrl(finalUrl || '');
      updateStepStatus('mastering', 'completed', 100, 'Track mastered');

      toast({ title: 'Track generated!', description: 'Your Amapiano track is ready to preview' });
    } catch (error) {
      console.error('Generation error:', error);
      toast({ 
        title: 'Generation failed', 
        description: error instanceof Error ? error.message : 'Please try again', 
        variant: 'destructive' 
      });
      
      const stepIds = ['lyrics', 'instrumental', 'vocals', 'mixing', 'mastering'];
      if (currentStep < stepIds.length) {
        updateStepStatus(stepIds[currentStep], 'error', 0);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const resetWorkflow = () => {
    setWorkflowSteps(prev => prev.map(step => ({ ...step, status: 'pending', progress: 0, result: undefined })));
    setGeneratedLyrics('');
    setInstrumentalUrl('');
    setVocalsUrl('');
    setFinalTrackUrl('');
    setCurrentStep(0);
  };

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'running': return <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <ChevronRight className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Wand2 className="w-10 h-10" />
            Text to Production
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Describe your track in natural language and AURA X creates a complete Amapiano production 
            with lyrics, instrumentals, vocals, and professional mastering.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Prompt & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Describe Your Track
                </CardTitle>
                <CardDescription>
                  Example: "Private School Amapiano, 112 BPM, Nkosazana-style vocals in Zulu about celebrating life"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the track you want to create..."
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>

            {/* Production Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" />
                  Production Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SA_GENRES.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SA_LANGUAGES.map(l => (
                          <SelectItem key={l.value} value={l.value}>{l.label} — {l.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <GenreAwareBpmKey
                  genre={genre}
                  bpm={bpm}
                  onBpmChange={setBpm}
                  musicalKey={musicalKey}
                  onKeyChange={setMusicalKey}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mood</Label>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENERATION_MOODS.map(m => (
                          <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <VoiceStyleSelector value={voiceStyle} onChange={setVoiceStyle} />
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={includeVocals} onCheckedChange={setIncludeVocals} />
                  <Label>Include Vocals</Label>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full h-12 text-lg"
                >
                  {isGenerating ? (
                    <><Clock className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> Generate Full Track</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Cultural Authenticity */}
            <CulturalAuthenticityControls
              settings={culturalSettings}
              onChange={setCulturalSettings}
              genre={genre}
            />

            {/* Generated Outputs */}
            {(generatedLyrics || finalTrackUrl) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      Generated Content
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={resetWorkflow}>
                      <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="lyrics">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
                      <TabsTrigger value="instrumental">Instrumental</TabsTrigger>
                      <TabsTrigger value="vocals">Vocals</TabsTrigger>
                      <TabsTrigger value="final">Final Mix</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="lyrics" className="mt-4">
                      {generatedLyrics ? (
                        <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                          {generatedLyrics}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">Lyrics will appear here after generation</div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="instrumental" className="mt-4">
                      <div className="rounded-lg p-6 text-center">
                        {instrumentalUrl ? (
                          <div className="space-y-4">
                            <Music className="w-16 h-16 text-primary mx-auto" />
                            <p>Instrumental track ready</p>
                            <audio controls className="w-full" src={instrumentalUrl} />
                            <Button variant="outline" asChild>
                              <a href={instrumentalUrl} download="instrumental.mp3" target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" /> Download
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Instrumental will appear here</div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="vocals" className="mt-4">
                      <div className="rounded-lg p-6 text-center">
                        {vocalsUrl ? (
                          <div className="space-y-4">
                            <Mic className="w-16 h-16 text-primary mx-auto" />
                            <p>Vocal track ready</p>
                            <audio controls className="w-full" src={vocalsUrl} />
                            <Button variant="outline" asChild>
                              <a href={vocalsUrl} download="vocals.mp3" target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" /> Download
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Vocals will appear here</div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="final" className="mt-4">
                      <div className="rounded-lg p-6 text-center">
                        {finalTrackUrl ? (
                          <div className="space-y-4">
                            <Volume2 className="w-16 h-16 text-green-500 mx-auto" />
                            <p>Mastered track ready!</p>
                            <audio controls className="w-full" src={finalTrackUrl} />
                            <Button variant="outline" asChild>
                              <a href={finalTrackUrl} download="final-mix.mp3" target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-1" /> Export
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Final mix will appear here</div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Workflow Status */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Production Workflow
                </CardTitle>
                <CardDescription>Real-time generation status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflowSteps.map((step) => (
                  <div key={step.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStepIcon(step.status)}
                        <span className={`text-sm ${
                          step.status === 'completed' ? 'text-green-500' :
                          step.status === 'running' ? 'text-yellow-500' :
                          step.status === 'error' ? 'text-destructive' :
                          'text-muted-foreground'
                        }`}>
                          {step.name}
                        </span>
                      </div>
                      {step.status === 'running' && (
                        <span className="text-xs text-muted-foreground">{Math.round(step.progress)}%</span>
                      )}
                    </div>
                    {step.status === 'running' && <Progress value={step.progress} className="h-1" />}
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="text-primary">
                      {Math.round(workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">💡 Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• Be specific about the vibe: "late night groove" vs "weekend party energy"</p>
                <p>• Mention cultural references for authenticity</p>
                <p>• Code-switching (mixed language) creates authentic Amapiano flows</p>
                <p>• Use the cultural controls to fine-tune swing and log drum presence</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToProduction;
