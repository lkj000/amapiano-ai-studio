import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileCode, Zap, BookOpen, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PluginCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  framework: 'juce' | 'web-audio' | 'custom';
  wasmEnabled: boolean;
}

export const PluginCodeEditor: React.FC<PluginCodeEditorProps> = ({
  value,
  onChange,
  framework,
  wasmEnabled
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getFrameworkDocs = () => {
    switch (framework) {
      case 'juce':
        return `// JUCE Plugin Template
// This code will be compiled to C++ WASM for professional performance

class ${value.match(/class\s+(\w+)/)?.[1] || 'MyPlugin'} : public juce::AudioProcessor {
public:
    void prepareToPlay(double sampleRate, int samplesPerBlock) override {
        // Initialize audio processing
    }

    void processBlock(juce::AudioBuffer<float>& buffer, 
                     juce::MidiBuffer& midiMessages) override {
        // Process audio here
        for (int channel = 0; channel < buffer.getNumChannels(); ++channel) {
            float* channelData = buffer.getWritePointer(channel);
            for (int sample = 0; sample < buffer.getNumSamples(); ++sample) {
                // Apply DSP processing
                channelData[sample] *= gain;
            }
        }
    }

    void releaseResources() override {
        // Clean up
    }

private:
    float gain = 0.5f;
};`;

      case 'web-audio':
        return `// Web Audio API Plugin Template
// Enhanced with C++ WASM for performance

class AudioPlugin {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.inputNode = audioContext.createGain();
        this.outputNode = audioContext.createGain();
        
        // Connect nodes
        this.inputNode.connect(this.outputNode);
    }

    process(inputBuffer, outputBuffer) {
        // Process audio with WASM acceleration
        if (window.wasmEngine) {
            return window.wasmEngine.processBuffer(inputBuffer, outputBuffer);
        }
        
        // Fallback to JavaScript
        for (let i = 0; i < inputBuffer.length; i++) {
            outputBuffer[i] = inputBuffer[i] * this.gain;
        }
    }

    setParameter(name, value) {
        this[name] = value;
    }
}`;

      default:
        return `// Custom Plugin Template
// Write your plugin code here`;
    }
  };

  const getSnippets = () => {
    if (framework === 'juce') {
      return [
        {
          name: 'ADSR Envelope',
          code: `juce::ADSR envelope;
juce::ADSR::Parameters params;
params.attack = 0.01f;
params.decay = 0.1f;
params.sustain = 0.7f;
params.release = 0.5f;
envelope.setParameters(params);`
        },
        {
          name: 'Biquad Filter',
          code: `juce::IIRFilter filter;
filter.setCoefficients(
    juce::IIRCoefficients::makeLowPass(
        sampleRate, 
        cutoffFrequency, 
        resonance
    )
);`
        },
        {
          name: 'FFT Analysis',
          code: `juce::dsp::FFT fft(fftOrder);
juce::dsp::WindowingFunction<float> window(fftSize, 
    juce::dsp::WindowingFunction<float>::hann);
window.multiplyWithWindowingTable(fftData, fftSize);
fft.performFrequencyOnlyForwardTransform(fftData);`
        }
      ];
    }
    
    return [
      {
        name: 'Gain Control',
        code: `this.gainNode = audioContext.createGain();
this.gainNode.gain.value = 0.5;`
      },
      {
        name: 'Filter',
        code: `this.filter = audioContext.createBiquadFilter();
this.filter.type = 'lowpass';
this.filter.frequency.value = 1000;`
      },
      {
        name: 'Oscillator',
        code: `this.osc = audioContext.createOscillator();
this.osc.type = 'sine';
this.osc.frequency.value = 440;`
      }
    ];
  };

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                {framework.toUpperCase()} Code Editor
                {wasmEnabled && (
                  <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Zap className="h-3 w-3 mr-1" />
                    WASM Enabled
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={getFrameworkDocs()}
              className="flex-1 font-mono text-sm resize-none"
              style={{ minHeight: '500px' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Snippets & Docs */}
      <div className="w-80 space-y-4">
        {/* Code Snippets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Code Snippets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {getSnippets().map((snippet, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      onChange(value + '\n\n' + snippet.code);
                      toast.success(`Added: ${snippet.name}`);
                    }}
                  >
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm mb-2">{snippet.name}</h4>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        <code>{snippet.code}</code>
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Reference</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {framework === 'juce' && (
              <>
                <div>
                  <strong>Audio Processing:</strong>
                  <div className="text-muted-foreground">processBlock(buffer, midi)</div>
                </div>
                <div>
                  <strong>Sample Rate:</strong>
                  <div className="text-muted-foreground">getSampleRate()</div>
                </div>
                <div>
                  <strong>Parameters:</strong>
                  <div className="text-muted-foreground">getParameters()</div>
                </div>
              </>
            )}
            
            {wasmEnabled && (
              <div className="mt-4 pt-4 border-t">
                <Badge variant="outline" className="w-full justify-start">
                  <Zap className="h-3 w-3 mr-1" />
                  WASM Features
                </Badge>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <div>• 10-100x faster processing</div>
                  <div>• &lt;3ms latency</div>
                  <div>• Multi-threaded audio</div>
                  <div>• Professional DSP</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
