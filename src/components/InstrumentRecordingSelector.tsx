import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Piano, Drum, Guitar, Music, Mic, Headphones, 
  Waves, Zap, Settings, Volume2, Activity 
} from 'lucide-react';

interface InstrumentConfig {
  id: string;
  name: string;
  category: 'core' | 'private_school' | 'synthesized' | 'advanced';
  icon: React.ReactNode;
  description: string;
  recordingType: 'audio' | 'midi' | 'both';
  neuralModel: string;
  sampleRate: number;
  channels: 'mono' | 'stereo';
}

// Complete Amapiano Instrument Configurations
const AMAPIANO_INSTRUMENT_CONFIGS: InstrumentConfig[] = [
  // Core Amapiano Foundation
  {
    id: 'piano',
    name: 'Piano (Rhodes/Electric)',
    category: 'core',
    icon: <Piano className="w-4 h-4" />,
    description: 'Jazzy, soulful melodies with repetitive riffs and progressive chord sequences',
    recordingType: 'both',
    neuralModel: 'lstm_piano',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'log_drums',
    name: 'Log Drums (Percussive Bass)',
    category: 'core',
    icon: <Drum className="w-4 h-4" />,
    description: 'Signature synthesized percussive bassline - hybrid kick/808/synth bass',
    recordingType: 'audio',
    neuralModel: 'gan_log_drums',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'deep_bass',
    name: 'Deep Bass (Sub-Heavy)',
    category: 'core',
    icon: <Waves className="w-4 h-4" />,
    description: 'Simple rhythmic bassline that anchors the track with depth',
    recordingType: 'both',
    neuralModel: 'rnn_deep_bass',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'percussion',
    name: 'Drums & Percussion',
    category: 'core',
    icon: <Activity className="w-4 h-4" />,
    description: 'Four-on-floor kicks with intricate syncopated percussion',
    recordingType: 'audio',
    neuralModel: 'vae_percussion',
    sampleRate: 44100,
    channels: 'stereo'
  },
  {
    id: 'shakers',
    name: 'Shakers (Rhythmic Foundation)',
    category: 'core',
    icon: <Volume2 className="w-4 h-4" />,
    description: 'Alternating strong/weak beat patterns establishing groove',
    recordingType: 'audio',
    neuralModel: 'lstm_shakers',
    sampleRate: 44100,
    channels: 'stereo'
  },
  {
    id: 'congas',
    name: 'Congas (African Rhythms)',
    category: 'core',
    icon: <Drum className="w-4 h-4" />,
    description: 'Traditional conga drums adding authentic African percussion patterns',
    recordingType: 'audio',
    neuralModel: 'lstm_congas',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'bongos',
    name: 'Bongos (High Percussion)',
    category: 'core',
    icon: <Activity className="w-4 h-4" />,
    description: 'High-pitched bongo patterns for rhythmic accents and fills',
    recordingType: 'audio',
    neuralModel: 'gan_bongos',
    sampleRate: 44100,
    channels: 'stereo'
  },
  
  // Private School Amapiano (Soulful & Live)
  {
    id: 'violin',
    name: 'Violin & String Sections',
    category: 'private_school',
    icon: <Music className="w-4 h-4" />,
    description: 'Progressive, cinematic atmosphere with emotional string arrangements',
    recordingType: 'audio',
    neuralModel: 'transformer_violin',
    sampleRate: 96000,
    channels: 'stereo'
  },
  {
    id: 'acoustic_guitar',
    name: 'Acoustic Guitar (Live)',
    category: 'private_school',
    icon: <Guitar className="w-4 h-4" />,
    description: 'Warm, human element with live fingerpicking and strumming',
    recordingType: 'audio',
    neuralModel: 'gan_acoustic_guitar',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'electric_guitar',
    name: 'Electric Guitar (Jazz Fusion)',
    category: 'private_school',
    icon: <Guitar className="w-4 h-4" />,
    description: 'Jazz-fusion guitar licks and smooth melodic lines',
    recordingType: 'audio',
    neuralModel: 'transformer_electric_guitar',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'flute',
    name: 'Flute (Melodic Expression)',
    category: 'private_school',
    icon: <Headphones className="w-4 h-4" />,
    description: 'Airy, expressive melodic layers with breath dynamics',
    recordingType: 'audio',
    neuralModel: 'lstm_flute',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'saxophone',
    name: 'Saxophone (Jazz Influence)',
    category: 'private_school',
    icon: <Music className="w-4 h-4" />,
    description: 'Jazz-influenced melodic phrases and rhythmic stabs',
    recordingType: 'audio',
    neuralModel: 'transformer_saxophone',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'trumpet',
    name: 'Trumpet (Brass Stabs)',
    category: 'private_school',
    icon: <Volume2 className="w-4 h-4" />,
    description: 'Brass punctuation and rhythmic emphasis',
    recordingType: 'audio',
    neuralModel: 'rnn_trumpet',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'trombone',
    name: 'Trombone (Deep Brass)',
    category: 'private_school',
    icon: <Volume2 className="w-4 h-4" />,
    description: 'Deep brass tones for harmonic support and melodic lines',
    recordingType: 'audio',
    neuralModel: 'rnn_trombone',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'vocals',
    name: 'Vocals (Soulful Singing)',
    category: 'private_school',
    icon: <Mic className="w-4 h-4" />,
    description: 'Soulful, melodic vocal performances and harmonies',
    recordingType: 'audio',
    neuralModel: 'vae_vocals',
    sampleRate: 96000,
    channels: 'stereo'
  },
  {
    id: 'cello',
    name: 'Cello (String Bass)',
    category: 'private_school',
    icon: <Music className="w-4 h-4" />,
    description: 'Deep string tones for harmonic foundation and melodic expression',
    recordingType: 'audio',
    neuralModel: 'transformer_cello',
    sampleRate: 96000,
    channels: 'stereo'
  },
  {
    id: 'viola',
    name: 'Viola (Mid Strings)',
    category: 'private_school',
    icon: <Music className="w-4 h-4" />,
    description: 'Rich mid-range string tones for harmonic filling',
    recordingType: 'audio',
    neuralModel: 'transformer_viola',
    sampleRate: 96000,
    channels: 'stereo'
  },
  {
    id: 'double_bass',
    name: 'Double Bass (Acoustic Bass)',
    category: 'private_school',
    icon: <Waves className="w-4 h-4" />,
    description: 'Deep acoustic bass lines with natural warmth',
    recordingType: 'audio',
    neuralModel: 'lstm_double_bass',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'clarinet',
    name: 'Clarinet (Woodwind)',
    category: 'private_school',
    icon: <Headphones className="w-4 h-4" />,
    description: 'Smooth woodwind melodies and harmonic support',
    recordingType: 'audio',
    neuralModel: 'lstm_clarinet',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'oboe',
    name: 'Oboe (Expressive Woodwind)',
    category: 'private_school',
    icon: <Headphones className="w-4 h-4" />,
    description: 'Expressive woodwind for emotional melodic lines',
    recordingType: 'audio',
    neuralModel: 'transformer_oboe',
    sampleRate: 48000,
    channels: 'mono'
  },
  
  // Synthesized & Production Elements
  {
    id: 'synth_lead',
    name: 'Synth Lead',
    category: 'synthesized',
    icon: <Zap className="w-4 h-4" />,
    description: 'Lead synthesizers for main melodies and hooks',
    recordingType: 'midi',
    neuralModel: 'transformer_synth_lead',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'pads',
    name: 'Atmospheric Pads',
    category: 'synthesized',
    icon: <Waves className="w-4 h-4" />,
    description: 'Rich atmospheric textures and immersive soundscapes',
    recordingType: 'midi',
    neuralModel: 'gan_pads',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'synth_bass',
    name: 'Synth Bass',
    category: 'synthesized',
    icon: <Waves className="w-4 h-4" />,
    description: 'Electronic bass synthesizers with various timbres',
    recordingType: 'midi',
    neuralModel: 'gan_synth_bass',
    sampleRate: 48000,
    channels: 'mono'
  },
  {
    id: 'arp_synth',
    name: 'Arp Synthesizer',
    category: 'synthesized',
    icon: <Zap className="w-4 h-4" />,
    description: 'Arpeggiated synth patterns for rhythmic melodies',
    recordingType: 'midi',
    neuralModel: 'lstm_arp_synth',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'fm_synth',
    name: 'FM Synthesizer',
    category: 'synthesized',
    icon: <Zap className="w-4 h-4" />,
    description: 'Frequency modulation synthesis for unique timbres',
    recordingType: 'midi',
    neuralModel: 'gan_fm_synth',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'whistles',
    name: 'Whistles & Bird Sounds',
    category: 'synthesized',
    icon: <Activity className="w-4 h-4" />,
    description: 'Attention-grabbing percussive elements and nature sounds',
    recordingType: 'audio',
    neuralModel: 'lstm_whistles',
    sampleRate: 44100,
    channels: 'stereo'
  },
  {
    id: 'vocal_chops',
    name: 'Vocal Chops & Samples',
    category: 'synthesized',
    icon: <Settings className="w-4 h-4" />,
    description: 'Processed vocal samples and melodic loops from other genres',
    recordingType: 'audio',
    neuralModel: 'vae_vocal_chops',
    sampleRate: 48000,
    channels: 'stereo'
  },
  
  // Advanced Production Tools
  {
    id: 'marimba',
    name: 'Marimba (Mallet Percussion)',
    category: 'advanced',
    icon: <Activity className="w-4 h-4" />,
    description: 'Warm wooden mallet percussion for melodic accents',
    recordingType: 'audio',
    neuralModel: 'transformer_marimba',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'vibraphone',
    name: 'Vibraphone (Metal Mallet)',
    category: 'advanced',
    icon: <Activity className="w-4 h-4" />,
    description: 'Metallic mallet percussion with shimmer and sustain',
    recordingType: 'audio',
    neuralModel: 'transformer_vibraphone',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'harp',
    name: 'Harp (Ethereal Strings)',
    category: 'advanced',
    icon: <Music className="w-4 h-4" />,
    description: 'Ethereal harp glissandos and arpeggios',
    recordingType: 'audio',
    neuralModel: 'lstm_harp',
    sampleRate: 96000,
    channels: 'stereo'
  },
  {
    id: 'djembe',
    name: 'Djembe (African Drum)',
    category: 'advanced',
    icon: <Drum className="w-4 h-4" />,
    description: 'Traditional West African djembe rhythms and patterns',
    recordingType: 'audio',
    neuralModel: 'gan_djembe',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'tabla',
    name: 'Tabla (Indian Percussion)',
    category: 'advanced',
    icon: <Drum className="w-4 h-4" />,
    description: 'Complex Indian tabla rhythms and techniques',
    recordingType: 'audio',
    neuralModel: 'transformer_tabla',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'kalimba',
    name: 'Kalimba (Thumb Piano)',
    category: 'advanced',
    icon: <Piano className="w-4 h-4" />,
    description: 'African thumb piano for delicate melodic textures',
    recordingType: 'audio',
    neuralModel: 'lstm_kalimba',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'mbira',
    name: 'Mbira (African Plucked)',
    category: 'advanced',
    icon: <Music className="w-4 h-4" />,
    description: 'Traditional Zimbabwean mbira patterns and tones',
    recordingType: 'audio',
    neuralModel: 'transformer_mbira',
    sampleRate: 48000,
    channels: 'stereo'
  },
  {
    id: 'harmonica',
    name: 'Harmonica (Blues Harp)',
    category: 'advanced',
    icon: <Headphones className="w-4 h-4" />,
    description: 'Expressive harmonica for blues and folk influences',
    recordingType: 'audio',
    neuralModel: 'lstm_harmonica',
    sampleRate: 48000,
    channels: 'mono'
  }
];

