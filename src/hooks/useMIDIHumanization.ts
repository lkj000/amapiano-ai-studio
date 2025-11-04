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
  const [previewNotes, setPreviewNotes] = useState<MIDINote[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const previewHumanization = useCallback(async (
    notes: MIDINote[],
    audioContext: AudioContext
  ) => {
    const humanizedNotes = humanize(notes);
    setPreviewNotes(humanizedNotes);
    setIsPlaying(true);

    // Play preview using Web Audio API
    humanizedNotes.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Convert MIDI note to frequency
      const frequency = 440 * Math.pow(2, (note.note - 69) / 12);
      oscillator.frequency.value = frequency;
      
      // Apply velocity to gain
      const velocity = note.velocity / 127;
      gainNode.gain.setValueAtTime(velocity * 0.3, audioContext.currentTime + note.time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.time + note.duration);
      
      oscillator.start(audioContext.currentTime + note.time);
      oscillator.stop(audioContext.currentTime + note.time + note.duration);
    });

    // Calculate total duration
    const totalDuration = Math.max(...humanizedNotes.map(n => n.time + n.duration));
    
    setTimeout(() => {
      setIsPlaying(false);
      setPreviewNotes(null);
    }, totalDuration * 1000);

    return humanizedNotes;
  }, [humanize]);

  const compareOriginalVsHumanized = useCallback((
    originalNotes: MIDINote[],
    humanizedNotes: MIDINote[]
  ) => {
    const timingDiff = humanizedNotes.map((h, i) => 
      Math.abs(h.time - originalNotes[i].time)
    );
    const velocityDiff = humanizedNotes.map((h, i) => 
      Math.abs(h.velocity - originalNotes[i].velocity)
    );
    
    return {
      avgTimingDiff: timingDiff.reduce((a, b) => a + b, 0) / timingDiff.length,
      avgVelocityDiff: velocityDiff.reduce((a, b) => a + b, 0) / velocityDiff.length,
      maxTimingDiff: Math.max(...timingDiff),
      maxVelocityDiff: Math.max(...velocityDiff)
    };
  }, []);

  return {
    settings,
    updateSettings,
    humanize,
    applyGrooveTemplate,
    previewHumanization,
    compareOriginalVsHumanized,
    previewNotes,
    isPlaying
  };
}
