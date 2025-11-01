import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Search, Sparkles, Volume2, Sliders, Music, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { PluginProject } from './PluginDevelopmentIDE';

interface PluginTemplateLibraryProps {
  onSelectTemplate: (template: Partial<PluginProject>) => void;
}

export const PluginTemplateLibrary: React.FC<PluginTemplateLibraryProps> = ({
  onSelectTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates: Array<Partial<PluginProject> & { icon: any }> = [
    {
      name: 'Amapiano Log Drum',
      type: 'instrument',
      framework: 'juce',
      icon: Music,
      metadata: {
        author: 'AURA-X Team',
        version: '1.0.0',
        description: 'Authentic Amapiano log drum synthesizer with pitch glide and ADSR',
        category: 'Synthesizers',
        tags: ['amapiano', 'drums', 'log', 'south-african']
      },
      code: `// AURA Amapiano Log Drum - JUCE Plugin
class AmapianoLogDrum : public juce::AudioProcessor {
public:
    AmapianoLogDrum() {
        // Register parameters
        addParameter(pitchParam = new juce::AudioParameterFloat(
            "pitch", "Pitch",
            juce::NormalisableRange<float>(24.0f, 96.0f), 60.0f));
        
        addParameter(glideParam = new juce::AudioParameterFloat(
            "glide", "Glide Time",
            juce::NormalisableRange<float>(0.0f, 1000.0f), 100.0f));
        
        addParameter(knockParam = new juce::AudioParameterFloat(
            "knock", "Knock Mix",
            juce::NormalisableRange<float>(0.0f, 1.0f), 0.3f));
        
        addParameter(decayParam = new juce::AudioParameterFloat(
            "decay", "Decay Time",
            juce::NormalisableRange<float>(50.0f, 2000.0f), 800.0f));
        
        addParameter(subParam = new juce::AudioParameterFloat(
            "sub", "Sub Bass",
            juce::NormalisableRange<float>(0.0f, 1.0f), 0.5f));
        
        addParameter(swingParam = new juce::AudioParameterFloat(
            "swing", "Swing Amount",
            juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));
        
        addParameter(bassParam = new juce::AudioParameterFloat(
            "bass", "Bass Drive",
            juce::NormalisableRange<float>(0.0f, 1.0f), 0.4f));
        
        addParameter(shuffleParam = new juce::AudioParameterFloat(
            "shuffle", "Shuffle",
            juce::NormalisableRange<float>(0.0f, 1.0f), 0.0f));
    }

    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override {
        auto numSamples = buffer.getNumSamples();
        
        // Get parameter values
        float pitch = *pitchParam;
        float glideTime = *glideParam;
        float knockMix = *knockParam;
        float decay = *decayParam;
        float sub = *subParam;
        
        for (const auto metadata : midi) {
            auto message = metadata.getMessage();
            
            if (message.isNoteOn()) {
                float frequency = juce::MidiMessage::getMidiNoteInHertz(message.getNoteNumber());
                startNote(frequency);
            }
        }
        
        // Process audio with 808-style synthesis
        for (int channel = 0; channel < buffer.getNumChannels(); ++channel) {
            auto* channelData = buffer.getWritePointer(channel);
            
            for (int sample = 0; sample < numSamples; ++sample) {
                channelData[sample] = generateSample();
            }
        }
    }
    
private:
    juce::AudioParameterFloat* pitchParam;
    juce::AudioParameterFloat* glideParam;
    juce::AudioParameterFloat* knockParam;
    juce::AudioParameterFloat* decayParam;
    juce::AudioParameterFloat* subParam;
    juce::AudioParameterFloat* swingParam;
    juce::AudioParameterFloat* bassParam;
    juce::AudioParameterFloat* shuffleParam;
    
    float generateSample() {
        // 808 log drum synthesis
        return std::sin(phase) * envelope;
    }
    
    float phase = 0.0f;
    float envelope = 0.0f;
};`,
      parameters: [
        { id: 'pitch', name: 'Pitch', type: 'float', defaultValue: 60, min: 24, max: 96, unit: 'MIDI' },
        { id: 'glide', name: 'Glide Time', type: 'float', defaultValue: 100, min: 0, max: 1000, unit: 'ms' },
        { id: 'knock', name: 'Knock Mix', type: 'float', defaultValue: 0.3, min: 0, max: 1, unit: '%' }
      ]
    },
    {
      name: 'Vintage Reverb',
      type: 'effect',
      framework: 'juce',
      icon: Volume2,
      metadata: {
        author: 'AURA-X Team',
        version: '1.0.0',
        description: 'Professional algorithmic reverb with multiple room types',
        category: 'Reverb',
        tags: ['reverb', 'space', 'ambience', 'vintage']
      },
      code: `// Vintage Reverb - JUCE Plugin
class VintageReverb : public juce::AudioProcessor {
public:
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override {
        juce::dsp::AudioBlock<float> block(buffer);
        
        // Configure reverb
        juce::dsp::Reverb::Parameters params;
        params.roomSize = roomSize;
        params.damping = damping;
        params.wetLevel = wetLevel;
        params.dryLevel = 1.0f - wetLevel;
        
        reverb.setParameters(params);
        reverb.process(juce::dsp::ProcessContextReplacing<float>(block));
    }
    
private:
    juce::dsp::Reverb reverb;
    float roomSize = 0.5f;
    float damping = 0.3f;
    float wetLevel = 0.3f;
};`,
      parameters: [
        { id: 'roomSize', name: 'Room Size', type: 'float', defaultValue: 0.5, min: 0, max: 1 },
        { id: 'damping', name: 'Damping', type: 'float', defaultValue: 0.3, min: 0, max: 1 },
        { id: 'wetLevel', name: 'Wet/Dry', type: 'float', defaultValue: 0.3, min: 0, max: 1 }
      ]
    },
    {
      name: 'Dynamic Compressor',
      type: 'effect',
      framework: 'juce',
      icon: Sliders,
      metadata: {
        author: 'AURA-X Team',
        version: '1.0.0',
        description: 'Professional dynamics processor with auto-makeup gain',
        category: 'Dynamics',
        tags: ['compressor', 'dynamics', 'mastering']
      },
      code: `// Dynamic Compressor - JUCE Plugin
class DynamicCompressor : public juce::AudioProcessor {
public:
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer&) override {
        juce::dsp::AudioBlock<float> block(buffer);
        
        // Configure compressor
        compressor.setThreshold(threshold);
        compressor.setRatio(ratio);
        compressor.setAttack(attack);
        compressor.setRelease(release);
        
        compressor.process(juce::dsp::ProcessContextReplacing<float>(block));
    }
    
private:
    juce::dsp::Compressor<float> compressor;
    float threshold = -12.0f;
    float ratio = 4.0f;
    float attack = 5.0f;
    float release = 50.0f;
};`,
      parameters: [
        { id: 'threshold', name: 'Threshold', type: 'float', defaultValue: -12, min: -60, max: 0, unit: 'dB' },
        { id: 'ratio', name: 'Ratio', type: 'float', defaultValue: 4, min: 1, max: 20, unit: ':1' }
      ]
    },
    {
      name: 'Wavetable Synthesizer',
      type: 'instrument',
      framework: 'juce',
      icon: Sparkles,
      metadata: {
        author: 'AURA-X Team',
        version: '1.0.0',
        description: 'Modern wavetable synth with multiple oscillators',
        category: 'Synthesizers',
        tags: ['synth', 'wavetable', 'electronic']
      },
      code: `// Wavetable Synthesizer - JUCE Plugin
class WavetableSynth : public juce::AudioProcessor {
public:
    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midi) override {
        synthesiser.renderNextBlock(buffer, midi, 0, buffer.getNumSamples());
    }
    
private:
    juce::Synthesiser synthesiser;
    float wavetablePosition = 0.0f;
    float filterCutoff = 2000.0f;
};`,
      parameters: [
        { id: 'wavetable', name: 'Wavetable', type: 'int', defaultValue: 0, min: 0, max: 10 },
        { id: 'cutoff', name: 'Filter Cutoff', type: 'float', defaultValue: 2000, min: 20, max: 20000, unit: 'Hz' }
      ]
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
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
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

      {/* Templates Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template, index) => {
            const IconComponent = template.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelectTemplate(template)}
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

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Book className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
