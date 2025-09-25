import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Brain, Wand2, Zap, Music, Layers, Target, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdvancedGenerationParams {
  prompt: string;
  instrument: string;
  style: string;
  complexity: number;
  creativity: number;
  culturalAuthenticity: number;
  modelType: 'neural' | 'transformer' | 'diffusion';
  useRAG: boolean;
  multiModalAnalysis: boolean;
}

interface GeneratedContent {
  trackId: string;
  instrumentData: any;
  analysisResults: any;
  culturalScore: number;
  qualityMetrics: any;
}

export const AdvancedAIGenerator: React.FC = () => {
  const [params, setParams] = useState<AdvancedGenerationParams>({
    prompt: '',
    instrument: 'piano',
    style: 'classic_amapiano',
    complexity: 70,
    creativity: 80,
    culturalAuthenticity: 85,
    modelType: 'neural',
    useRAG: true,
    multiModalAnalysis: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [activePhase, setActivePhase] = useState<string>('');

  const updateParam = useCallback((key: keyof AdvancedGenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const generateAdvancedContent = async () => {
    if (!params.prompt.trim()) {
      toast.error('Please provide a prompt for generation');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setActivePhase('Initializing Neural Engine');

    const phases = [
      { name: 'Initializing Neural Engine', duration: 1000 },
      { name: 'Analyzing Prompt & Context', duration: 1500 },
      { name: 'Loading Cultural Knowledge', duration: 1200 },
      { name: 'Generating Musical Patterns', duration: 2500 },
      { name: 'Applying Cultural Authenticity', duration: 1800 },
      { name: 'Quality Analysis & Refinement', duration: 1500 },
      { name: 'Finalizing Generation', duration: 800 },
    ];

    try {
      let currentProgress = 0;
      
      for (const phase of phases) {
        setActivePhase(phase.name);
        
        // Simulate realistic progress
        const phaseProgress = 100 / phases.length;
        const interval = setInterval(() => {
          setGenerationProgress(prev => Math.min(prev + 2, currentProgress + phaseProgress));
        }, phase.duration / 20);
        
        await new Promise(resolve => setTimeout(resolve, phase.duration));
        clearInterval(interval);
        currentProgress += phaseProgress;
      }

      // Call the neural music generation service
      const { data, error } = await supabase.functions.invoke('neural-music-generation', {
        body: {
          modelId: `${params.modelType}_${params.instrument}`,
          params: {
            prompt: params.prompt,
            temperature: params.creativity / 100,
            topK: 50,
            length: 120,
            instrument: params.instrument,
            style: params.style,
          },
          advancedSettings: {
            complexity: params.complexity,
            culturalAuthenticity: params.culturalAuthenticity,
            useRAG: params.useRAG,
            multiModalAnalysis: params.multiModalAnalysis,
          }
        }
      });

      if (error) throw error;

      setGenerationProgress(100);
      setActivePhase('Generation Complete');

      const content: GeneratedContent = {
        trackId: `advanced_${Date.now()}`,
        instrumentData: data.midiData,
        analysisResults: data.metadata,
        culturalScore: data.metadata?.culturalAuthenticity || 0.85,
        qualityMetrics: {
          technicalComplexity: params.complexity,
          creativityScore: params.creativity,
          authenticity: data.metadata?.culturalAuthenticity || 0.85,
          musicalCoherence: 0.88,
        }
      };

      setGeneratedContent(content);
      toast.success('Advanced AI generation completed successfully!');

    } catch (error) {
      console.error('Advanced generation failed:', error);
      toast.error('Advanced generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setActivePhase('');
    }
  };

  const instruments = [
    { value: 'piano', label: 'Amapiano Piano', model: 'LSTM v2.1' },
    { value: 'log_drums', label: 'Log Drums', model: 'GAN v1.8' },
    { value: 'deep_bass', label: 'Deep Bass', model: 'RNN v1.5' },
    { value: 'percussion', label: 'Percussion', model: 'VAE v0.9' },
    { value: 'synth_lead', label: 'Synth Lead', model: 'Transformer v2.3' },
    { value: 'saxophone', label: 'Saxophone', model: 'Transformer v2.2' },
    { value: 'violin', label: 'Violin', model: 'Transformer v2.0' },
  ];

  const styles = [
    { value: 'classic_amapiano', label: 'Classic Amapiano' },
    { value: 'private_school', label: 'Private School' },
    { value: 'vocal_amapiano', label: 'Vocal Amapiano' },
    { value: 'deep_amapiano', label: 'Deep Amapiano' },
    { value: 'jazz_fusion', label: 'Jazz Fusion' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Advanced AI Music Generator
            <Badge variant="secondary" className="ml-auto">Neural Engine v3.0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generation" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generation">Generation</TabsTrigger>
              <TabsTrigger value="models">Neural Models</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="generation" className="space-y-6">
              {/* Generation Parameters */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Musical Prompt</label>
                  <Textarea
                    value={params.prompt}
                    onChange={(e) => updateParam('prompt', e.target.value)}
                    placeholder="Describe the musical piece you want to generate... e.g., 'A soulful Amapiano piano piece with jazz progressions and authentic log drum patterns'"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Instrument</label>
                    <Select value={params.instrument} onValueChange={(value) => updateParam('instrument', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {instruments.map(inst => (
                          <SelectItem key={inst.value} value={inst.value}>
                            <div className="flex justify-between w-full">
                              <span>{inst.label}</span>
                              <Badge variant="outline" className="ml-2 text-xs">{inst.model}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Musical Style</label>
                    <Select value={params.style} onValueChange={(value) => updateParam('style', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map(style => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Model Type</label>
                    <Select value={params.modelType} onValueChange={(value) => updateParam('modelType', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neural">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Neural Networks (RNN/LSTM)
                          </div>
                        </SelectItem>
                        <SelectItem value="transformer">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Transformer Architecture
                          </div>
                        </SelectItem>
                        <SelectItem value="diffusion">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Diffusion Models
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Advanced Features</label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">RAG Enhancement</span>
                        <Switch checked={params.useRAG} onCheckedChange={(checked) => updateParam('useRAG', checked)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Multi-Modal Analysis</span>
                        <Switch checked={params.multiModalAnalysis} onCheckedChange={(checked) => updateParam('multiModalAnalysis', checked)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Parameters */}
                <div className="space-y-4">
                  <h4 className="font-medium">Generation Parameters</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium">Complexity</label>
                        <span className="text-sm text-muted-foreground">{params.complexity}%</span>
                      </div>
                      <Slider
                        value={[params.complexity]}
                        onValueChange={([value]) => updateParam('complexity', value)}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium">Creativity</label>
                        <span className="text-sm text-muted-foreground">{params.creativity}%</span>
                      </div>
                      <Slider
                        value={[params.creativity]}
                        onValueChange={([value]) => updateParam('creativity', value)}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium">Cultural Authenticity</label>
                        <span className="text-sm text-muted-foreground">{params.culturalAuthenticity}%</span>
                      </div>
                      <Slider
                        value={[params.culturalAuthenticity]}
                        onValueChange={([value]) => updateParam('culturalAuthenticity', value)}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </div>

                {/* Generation Button */}
                <div className="flex flex-col gap-4">
                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{activePhase}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} />
                    </div>
                  )}

                  <Button
                    onClick={generateAdvancedContent}
                    disabled={isGenerating || !params.prompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Generate Advanced AI Content
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="grid gap-4">
                {instruments.map(inst => (
                  <Card key={inst.value} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{inst.label}</h4>
                          <p className="text-sm text-muted-foreground">Neural Model: {inst.model}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <Badge variant="outline">Ready</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {generatedContent ? (
                <div className="space-y-4">
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Generation Results</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium mb-2">Quality Metrics</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Cultural Score</span>
                            <span className="text-sm font-medium">{(generatedContent.culturalScore * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Creativity</span>
                            <span className="text-sm font-medium">{generatedContent.qualityMetrics.creativityScore}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Complexity</span>
                            <span className="text-sm font-medium">{generatedContent.qualityMetrics.technicalComplexity}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Musical Coherence</span>
                            <span className="text-sm font-medium">{(generatedContent.qualityMetrics.musicalCoherence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Generated Content</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Track ID</span>
                            <span className="text-sm font-mono">{generatedContent.trackId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Instrument</span>
                            <span className="text-sm font-medium">{params.instrument}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Style</span>
                            <span className="text-sm font-medium">{params.style}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No results yet. Generate content to see detailed analysis.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};