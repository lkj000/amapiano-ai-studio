import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Piano, Drum, Guitar, Music, Mic, Headphones, 
  Waves, Zap, Settings, Volume2, Activity, Gamepad2, AudioWaveform 
} from 'lucide-react';
import { AMAPIANO_INSTRUMENT_CONFIGS } from './InstrumentRecordingSelector';
import type { InstrumentConfig } from './InstrumentRecordingSelector';

interface InstrumentSelectorProps {
  onInstrumentSelect: (instrumentConfig: InstrumentConfig) => void;
  selectedInstruments: string[];
  multiSelect?: boolean;
}

export const InstrumentSelector = ({ 
  onInstrumentSelect, 
  selectedInstruments, 
  multiSelect = false 
}: InstrumentSelectorProps) => {
  const groupedInstruments = {
    core: AMAPIANO_INSTRUMENT_CONFIGS.filter(i => i.category === 'core'),
    private_school: AMAPIANO_INSTRUMENT_CONFIGS.filter(i => i.category === 'private_school'),
    synthesized: AMAPIANO_INSTRUMENT_CONFIGS.filter(i => i.category === 'synthesized'),
    advanced: AMAPIANO_INSTRUMENT_CONFIGS.filter(i => i.category === 'advanced'),
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'core': return 'Core Amapiano';
      case 'private_school': return 'Private School Amapiano';
      case 'synthesized': return 'Synthesized Elements';
      case 'advanced': return 'Advanced Instruments';
      default: return category;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'core': return 'Essential foundation instruments that define the Amapiano sound';
      case 'private_school': return 'Soulful live instruments for sophisticated, jazz-influenced compositions';
      case 'synthesized': return 'Electronic elements and processed sounds for modern production';
      case 'advanced': return 'World instruments and specialized tools for unique textures';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Instruments</h2>
        <p className="text-muted-foreground">
          Choose from {AMAPIANO_INSTRUMENT_CONFIGS.length} professional Amapiano instruments
        </p>
        {selectedInstruments.length > 0 && (
          <Badge variant="secondary" className="mt-2">
            {selectedInstruments.length} instruments selected
          </Badge>
        )}
      </div>

      {Object.entries(groupedInstruments).map(([category, instruments]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              {getCategoryTitle(category)}
              <Badge variant="outline" className="ml-auto">
                {instruments.length} instruments
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {getCategoryDescription(category)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {instruments.map((instrument) => {
                const isSelected = selectedInstruments.includes(instrument.id);
                
                return (
                  <Card 
                    key={instrument.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'hover:border-muted-foreground/30'
                    }`}
                    onClick={() => onInstrumentSelect(instrument)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                          {instrument.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight mb-1">
                            {instrument.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {instrument.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {instrument.recordingType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {instrument.sampleRate / 1000}kHz
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};