import { useState, useCallback } from 'react';

interface HumanizationSettings {
  timingVariation: number; // 0-100 (milliseconds)
  velocityVariation: number; // 0-100 (%)
  durationVariation: number; // 0-100 (%)
  grooveIntensity: number; // 0-100 (swing feel)
}

interface MIDINote {
  note: number;
  velocity: number;
  time: number;
  duration: number;
}

const DEFAULT_SETTINGS: HumanizationSettings = {
  timingVariation: 15,
  velocityVariation: 20,
  durationVariation: 10,
  grooveIntensity: 60
};

export function useMIDIHumanization() {
  const [settings, setSettings] = useState<HumanizationSettings>(DEFAULT_SETTINGS);

  const humanize = useCallback((notes: MIDINote[]): MIDINote[] => {
    return notes.map((note, index) => {
      // Timing variation with groove
      const grooveFactor = Math.sin(index * Math.PI / 4) * (settings.grooveIntensity / 100);
      const timingOffset = (Math.random() - 0.5) * (settings.timingVariation / 1000) + grooveFactor * 0.01;
      
      // Velocity variation (avoid extremes)
      const velocityOffset = (Math.random() - 0.5) * (settings.velocityVariation / 100);
      const newVelocity = Math.max(20, Math.min(127, 
        note.velocity + note.velocity * velocityOffset
      ));
      
      // Duration variation
      const durationOffset = (Math.random() - 0.5) * (settings.durationVariation / 100);
      const newDuration = Math.max(0.05, 
        note.duration + note.duration * durationOffset
      );
      
      return {
        ...note,
        time: Math.max(0, note.time + timingOffset),
        velocity: Math.round(newVelocity),
        duration: newDuration
      };
    });
  }, [settings]);

  const applyGrooveTemplate = useCallback((
    notes: MIDINote[], 
    template: 'amapiano' | 'swing' | 'shuffle' | 'straight'
  ): MIDINote[] => {
    const grooveMap: Record<string, (index: number) => number> = {
      amapiano: (i) => Math.sin(i * Math.PI / 2) * 0.03, // 3% timing shift
      swing: (i) => (i % 2 === 1 ? 0.04 : -0.02), // 16th note swing
      shuffle: (i) => (i % 3 === 2 ? 0.05 : 0), // Triplet shuffle
      straight: () => 0
    };
    
    const grooveFn = grooveMap[template];
    
    return notes.map((note, index) => ({
      ...note,
      time: note.time + grooveFn(index)
    }));
  }, []);

  const updateSettings = useCallback((partial: Partial<HumanizationSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  return {
    settings,
    updateSettings,
    humanize,
    applyGrooveTemplate
  };
}