interface InstrumentRecordingSelectorProps {
  selectedInstrument: string | null;
  onInstrumentSelect: (instrumentId: string) => void;
  onRecordingStart: (instrumentConfig: InstrumentConfig) => void;
  isRecording: boolean;
}

export const InstrumentRecordingSelector = ({ 
  selectedInstrument, 
  onInstrumentSelect, 
  onRecordingStart,
  isRecording 
}: InstrumentRecordingSelectorProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('core');

  const getCategoryInstruments = (category: string) => {
    return AMAPIANO_INSTRUMENT_CONFIGS.filter(inst => inst.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Drum className="w-4 h-4" />;
      case 'private_school': return <Music className="w-4 h-4" />;
      case 'synthesized': return <Zap className="w-4 h-4" />;
      case 'advanced': return <Settings className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'core': return 'Essential Amapiano foundation instruments';
      case 'private_school': return 'Soulful live instruments for Private School style';
      case 'synthesized': return 'Electronic elements and processed sounds';
      case 'advanced': return 'Harmonic and arrangement tools';
      default: return '';
    }
  };

  const selectedConfig = AMAPIANO_INSTRUMENT_CONFIGS.find(
    config => config.id === selectedInstrument
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Amapiano Instrument Selector
          <Badge variant="outline" className="ml-auto">
            {AMAPIANO_INSTRUMENT_CONFIGS.length} Instruments Available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="core" className="flex items-center gap-1">
              {getCategoryIcon('core')} Core
            </TabsTrigger>
            <TabsTrigger value="private_school" className="flex items-center gap-1">
              {getCategoryIcon('private_school')} Private School
            </TabsTrigger>
            <TabsTrigger value="synthesized" className="flex items-center gap-1">
              {getCategoryIcon('synthesized')} Synthesized
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1">
              {getCategoryIcon('advanced')} Advanced
            </TabsTrigger>
          </TabsList>

          {['core', 'private_school', 'synthesized', 'advanced'].map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                {getCategoryDescription(category)}
              </div>
              
              <div className="grid gap-3">
                {getCategoryInstruments(category).map((instrument) => (
                  <Card 
                    key={instrument.id}
                    className={`cursor-pointer transition-colors ${
                      selectedInstrument === instrument.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-muted-foreground/30'
                    }`}
                    onClick={() => onInstrumentSelect(instrument.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {instrument.icon}
                          <div>
                            <h4 className="font-medium">{instrument.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {instrument.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="text-xs">
                            {instrument.recordingType}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {instrument.sampleRate / 1000}kHz
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {instrument.channels}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {selectedConfig && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  {selectedConfig.icon}
                  {selectedConfig.name}
                </h3>
                <Button 
                  onClick={() => onRecordingStart(selectedConfig)}
                  disabled={isRecording}
                  className="flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? 'Recording...' : 'Start Recording'}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Neural Model:</strong> {selectedConfig.neuralModel}</p>
                <p><strong>Recording Type:</strong> {selectedConfig.recordingType}</p>
                <p><strong>Audio Quality:</strong> {selectedConfig.sampleRate / 1000}kHz {selectedConfig.channels}</p>
                <p className="mt-2">{selectedConfig.description}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export { AMAPIANO_INSTRUMENT_CONFIGS };
export type { InstrumentConfig };