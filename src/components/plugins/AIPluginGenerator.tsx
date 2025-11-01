import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = {
    all: 'All Types',
    synth: 'Synthesizers',
    sampler: 'Samplers & Drums',
    effect: 'Audio Effects',
    dynamics: 'Dynamics',
    modulation: 'Modulation',
    delay: 'Delay & Echo',
    reverb: 'Reverb & Space',
    distortion: 'Distortion & Saturation',
    filter: 'Filters & EQ',
    creative: 'Creative & Experimental',
    mastering: 'Mastering & Utility',
    vintage: 'Vintage & Analog',
    midi: 'MIDI Effects'
  };

  const examplesByCategory: Record<string, string[]> = {
    synth: [
      "Create a massive supersaw synth with unison, detune, and stereo spread",
      "Build an FM synthesizer with 6 operators and complex modulation matrix",
      "Design a granular synthesizer with grain size, density, and pitch controls",
      "Make a wavetable synth with morphing, filtering, and dual oscillators",
      "Create an analog-style monosynth with ladder filter and sub oscillator"
    ],
    sampler: [
      "Build an Amapiano log drum with pitch glide, knock, and swing",
      "Create a drum machine with 16 pads, velocity layers, and effects",
      "Design a sampler with multi-sample support, loop points, and filters",
      "Make an 808-style bass drum with pitch envelope and distortion",
      "Build a granular sampler with time-stretching and pitch-shifting"
    ],
    effect: [
      "Create an Amapianorizer - an all-in-one multi-effect designed to instantly give any sound the characteristic groove, pump, and low-end of Amapiano",
      "Create a multi-stage tube amplifier with preamp, power amp, and cab sim",
      "Build a convolution reverb with impulse response loading",
      "Design a spectral processor with frequency-domain effects",
      "Make a transient designer with attack and sustain controls"
    ],
    dynamics: [
      "Create a mastering-grade compressor with sidechain filtering",
      "Build a multi-band compressor with 4 frequency bands",
      "Design an expander/gate with lookahead and frequency-dependent triggering",
      "Make a vintage VCA compressor with auto makeup gain",
      "Build a parallel compressor with blend control"
    ],
    modulation: [
      "Create a 12-stage phaser with feedback and stereo modes",
      "Build a chorus ensemble with 8 voices and vintage character",
      "Design a flanger with through-zero and resonance controls",
      "Make a ring modulator with carrier oscillator and sideband filtering",
      "Create a tremolo with multiple waveforms and stereo panning"
    ],
    delay: [
      "Build a tape echo with wow, flutter, and tape saturation",
      "Create a ping-pong delay with tempo sync and filtering",
      "Design a granular delay with grain manipulation",
      "Make a reverse delay with pre-delay and modulation",
      "Build a multi-tap delay with 8 taps and individual feedback"
    ],
    reverb: [
      "Create a plate reverb emulation with pre-delay and damping",
      "Build an algorithmic reverb with early reflections and diffusion",
      "Design a shimmer reverb with pitch-shifting in the feedback path",
      "Make a spring reverb with tank resonance and splash",
      "Create a convolution reverb with room simulation"
    ],
    distortion: [
      "Build a tube saturation plugin with even and odd harmonics",
      "Create a bitcrusher with sample rate reduction and bit depth",
      "Design a waveshaper with customizable transfer function",
      "Make a fuzz pedal emulation with bias and tone controls",
      "Build a transformer saturation with high and low frequency emphasis"
    ],
    filter: [
      "Create a state-variable filter with morphing between types",
      "Build a 32-band graphic EQ with spectrum analyzer",
      "Design a parametric EQ with 8 bands and dynamic EQ mode",
      "Make a ladder filter emulation with resonance and drive",
      "Create a formant filter with vowel morphing"
    ],
    creative: [
      "Create an Amapianorizer - an all-in-one multi-effect designed to instantly give any sound the characteristic groove, pump, and low-end of Amapiano",
      "Build a vocoder with 32 bands and synthesis options",
      "Create a spectral freeze effect with harmonic locking",
      "Design a granular cloudifier with random grain distribution",
      "Make a frequency shifter with feedback and stereo modes",
      "Build a glitch effect with stutter, reverse, and pitch artifacts"
    ],
    mastering: [
      "Create a mastering limiter with true peak detection and oversampling",
      "Build a stereo widener with mid-side processing",
      "Design a loudness maximizer with multiband limiting",
      "Make a harmonic exciter with even/odd harmonic enhancement",
      "Create a de-esser with frequency-dependent compression"
    ],
    vintage: [
      "Build a 1176-style FET compressor with all-button mode",
      "Create an LA-2A optical compressor emulation",
      "Design a Pultec-style EQ with boost/cut interactions",
      "Make a vintage console channel strip with EQ and dynamics",
      "Build a tape machine emulation with bias, azimuth, and wow/flutter"
    ],
    midi: [
      "Create an arpeggiator with multiple patterns and swing",
      "Build a chord generator with scale detection and voicing",
      "Design a MIDI delay with note probability and humanization",
      "Make a note quantizer with scale constraints",
      "Create a MIDI randomizer with controlled chaos parameters"
    ]
  };

  const examples = selectedCategory === 'all' 
    ? Object.values(examplesByCategory).flat()
    : examplesByCategory[selectedCategory] || [];

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
            AI VST Plugin Generator - Unlimited Types
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Generate any VST plugin imaginable using AI. From synthesizers to effects, mastering tools to creative processors - describe it and AI will build it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Category Filter</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(categories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            {selectedCategory === 'all' ? 'Example Prompts (All Categories)' : `${categories[selectedCategory]} Examples`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {examples.map((example, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => setDescription(example)}
                  disabled={isGenerating}
                >
                  <span className="text-xs">{example}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
