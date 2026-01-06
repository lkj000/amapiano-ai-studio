/**
 * Enhanced Instrument Selector
 * Full-featured instrument selection with subgenre profiles and processing controls
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Piano, Drum, Guitar, Music, Mic,
  Waves, Zap, Volume2, Activity,
  Sparkles
} from 'lucide-react';
import { InstrumentCard, type InstrumentSpec } from './InstrumentCard';
import { SUBGENRE_PROFILES } from '@/constants/subgenreProfiles';

// Complete instrument catalog
const INSTRUMENTS_CATALOG: Omit<InstrumentSpec, 'presence' | 'style' | 'processing'>[] = [
  // Bass
  { instrument_id: 'log_drum', name: 'Log Drum', category: 'bass', description: 'Signature Amapiano bass - hybrid kick/808/synth', is_core: true, icon: <Drum className="w-4 h-4" /> },
  { instrument_id: 'sub_bass', name: 'Sub Bass', category: 'bass', description: 'Deep sine wave sub for weight', is_core: true, icon: <Waves className="w-4 h-4" /> },
  { instrument_id: 'synth_bass', name: 'Synth Bass', category: 'bass', description: 'Electronic bass synthesizer', is_core: false, icon: <Waves className="w-4 h-4" /> },
  { instrument_id: 'bass_guitar', name: 'Bass Guitar', category: 'bass', description: 'Live bass guitar grooves', is_core: false, icon: <Guitar className="w-4 h-4" /> },
  
  // Percussion
  { instrument_id: 'kick', name: 'Kick Drum', category: 'percussion', description: 'Deep, soft four-on-floor kick', is_core: true, icon: <Drum className="w-4 h-4" /> },
  { instrument_id: 'shakers', name: 'Shakers', category: 'percussion', description: 'Rolling 16th note groove', is_core: true, icon: <Activity className="w-4 h-4" /> },
  { instrument_id: 'congas', name: 'Congas', category: 'percussion', description: 'African conga patterns', is_core: true, icon: <Drum className="w-4 h-4" /> },
  { instrument_id: 'bongos', name: 'Bongos', category: 'percussion', description: 'High-pitched accents', is_core: true, icon: <Drum className="w-4 h-4" /> },
  { instrument_id: 'claps', name: 'Claps', category: 'percussion', description: 'Snappy claps on 2 and 4', is_core: false, icon: <Activity className="w-4 h-4" /> },
  { instrument_id: 'rimshot', name: 'Rimshot', category: 'percussion', description: 'Syncopated rimshot hits', is_core: false, icon: <Activity className="w-4 h-4" /> },
  { instrument_id: 'djembe', name: 'Djembe', category: 'percussion', description: 'West African djembe rhythms', is_core: false, icon: <Drum className="w-4 h-4" /> },
  
  // Keys
  { instrument_id: 'rhodes', name: 'Rhodes', category: 'keys', description: 'Electric piano with warm tones', is_core: true, icon: <Piano className="w-4 h-4" /> },
  { instrument_id: 'acoustic_piano', name: 'Acoustic Piano', category: 'keys', description: 'Grand piano for jazzy chords', is_core: false, icon: <Piano className="w-4 h-4" /> },
  { instrument_id: 'kalimba', name: 'Kalimba', category: 'keys', description: 'African thumb piano melodies', is_core: false, icon: <Piano className="w-4 h-4" /> },
  
  // Strings
  { instrument_id: 'guitar_electric', name: 'Electric Guitar', category: 'strings', description: 'Jazz-fusion guitar licks', is_core: false, icon: <Guitar className="w-4 h-4" /> },
  { instrument_id: 'guitar_acoustic', name: 'Acoustic Guitar', category: 'strings', description: 'Warm fingerpicking patterns', is_core: false, icon: <Guitar className="w-4 h-4" /> },
  { instrument_id: 'violin', name: 'Violin', category: 'strings', description: 'Emotive violin solos', is_core: false, icon: <Music className="w-4 h-4" /> },
  
  // Brass
  { instrument_id: 'saxophone', name: 'Saxophone', category: 'brass', description: 'Soulful sax solos and stabs', is_core: false, icon: <Music className="w-4 h-4" /> },
  { instrument_id: 'trumpet', name: 'Trumpet', category: 'brass', description: 'Offbeat timekeeper trumpet', is_core: false, icon: <Volume2 className="w-4 h-4" /> },
  
  // Synth
  { instrument_id: 'synth_pad', name: 'Synth Pad', category: 'synth', description: 'Atmospheric pad textures', is_core: true, icon: <Waves className="w-4 h-4" /> },
  { instrument_id: 'synth_lead', name: 'Synth Lead', category: 'synth', description: 'Lead synthesizer melodies', is_core: false, icon: <Zap className="w-4 h-4" /> },
  { instrument_id: 'synth_pluck', name: 'Synth Pluck', category: 'synth', description: 'Bell-like pluck sounds', is_core: false, icon: <Zap className="w-4 h-4" /> },
  { instrument_id: 'marimba_synth', name: 'Marimba Synth', category: 'synth', description: 'Tropical marimba-style synth', is_core: false, icon: <Activity className="w-4 h-4" /> },
  
  // Vocal
  { instrument_id: 'vocal_chops', name: 'Vocal Chops', category: 'vocal', description: 'Processed vocal samples', is_core: false, icon: <Mic className="w-4 h-4" /> },
  { instrument_id: 'vocal_chants', name: 'Vocal Chants', category: 'vocal', description: 'Group chant patterns', is_core: false, icon: <Mic className="w-4 h-4" /> },
  { instrument_id: 'vocals', name: 'Lead Vocals', category: 'vocal', description: 'Soulful vocal performances', is_core: false, icon: <Mic className="w-4 h-4" /> }
];

interface EnhancedInstrumentSelectorProps {
  selectedInstruments: InstrumentSpec[];
  onInstrumentsChange: (instruments: InstrumentSpec[]) => void;
  maxInstruments?: number;
}

export function EnhancedInstrumentSelector({
  selectedInstruments,
  onInstrumentsChange,
  maxInstruments = 12
}: EnhancedInstrumentSelectorProps) {
  const [selectedSubgenre, setSelectedSubgenre] = useState<string>('private_school');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const subgenreProfile = SUBGENRE_PROFILES[selectedSubgenre as keyof typeof SUBGENRE_PROFILES];

  const filteredInstruments = useMemo(() => {
    if (activeCategory === 'all') return INSTRUMENTS_CATALOG;
    return INSTRUMENTS_CATALOG.filter(i => i.category === activeCategory);
  }, [activeCategory]);

  const handleInstrumentToggle = (instrumentId: string) => {
    const existing = selectedInstruments.find(i => i.instrument_id === instrumentId);
    
    if (existing) {
      onInstrumentsChange(selectedInstruments.filter(i => i.instrument_id !== instrumentId));
    } else if (selectedInstruments.length < maxInstruments) {
      const catalogItem = INSTRUMENTS_CATALOG.find(i => i.instrument_id === instrumentId);
      if (!catalogItem) return;
      
      const newInstrument: InstrumentSpec = {
        ...catalogItem,
        presence: 1.0,
        style: 'default',
        processing: {
          reverb: subgenreProfile?.default_processing?.reverb ?? 0.3,
          warmth: subgenreProfile?.default_processing?.warmth ?? 0.5,
          distortion: 0.1,
          humanization: subgenreProfile?.default_processing?.humanization ?? 0.5
        }
      };
      
      onInstrumentsChange([...selectedInstruments, newInstrument]);
    }
  };

  const handleInstrumentChange = (instrumentId: string, updates: Partial<InstrumentSpec>) => {
    onInstrumentsChange(
      selectedInstruments.map(i => 
        i.instrument_id === instrumentId ? { ...i, ...updates } : i
      )
    );
  };

  const loadSubgenrePreset = () => {
    if (!subgenreProfile) return;
    
    const presetInstruments: InstrumentSpec[] = subgenreProfile.core_instruments
      .map(id => {
        const catalogItem = INSTRUMENTS_CATALOG.find(i => i.instrument_id === id);
        if (!catalogItem) return null;
        
        return {
          ...catalogItem,
          presence: 1.0,
          style: 'default',
          processing: {
            reverb: subgenreProfile.default_processing.reverb ?? 0.3,
            warmth: subgenreProfile.default_processing.warmth ?? 0.5,
            distortion: 0.1,
            humanization: subgenreProfile.default_processing.humanization ?? 0.5
          }
        };
      })
      .filter(Boolean) as InstrumentSpec[];
    
    onInstrumentsChange(presetInstruments);
  };

  const categories = [
    { id: 'all', label: 'All', icon: <Music className="w-4 h-4" /> },
    { id: 'bass', label: 'Bass', icon: <Waves className="w-4 h-4" /> },
    { id: 'percussion', label: 'Drums', icon: <Drum className="w-4 h-4" /> },
    { id: 'keys', label: 'Keys', icon: <Piano className="w-4 h-4" /> },
    { id: 'strings', label: 'Strings', icon: <Guitar className="w-4 h-4" /> },
    { id: 'brass', label: 'Brass', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'synth', label: 'Synth', icon: <Zap className="w-4 h-4" /> },
    { id: 'vocal', label: 'Vocal', icon: <Mic className="w-4 h-4" /> }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Instrument Selection
          </CardTitle>
          <Badge variant="outline">
            {selectedInstruments.length}/{maxInstruments}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Subgenre Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedSubgenre} onValueChange={setSelectedSubgenre}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select subgenre" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUBGENRE_PROFILES).map(([id, profile]) => (
                <SelectItem key={id} value={id}>
                  <div className="flex flex-col">
                    <span>{profile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {profile.tempo_range[0]}-{profile.tempo_range[1]} BPM
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadSubgenrePreset}>
            <Sparkles className="w-4 h-4 mr-1" />
            Load Preset
          </Button>
        </div>

        {subgenreProfile && (
          <p className="text-sm text-muted-foreground">
            {subgenreProfile.description}
          </p>
        )}

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="flex items-center gap-1 text-xs px-2 py-1"
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-2">
                {filteredInstruments.map(instrument => {
                  const selectedInstrument = selectedInstruments.find(
                    i => i.instrument_id === instrument.instrument_id
                  );
                  const isRecommended = subgenreProfile?.core_instruments.includes(instrument.instrument_id) ||
                    subgenreProfile?.optional_instruments.includes(instrument.instrument_id);
                  
                  return (
                    <div key={instrument.instrument_id} className="relative">
                      {isRecommended && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 z-10 text-[10px] px-1"
                        >
                          {subgenreProfile?.core_instruments.includes(instrument.instrument_id) ? 'Core' : 'Rec'}
                        </Badge>
                      )}
                      <InstrumentCard
                        instrument={selectedInstrument || {
                          ...instrument,
                          presence: 1.0,
                          style: 'default',
                          processing: { reverb: 0.3, warmth: 0.5, distortion: 0.1, humanization: 0.5 }
                        }}
                        isSelected={!!selectedInstrument}
                        onSelect={() => handleInstrumentToggle(instrument.instrument_id)}
                        onChange={(updates) => handleInstrumentChange(instrument.instrument_id, updates)}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
