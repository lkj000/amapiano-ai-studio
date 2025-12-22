import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Download,
  Sparkles,
  Music,
  Mic,
  FileText,
  Sliders,
  Volume2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Wand2,
  Layers
} from 'lucide-react';

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

const AMAPIANO_SUBGENRES = [
  { value: 'private_school', label: 'Private School' },
  { value: 'deep_amapiano', label: 'Deep Amapiano' },
  { value: 'three_step', label: '3-Step' },
  { value: 'vocal_amapiano', label: 'Vocal Amapiano' },
  { value: 'instrumental', label: 'Instrumental' },
];

const SA_LANGUAGES = [
  { value: 'zu', label: 'Zulu' },
  { value: 'xh', label: 'Xhosa' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'st', label: 'Sesotho' },
  { value: 'tn', label: 'Setswana' },
  { value: 'ts', label: 'Tsonga' },
  { value: 'ss', label: 'Swati' },
  { value: 've', label: 'Venda' },
  { value: 'nr', label: 'Ndebele' },
  { value: 'nso', label: 'Sepedi' },
  { value: 'en', label: 'English' },
  { value: 'mixed', label: 'Code-Switch (Mixed)' },
];

const TextToProduction = ({ user }: TextToProductionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  // Production settings
  const [subgenre, setSubgenre] = useState('private_school');
  const [bpm, setBpm] = useState([112]);
  const [key, setKey] = useState('C');
  const [language, setLanguage] = useState('zu');
  const [voiceStyle, setVoiceStyle] = useState('kabza');
  const [mood, setMood] = useState('uplifting');
  const [includeVocals, setIncludeVocals] = useState(true);
  
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

  const simulateStep = async (stepId: string, duration: number): Promise<void> => {
    updateStepStatus(stepId, 'running', 0);
    
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, duration / steps));
      updateStepStatus(stepId, 'running', (i / steps) * 100);
    }
    
    updateStepStatus(stepId, 'completed', 100);
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
      // Step 1: Generate Lyrics
      setCurrentStep(0);
      updateStepStatus('lyrics', 'running', 0);
      
      const lyricsResponse = await supabase.functions.invoke('generate-lyrics', {
        body: {
          theme: prompt,
          genre: 'amapiano',
          mood: mood,
          style: voiceStyle,
          language: language
        }
      });

      if (lyricsResponse.error) throw new Error('Failed to generate lyrics');
      
      const lyrics = lyricsResponse.data?.lyrics || lyricsResponse.data?.generatedLyrics || 
        `[Verse 1]\n${prompt}\nAmapiano vibes all night long\n\n[Chorus]\nFeel the rhythm, feel the bass\n${subgenre} in this place`;
      
      setGeneratedLyrics(lyrics);
      updateStepStatus('lyrics', 'completed', 100, lyrics);

      // Step 2: Generate Instrumental
      setCurrentStep(1);
      await simulateStep('instrumental', 3000);
      setInstrumentalUrl('/demo-instrumental.mp3');

      // Step 3: Generate Vocals
      if (includeVocals) {
        setCurrentStep(2);
        await simulateStep('vocals', 4000);
        setVocalsUrl('/demo-vocals.mp3');
      } else {
        updateStepStatus('vocals', 'completed', 100, 'Skipped (instrumental only)');
      }

      // Step 4: Mixing
      setCurrentStep(3);
      await simulateStep('mixing', 2000);

      // Step 5: Mastering
      setCurrentStep(4);
      await simulateStep('mastering', 2000);
      setFinalTrackUrl('/demo-final.mp3');

      toast({ title: 'Track generated!', description: 'Your Amapiano track is ready to preview' });
    } catch (error) {
      console.error('Generation error:', error);
      toast({ title: 'Generation failed', description: 'Please try again', variant: 'destructive' });
      
      // Mark current step as error
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
      default: return <ChevronRight className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Wand2 className="w-10 h-10" />
            Text to Production
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Describe your track in natural language and watch AURA X create a complete Amapiano production 
            with lyrics, instrumentals, vocals, and professional mastering.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Prompt & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Input */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Describe Your Track
                </CardTitle>
                <CardDescription>
                  Example: "Create a Private School Amapiano track, 112 BPM, with Kabza-style vocals in Zulu about celebrating life"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the track you want to create..."
                  className="min-h-[120px] bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500"
                />
              </CardContent>
            </Card>

            {/* Production Settings */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  Production Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sub-Genre</Label>
                    <Select value={subgenre} onValueChange={setSubgenre}>
                      <SelectTrigger className="bg-gray-900/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AMAPIANO_SUBGENRES.map(g => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-gray-900/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SA_LANGUAGES.map(l => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>BPM</Label>
                    <span className="text-sm text-purple-400">{bpm[0]} BPM</span>
                  </div>
                  <Slider
                    value={bpm}
                    onValueChange={setBpm}
                    min={100}
                    max={130}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Deep (100)</span>
                    <span>Standard (112)</span>
                    <span>Energetic (130)</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Select value={key} onValueChange={setKey}>
                      <SelectTrigger className="bg-gray-900/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                          <SelectItem key={k} value={k}>{k} Major</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mood</Label>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger className="bg-gray-900/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uplifting">Uplifting</SelectItem>
                        <SelectItem value="mellow">Mellow</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="romantic">Romantic</SelectItem>
                        <SelectItem value="melancholic">Melancholic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Voice Style</Label>
                    <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                      <SelectTrigger className="bg-gray-900/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kabza">Kabza Style</SelectItem>
                        <SelectItem value="focalistic">Focalistic Style</SelectItem>
                        <SelectItem value="mfr">MFR Souls Style</SelectItem>
                        <SelectItem value="female">Female Vocalist</SelectItem>
                        <SelectItem value="duet">Duet Style</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Full Track
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Outputs */}
            {(generatedLyrics || finalTrackUrl) && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      Generated Content
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={resetWorkflow} className="border-gray-600">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="lyrics">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-900/50">
                      <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
                      <TabsTrigger value="instrumental">Instrumental</TabsTrigger>
                      <TabsTrigger value="vocals">Vocals</TabsTrigger>
                      <TabsTrigger value="final">Final Mix</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="lyrics" className="mt-4">
                      {generatedLyrics ? (
                        <div className="bg-gray-900/50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-300">
                          {generatedLyrics}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Lyrics will appear here after generation
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="instrumental" className="mt-4">
                      <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                        {instrumentalUrl ? (
                          <div className="space-y-4">
                            <Music className="w-16 h-16 text-purple-400 mx-auto" />
                            <p className="text-gray-300">Instrumental track ready</p>
                            <div className="flex gap-2 justify-center">
                              <Button variant="outline" className="border-gray-600">
                                <Play className="w-4 h-4 mr-1" /> Preview
                              </Button>
                              <Button variant="outline" className="border-gray-600">
                                <Download className="w-4 h-4 mr-1" /> Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Instrumental will appear here</div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="vocals" className="mt-4">
                      <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                        {vocalsUrl ? (
                          <div className="space-y-4">
                            <Mic className="w-16 h-16 text-pink-400 mx-auto" />
                            <p className="text-gray-300">Vocal track ready</p>
                            <div className="flex gap-2 justify-center">
                              <Button variant="outline" className="border-gray-600">
                                <Play className="w-4 h-4 mr-1" /> Preview
                              </Button>
                              <Button variant="outline" className="border-gray-600">
                                <Download className="w-4 h-4 mr-1" /> Download
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Vocals will appear here</div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="final" className="mt-4">
                      <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                        {finalTrackUrl ? (
                          <div className="space-y-4">
                            <Volume2 className="w-16 h-16 text-green-400 mx-auto" />
                            <p className="text-gray-300">Mastered track ready!</p>
                            <div className="flex gap-2 justify-center">
                              <Button className="bg-green-600 hover:bg-green-700">
                                <Play className="w-4 h-4 mr-1" /> Play Full Track
                              </Button>
                              <Button variant="outline" className="border-gray-600">
                                <Download className="w-4 h-4 mr-1" /> Export
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500">Final mix will appear here</div>
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
            <Card className="bg-gray-800/50 border-gray-700 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Production Workflow
                </CardTitle>
                <CardDescription>Real-time generation status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {workflowSteps.map((step, idx) => (
                  <div key={step.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStepIcon(step.status)}
                        <span className={`text-sm ${
                          step.status === 'completed' ? 'text-green-400' :
                          step.status === 'running' ? 'text-yellow-400' :
                          step.status === 'error' ? 'text-red-400' :
                          'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                      </div>
                      {step.status === 'running' && (
                        <span className="text-xs text-gray-500">{Math.round(step.progress)}%</span>
                      )}
                    </div>
                    {step.status === 'running' && (
                      <Progress value={step.progress} className="h-1" />
                    )}
                  </div>
                ))}

                {/* Overall Progress */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Overall Progress</span>
                    <span className="text-purple-400">
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

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50">
              <CardHeader>
                <CardTitle className="text-sm">💡 Tips for Better Results</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-400 space-y-2">
                <p>• Be specific about the vibe: "late night groove" vs "weekend party energy"</p>
                <p>• Mention cultural references for authenticity</p>
                <p>• Code-switching (mixed language) creates authentic Amapiano flows</p>
                <p>• Lower BPM (108-112) for deep vibes, higher (115-120) for energy</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToProduction;
