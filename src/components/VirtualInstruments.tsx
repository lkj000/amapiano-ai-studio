import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Piano, Drum, Music, Volume2, Settings2, Play, Square,
  Radio, Sliders, Zap, AudioWaveform, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useAmapianoPlayback } from '@/hooks/useAmapianoPlayback';
import type { AmapianoInstrumentType } from '@/lib/audio/amapianoSynths';

interface VirtualInstrumentsProps {
  selectedInstrument?: string;
  onInstrumentChange?: (instrument: string) => void;
  onNotePlay?: (note: string, velocity: number) => void;
  className?: string;
}

interface InstrumentPreset {
  id: string;
  name: string;
  category: string;
  iconName: string;
  description: string;
  parameters: Record<string, number>;
}

// Signature Amapiano Virtual Instruments
const AMAPIANO_INSTRUMENTS: InstrumentPreset[] = [
  {
    id: 'signature-log-drum',
    name: 'Signature Log Drum',
    category: 'Percussion',
    iconName: 'Drum',
    description: 'Authentic amapiano log drum synthesizer with pitch glide and decay control',
    parameters: {
      pitch: 60,
      decay: 0.7,
      resonance: 0.4,
      glide: 0.3,
      saturation: 0.2,
      lowCut: 0.1
    }
  },
  {
    id: 'amapiano-piano',
    name: 'Amapiano Piano',
    category: 'Keys',
    iconName: 'Piano',
    description: 'Classic M1-style piano with amapiano character and warmth',
    parameters: {
      brightness: 0.6,
      warmth: 0.8,
      attack: 0.1,
      release: 0.9,
      chorus: 0.3,
      reverb: 0.4
    }
  },
  {
    id: 'percussion-sampler',
    name: 'Percussion Sampler',
    category: 'Percussion',
    iconName: 'AudioWaveform',
    description: 'Multi-layered sampler optimized for amapiano percussion elements',
    parameters: {
      layerMix: 0.5,
      swing: 0.15,
      humanize: 0.2,
      velocity: 0.8,
      pan: 0.0,
      filter: 0.7
    }
  },
  {
    id: 'deep-bass',
    name: 'Deep Bass Synth',
    category: 'Bass',
    iconName: 'Radio',
    description: 'Sub-bass synthesizer designed for amapiano basslines',
    parameters: {
      subLevel: 0.8,
      midLevel: 0.4,
      attack: 0.05,
      decay: 0.6,
      sustain: 0.7,
      glide: 0.2
    }
  }
];

const AMAPIANO_EFFECTS = [
  {
    id: 'shaker-groove-engine',
    name: 'Shaker Groove Engine',
    description: 'Generates authentic African shaker patterns with polyrhythmic complexity',
    parameters: { density: 0.6, swing: 0.2, velocity: 0.7, highCut: 0.8 }
  },
  {
    id: '3d-imager',
    name: '3D Spatial Imager',
    description: 'Creates wide, immersive stereo field for amapiano elements',
    parameters: { width: 0.7, depth: 0.5, focus: 0.6, mono_bass: 0.9 }
  },
  {
    id: 'log-drum-saturator',
    name: 'Log Drum Saturator',
    description: 'Specialized saturation and harmonic enhancement for log drums',
    parameters: { drive: 0.4, harmonics: 0.3, presence: 0.6, warmth: 0.8 }
  },
  {
    id: 'amapiano-compressor',
    name: 'Amapiano Compressor',
    description: 'Genre-specific compression with pump and groove characteristics',
    parameters: { threshold: 0.3, ratio: 0.6, attack: 0.2, release: 0.7 }
  }
];

