import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Music, Volume2, Sliders, Sparkles, Waves, Zap, Filter, Radio, Disc, Mic2, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { PluginProject } from './PluginDevelopmentIDE';

interface ExpandedTemplateLibraryProps {
  onSelectTemplate: (template: Partial<PluginProject>) => void;
}

export const ExpandedTemplateLibrary: React.FC<ExpandedTemplateLibraryProps> = ({
  onSelectTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Massive template library - unlimited instruments and effects
  const templates: Array<Partial<PluginProject> & { icon: any }> = [
    // === INSTRUMENTS ===
    {
      name: 'Amapiano Log Drum',
      type: 'instrument',
      framework: 'juce',
      icon: Music,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Authentic South African log drum with pitch glide and knock',
        category: 'Drum Machines',
        tags: ['amapiano', 'drums', 'south-african', 'percussion']
      },
      code: `// Amapiano Log Drum
class AmapianoLogDrum : public juce::AudioProcessor {
public:
    AmapianoLogDrum() {
        addParameter(new juce::AudioParameterFloat("pitch", "Pitch", juce::NormalisableRange<float>(24.0f, 96.0f), 80.0f));
        addParameter(new juce::AudioParameterFloat("glide", "Glide", juce::NormalisableRange<float>(0.0f, 1000.0f), 150.0f));
        addParameter(new juce::AudioParameterFloat("knock", "Knock", juce::NormalisableRange<float>(0.0f, 1.0f), 0.3f));
        addParameter(new juce::AudioParameterFloat("decay", "Decay", juce::NormalisableRange<float>(50.0f, 2000.0f), 800.0f));
    }
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override {
        // 808-style log drum synthesis
    }
};`
    },
    {
      name: 'Piano One',
      type: 'instrument',
      framework: 'juce',
      icon: Music,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Realistic acoustic piano with velocity layers and pedal',
        category: 'Keyboards',
        tags: ['piano', 'acoustic', 'realistic', 'sampled']
      },
      code: `// Piano Sampler
class PianoOne : public juce::AudioProcessor {
public:
    PianoOne() {
        addParameter(new juce::AudioParameterFloat("attack", "Attack", juce::NormalisableRange<float>(0.0f, 1000.0f), 10.0f));
        addParameter(new juce::AudioParameterFloat("release", "Release", juce::NormalisableRange<float>(0.0f, 5000.0f), 1000.0f));
        addParameter(new juce::AudioParameterFloat("brightness", "Brightness", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
    }
};`
    },
    {
      name: 'Bass Station',
      type: 'instrument',
      framework: 'juce',
      icon: Waves,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Powerful bass synthesizer with sub oscillator and filter',
        category: 'Bass Synths',
        tags: ['bass', 'synthesizer', 'sub', 'electronic']
      },
      code: `// Bass Synthesizer
class BassStation : public juce::AudioProcessor {
public:
    BassStation() {
        addParameter(new juce::AudioParameterFloat("cutoff", "Cutoff", juce::NormalisableRange<float>(20.0f, 5000.0f), 800.0f));
        addParameter(new juce::AudioParameterFloat("resonance", "Resonance", juce::NormalisableRange<float>(0.0f, 1.0f), 0.3f));
        addParameter(new juce::AudioParameterFloat("sub", "Sub Osc", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("drive", "Drive", juce::NormalisableRange<float>(0.0f, 1.0f), 0.2f));
    }
};`
    },

    // === SYNTHS ===
    {
      name: 'Wavetable Pro',
      type: 'instrument',
      framework: 'juce',
      icon: Sparkles,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Modern wavetable synth with morphing and multiple oscillators',
        category: 'Synthesizers',
        tags: ['wavetable', 'modern', 'digital', 'complex']
      },
      code: `// Wavetable Synthesizer
class WavetablePro : public juce::AudioProcessor {
public:
    WavetablePro() {
        addParameter(new juce::AudioParameterFloat("position", "WT Position", juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));
        addParameter(new juce::AudioParameterFloat("morph", "Morph", juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));
        addParameter(new juce::AudioParameterFloat("detune", "Detune", juce::NormalisableRange<float>(-50.0f, 50.0f), 0.0f));
    }
};`
    },
    {
      name: 'FM Master',
      type: 'instrument',
      framework: 'juce',
      icon: Radio,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: '6-operator FM synthesizer with feedback and algorithms',
        category: 'Synthesizers',
        tags: ['fm', 'digital', 'complex', 'bell-like']
      },
      code: `// FM Synthesizer
class FMMaster : public juce::AudioProcessor {
public:
    FMMaster() {
        addParameter(new juce::AudioParameterFloat("ratio1", "Op1 Ratio", juce::NormalisableRange<float>(0.5f, 16.0f), 1.0f));
        addParameter(new juce::AudioParameterFloat("ratio2", "Op2 Ratio", juce::NormalisableRange<float>(0.5f, 16.0f), 2.0f));
        addParameter(new juce::AudioParameterFloat("modAmount", "Mod Amount", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("feedback", "Feedback", juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));
    }
};`
    },

    // === EFFECTS ===
    {
      name: 'Vintage Reverb',
      type: 'effect',
      framework: 'juce',
      icon: Volume2,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Lush algorithmic reverb with multiple room models',
        category: 'Reverb',
        tags: ['reverb', 'space', 'vintage', 'ambience']
      },
      code: `// Vintage Reverb
class VintageReverb : public juce::AudioProcessor {
public:
    VintageReverb() {
        addParameter(new juce::AudioParameterFloat("size", "Room Size", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("damping", "Damping", juce::NormalisableRange<float>(0.0f, 1.0f), 0.3f));
        addParameter(new juce::AudioParameterFloat("width", "Width", juce::NormalisableRange<float>(0.0f, 1.0f), 1.0f));
        addParameter(new juce::AudioParameterFloat("mix", "Wet/Dry", juce::NormalisableRange<float>(0.0f, 1.0f), 0.3f));
    }
};`
    },
    {
      name: 'Analog Delay',
      type: 'effect',
      framework: 'juce',
      icon: Disc,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Warm tape-style delay with wow, flutter, and saturation',
        category: 'Delay',
        tags: ['delay', 'analog', 'tape', 'vintage']
      },
      code: `// Analog Delay
class AnalogDelay : public juce::AudioProcessor {
public:
    AnalogDelay() {
        addParameter(new juce::AudioParameterFloat("time", "Time", juce::NormalisableRange<float>(1.0f, 2000.0f), 500.0f));
        addParameter(new juce::AudioParameterFloat("feedback", "Feedback", juce::NormalisableRange<float>(0.0f, 1.0f), 0.4f));
        addParameter(new juce::AudioParameterFloat("wow", "Wow/Flutter", juce::NormalisableRange<float>(0.0f, 1.0f), 0.1f));
        addParameter(new juce::AudioParameterFloat("saturation", "Saturation", juce::NormalisableRange<float>(0.0f, 1.0f), 0.2f));
    }
};`
    },
    {
      name: 'Dynamic Compressor',
      type: 'effect',
      framework: 'juce',
      icon: Sliders,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Professional dynamics processor with sidechain',
        category: 'Dynamics',
        tags: ['compressor', 'dynamics', 'mastering', 'mixing']
      },
      code: `// Dynamic Compressor
class DynamicCompressor : public juce::AudioProcessor {
public:
    DynamicCompressor() {
        addParameter(new juce::AudioParameterFloat("threshold", "Threshold", juce::NormalisableRange<float>(-60.0f, 0.0f), -12.0f));
        addParameter(new juce::AudioParameterFloat("ratio", "Ratio", juce::NormalisableRange<float>(1.0f, 20.0f), 4.0f));
        addParameter(new juce::AudioParameterFloat("attack", "Attack", juce::NormalisableRange<float>(0.1f, 100.0f), 5.0f));
        addParameter(new juce::AudioParameterFloat("release", "Release", juce::NormalisableRange<float>(10.0f, 1000.0f), 50.0f));
    }
};`
    },
    {
      name: 'Phaser Pro',
      type: 'effect',
      framework: 'juce',
      icon: Waves,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Classic phaser effect with multiple stages and feedback',
        category: 'Modulation',
        tags: ['phaser', 'modulation', 'vintage', 'sweep']
      },
      code: `// Phaser Effect
class PhaserPro : public juce::AudioProcessor {
public:
    PhaserPro() {
        addParameter(new juce::AudioParameterFloat("rate", "Rate", juce::NormalisableRange<float>(0.1f, 10.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("depth", "Depth", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("feedback", "Feedback", juce::NormalisableRange<float>(0.0f, 0.95f), 0.3f));
        addParameter(new juce::AudioParameterInt("stages", "Stages", 2, 12, 4));
    }
};`
    },
    {
      name: 'Chorus Ensemble',
      type: 'effect',
      framework: 'juce',
      icon: Waves,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Rich stereo chorus with multiple voices',
        category: 'Modulation',
        tags: ['chorus', 'stereo', 'ensemble', 'thickening']
      },
      code: `// Chorus Effect
class ChorusEnsemble : public juce::AudioProcessor {
public:
    ChorusEnsemble() {
        addParameter(new juce::AudioParameterFloat("rate", "Rate", juce::NormalisableRange<float>(0.1f, 5.0f), 1.0f));
        addParameter(new juce::AudioParameterFloat("depth", "Depth", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("voices", "Voices", juce::NormalisableRange<float>(1.0f, 8.0f), 3.0f));
    }
};`
    },
    {
      name: 'Distortion Beast',
      type: 'effect',
      framework: 'juce',
      icon: Zap,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Aggressive distortion with multi-stage saturation',
        category: 'Distortion',
        tags: ['distortion', 'overdrive', 'saturation', 'aggressive']
      },
      code: `// Distortion Effect
class DistortionBeast : public juce::AudioProcessor {
public:
    DistortionBeast() {
        addParameter(new juce::AudioParameterFloat("drive", "Drive", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("tone", "Tone", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        addParameter(new juce::AudioParameterFloat("output", "Output", juce::NormalisableRange<float>(0.0f, 2.0f), 0.7f));
    }
};`
    },
    {
      name: 'EQ Eight',
      type: 'effect',
      framework: 'juce',
      icon: Sliders,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: '8-band parametric EQ with spectrum analyzer',
        category: 'EQ',
        tags: ['eq', 'equalizer', 'tone-shaping', 'mixing']
      },
      code: `// 8-Band Parametric EQ
class EQEight : public juce::AudioProcessor {
public:
    EQEight() {
        for (int i = 0; i < 8; ++i) {
            addParameter(new juce::AudioParameterFloat("freq" + std::to_string(i), "Freq " + std::to_string(i), juce::NormalisableRange<float>(20.0f, 20000.0f), 1000.0f));
            addParameter(new juce::AudioParameterFloat("gain" + std::to_string(i), "Gain " + std::to_string(i), juce::NormalisableRange<float>(-24.0f, 24.0f), 0.0f));
        }
    }
};`
    },
    {
      name: 'Spectral Gate',
      type: 'effect',
      framework: 'juce',
      icon: Filter,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'FFT-based frequency gate with creative sound design',
        category: 'Utility',
        tags: ['spectral', 'gate', 'creative', 'experimental']
      },
      code: `// Spectral Gate
class SpectralGate : public juce::AudioProcessor {
public:
    SpectralGate() {
        addParameter(new juce::AudioParameterFloat("threshold", "Threshold", juce::NormalisableRange<float>(-60.0f, 0.0f), -20.0f));
        addParameter(new juce::AudioParameterFloat("range", "Range", juce::NormalisableRange<float>(0.0f, -80.0f), -40.0f));
        addParameter(new juce::AudioParameterFloat("attack", "Attack", juce::NormalisableRange<float>(0.0f, 100.0f), 5.0f));
    }
};`
    },
    {
      name: 'Vocoder Pro',
      type: 'effect',
      framework: 'juce',
      icon: Mic2,
      metadata: {
        author: 'AURA-X',
        version: '1.0.0',
        description: 'Multi-band vocoder with carrier synthesis',
        category: 'Voice',
        tags: ['vocoder', 'voice', 'robotic', 'synthesis']
      },
      code: `// Vocoder
class VocoderPro : public juce::AudioProcessor {
public:
    VocoderPro() {
        addParameter(new juce::AudioParameterInt("bands", "Bands", 8, 32, 16));
        addParameter(new juce::AudioParameterFloat("formant", "Formant", juce::NormalisableRange<float>(-12.0f, 12.0f), 0.0f));
        addParameter(new juce::AudioParameterFloat("mix", "Carrier Mix", juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
    }
};`
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' ||
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search unlimited templates..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'instrument', 'effect', 'utility'].map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template, index) => {
            const IconComponent = template.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  onSelectTemplate(template);
                  toast.success(`Loaded ${template.name}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.framework?.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.metadata?.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.metadata?.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button className="w-full" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
