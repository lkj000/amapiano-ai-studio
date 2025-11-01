import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { PluginProject } from './PluginDevelopmentIDE';

interface AIPluginGeneratorProps {
  onGenerate: (plugin: Partial<PluginProject>) => void;
  framework: string;
}

export const AIPluginGenerator: React.FC<AIPluginGeneratorProps> = ({
  onGenerate,
  framework
}) => {
  const [description, setDescription] = useState('');
  const [pluginType, setPluginType] = useState<'instrument' | 'effect' | 'utility'>('effect');
  const [isGenerating, setIsGenerating] = useState(false);

  const examples = [
    "Create a vintage analog-style distortion with drive, tone, and mix controls",
    "Build a granular synthesizer with grain size, density, and pitch controls",
    "Make a spectral delay with frequency-dependent feedback and filtering",
    "Design a bass enhancer with sub-harmonic generation and saturation",
    "Create a rhythmic gate effect with tempo sync and pattern selection",
    "Build a vocoder with carrier oscillator and formant controls",
    "Make a tape saturation emulator with wow, flutter, and noise",
    "Design a wavetable synth with morphing, filtering, and modulation"
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe what you want to create');
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast.loading('🤖 AI is generating your plugin...');

    try {
      const { data, error } = await supabase.functions.invoke('ai-plugin-generator', {
        body: {
          description,
          type: pluginType,
          framework
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Rate limit reached. Please wait a moment.');
        } else if (error.message.includes('402')) {
          toast.error('AI credits exhausted. Please add more credits.');
        } else {
          throw error;
        }
        return;
      }

      toast.success('🎉 Plugin generated successfully!', { id: loadingToast });
      onGenerate({
        name: data.name,
        type: pluginType,
        framework: data.framework,
        code: data.code,
        metadata: data.metadata,
        parameters: []
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate plugin. Please try again.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Plugin Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Plugin Type</Label>
            <Select value={pluginType} onValueChange={(v: any) => setPluginType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instrument">Instrument / Synthesizer</SelectItem>
                <SelectItem value="effect">Audio Effect</SelectItem>
                <SelectItem value="utility">Utility / Tool</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Describe Your Plugin</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Create a vintage analog filter with resonance, cutoff, and drive controls..."
              className="min-h-[120px]"
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Plugin...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Plugin
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4" />
            Example Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {examples.map((example, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => setDescription(example)}
                disabled={isGenerating}
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