export const VirtualInstruments: React.FC<VirtualInstrumentsProps> = ({
  selectedInstrument = 'signature-log-drum',
  onInstrumentChange,
  onNotePlay,
  className
}) => {
  const [activeInstrument, setActiveInstrument] = useState(selectedInstrument);
  const [instrumentParams, setInstrumentParams] = useState<Record<string, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('instruments');

  // Use Amapiano-specific playback system instead of basic Web Audio
  const amapianoPlayback = useAmapianoPlayback();

  useEffect(() => {
    const instrument = AMAPIANO_INSTRUMENTS.find(i => i.id === activeInstrument);
    if (instrument) {
      setInstrumentParams(instrument.parameters);
    }
  }, [activeInstrument]);

  const handleInstrumentSelect = (instrumentId: string) => {
    setActiveInstrument(instrumentId);
    onInstrumentChange?.(instrumentId);
    
    const instrument = AMAPIANO_INSTRUMENTS.find(i => i.id === instrumentId);
    toast.success(`Selected: ${instrument?.name}`);
  };

  const handleParameterChange = (paramName: string, value: number[]) => {
    setInstrumentParams(prev => ({
      ...prev,
      [paramName]: value[0]
    }));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Piano': return Piano;
      case 'Drum': return Drum;
      case 'AudioWaveform': return AudioWaveform;
      case 'Radio': return Radio;
      default: return Music;
    }
  };

  // Map instrument IDs to Amapiano synth types
  const getInstrumentType = (instrumentId: string): AmapianoInstrumentType => {
    switch (instrumentId) {
      case 'signature-log-drum': return 'log_drum';
      case 'amapiano-piano': return 'piano';
      case 'deep-bass': return 'bass';
      case 'percussion-sampler': return 'percussion';
      default: return 'default';
    }
  };

  const playTestNote = async () => {
    const instrument = AMAPIANO_INSTRUMENTS.find(i => i.id === activeInstrument);
    if (!instrument) return;

    try {
      setIsPlaying(true);
      const instrumentType = getInstrumentType(activeInstrument);

      // Play with authentic Amapiano synths
      switch (instrumentType) {
        case 'log_drum':
          // Play log drum sequence
          await amapianoPlayback.playLogDrumSequence(
            [60, 64, 67, 72],
            115,
            () => setIsPlaying(false)
          );
          break;
        case 'piano':
          // Play piano chord progression
          await amapianoPlayback.playChordProgression(
            ['Am', 'F', 'C', 'G'],
            'C',
            115,
            () => setIsPlaying(false)
          );
          break;
        case 'bass':
          // Play bass notes
          await amapianoPlayback.playNote(36, 'bass', 0.9, 0.8);
          setTimeout(async () => {
            await amapianoPlayback.playNote(43, 'bass', 0.8, 0.6);
          }, 400);
          setTimeout(() => setIsPlaying(false), 1500);
          break;
        default:
          // Generic note
          await amapianoPlayback.playNote(60, instrumentType, 0.8, 0.5);
          setTimeout(() => setIsPlaying(false), 600);
      }

      onNotePlay?.('C4', 0.8);
    } catch (error) {
      console.error('Audio playback error:', error);
      toast.error('Failed to play test sound');
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    amapianoPlayback.stop();
    setIsPlaying(false);
  };

  const currentInstrument = AMAPIANO_INSTRUMENTS.find(i => i.id === activeInstrument);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Virtual Instruments & Effects
          <Badge variant="outline" className="ml-auto bg-gradient-to-r from-blue-500/20 to-purple-500/20">
            Amapiano Specialized
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instruments">
              <Piano className="w-4 h-4 mr-2" />
              Instruments
            </TabsTrigger>
            <TabsTrigger value="effects">
              <Sliders className="w-4 h-4 mr-2" />
              Effects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instruments" className="space-y-4">
            {/* Instrument Selection */}
            <div className="grid grid-cols-1 gap-2">
              {AMAPIANO_INSTRUMENTS.map((instrument) => {
                const IconComponent = getIcon(instrument.iconName);
                return (
                  <Button
                    key={instrument.id}
                    variant={activeInstrument === instrument.id ? "default" : "outline"}
                    className="justify-start h-auto p-3"
                    onClick={() => handleInstrumentSelect(instrument.id)}
                  >
                    <IconComponent className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{instrument.name}</div>
                      <div className="text-xs text-muted-foreground">{instrument.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Current Instrument Controls */}
            {currentInstrument && (
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {React.createElement(getIcon(currentInstrument.iconName), { className: "w-5 h-5 text-primary" })}
                      {currentInstrument.name}
                    </CardTitle>
                    <Button onClick={playTestNote} disabled={isPlaying}>
                      {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{currentInstrument.description}</p>
                  
                  {/* Parameter Controls */}
                  <div className="space-y-3">
                    {Object.entries(instrumentParams).map(([paramName, value]) => (
                      <div key={paramName} className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium capitalize">
                            {paramName.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(value * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[value]}
                          onValueChange={(newValue) => handleParameterChange(paramName, newValue)}
                          max={1}
                          step={0.01}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="effects" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {AMAPIANO_EFFECTS.map((effect) => (
                <Card key={effect.id} className="bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          {effect.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{effect.description}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {Object.entries(effect.parameters).map(([param, value]) => (
                        <div key={param} className="space-y-1">
                          <label className="text-xs font-medium capitalize">
                            {param.replace('_', ' ')}
                          </label>
                          <Slider
                            value={[value]}
                            max={1}
                            step={0.01}
                            disabled
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};