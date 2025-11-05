import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

interface VelocityLayer {
  velocity: number; // 0-127
  pitch: number; // Hz
  brightness: number; // 0-1
  volume: number; // 0-1
}

interface LogDrumSettings {
  basePitch: number; // Hz
  pitchEnvelope: {
    amount: number; // semitones
    decay: number; // seconds
  };
  envelope: ADSREnvelope;
  character: {
    woodiness: number; // 0-1
    resonance: number; // 0-1
    dampening: number; // 0-1
  };
  velocityLayers: VelocityLayer[];
  tuning: 'standard' | 'amapiano' | 'afro' | 'custom';
}

interface LogDrumPreset {
  name: string;
  description: string;
  settings: LogDrumSettings;
}

const PRESETS: LogDrumPreset[] = [
  {
    name: 'Classic Log',
    description: 'Traditional Amapiano log drum sound',
    settings: {
      basePitch: 110, // A2
      pitchEnvelope: { amount: 12, decay: 0.15 },
      envelope: { attack: 0.002, decay: 0.3, sustain: 0.1, release: 0.5 },
      character: { woodiness: 0.7, resonance: 0.6, dampening: 0.4 },
      velocityLayers: [
        { velocity: 30, pitch: 110, brightness: 0.3, volume: 0.5 },
        { velocity: 70, pitch: 112, brightness: 0.6, volume: 0.75 },
        { velocity: 100, pitch: 115, brightness: 0.85, volume: 0.9 },
        { velocity: 127, pitch: 118, brightness: 1.0, volume: 1.0 },
      ],
      tuning: 'amapiano'
    }
  },
  {
    name: 'Deep Log',
    description: 'Lower pitched with more body',
    settings: {
      basePitch: 82.5, // E2
      pitchEnvelope: { amount: 16, decay: 0.2 },
      envelope: { attack: 0.003, decay: 0.4, sustain: 0.15, release: 0.6 },
      character: { woodiness: 0.8, resonance: 0.7, dampening: 0.3 },
      velocityLayers: [
        { velocity: 30, pitch: 82.5, brightness: 0.25, volume: 0.55 },
        { velocity: 70, pitch: 84, brightness: 0.55, volume: 0.8 },
        { velocity: 100, pitch: 87, brightness: 0.8, volume: 0.95 },
        { velocity: 127, pitch: 90, brightness: 0.95, volume: 1.0 },
      ],
      tuning: 'afro'
    }
  },
  {
    name: 'Bright Log',
    description: 'Higher pitched with more attack',
    settings: {
      basePitch: 146.8, // D3
      pitchEnvelope: { amount: 8, decay: 0.1 },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.05, release: 0.3 },
      character: { woodiness: 0.5, resonance: 0.5, dampening: 0.6 },
      velocityLayers: [
        { velocity: 30, pitch: 146.8, brightness: 0.4, volume: 0.5 },
        { velocity: 70, pitch: 148, brightness: 0.7, volume: 0.75 },
        { velocity: 100, pitch: 150, brightness: 0.9, volume: 0.9 },
        { velocity: 127, pitch: 152, brightness: 1.0, volume: 1.0 },
      ],
      tuning: 'standard'
    }
  },
  {
    name: 'Punchy Log',
    description: 'Aggressive with fast decay',
    settings: {
      basePitch: 110,
      pitchEnvelope: { amount: 14, decay: 0.12 },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.4 },
      character: { woodiness: 0.6, resonance: 0.8, dampening: 0.5 },
      velocityLayers: [
        { velocity: 30, pitch: 110, brightness: 0.5, volume: 0.6 },
        { velocity: 70, pitch: 113, brightness: 0.75, volume: 0.85 },
        { velocity: 100, pitch: 116, brightness: 0.95, volume: 1.0 },
        { velocity: 127, pitch: 120, brightness: 1.0, volume: 1.0 },
      ],
      tuning: 'amapiano'
    }
  },
];

export function useLogDrumDesigner() {
  const [settings, setSettings] = useState<LogDrumSettings>(PRESETS[0].settings);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const applyPreset = useCallback((presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    setSettings(preset.settings);
    setSelectedPreset(presetName);

    toast({
      title: "Preset Applied",
      description: `${preset.name} - ${preset.description}`,
    });
  }, [toast]);

  const updateEnvelope = useCallback((updates: Partial<ADSREnvelope>) => {
    setSettings(prev => ({
      ...prev,
      envelope: { ...prev.envelope, ...updates }
    }));
  }, []);

  const updateCharacter = useCallback((updates: Partial<LogDrumSettings['character']>) => {
    setSettings(prev => ({
      ...prev,
      character: { ...prev.character, ...updates }
    }));
  }, []);

  const updatePitchEnvelope = useCallback((updates: Partial<LogDrumSettings['pitchEnvelope']>) => {
    setSettings(prev => ({
      ...prev,
      pitchEnvelope: { ...prev.pitchEnvelope, ...updates }
    }));
  }, []);

  const setBasePitch = useCallback((pitch: number) => {
    setSettings(prev => ({ ...prev, basePitch: pitch }));
  }, []);

  const setTuning = useCallback((tuning: LogDrumSettings['tuning']) => {
    setIsProcessing(true);

    setTimeout(() => {
      setSettings(prev => {
        let basePitch = prev.basePitch;
        
        // Adjust pitch for tuning system
        switch (tuning) {
          case 'amapiano':
            basePitch = 110; // A2
            break;
          case 'afro':
            basePitch = 82.5; // E2
            break;
          case 'standard':
            basePitch = 130.8; // C3
            break;
        }

        return { ...prev, basePitch, tuning };
      });

      setIsProcessing(false);

      toast({
        title: "Tuning Applied",
        description: `Set to ${tuning} tuning system`,
      });
    }, 200);
  }, [toast]);

  const addVelocityLayer = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      velocityLayers: [
        ...prev.velocityLayers,
        {
          velocity: 50,
          pitch: prev.basePitch,
          brightness: 0.5,
          volume: 0.7
        }
      ].sort((a, b) => a.velocity - b.velocity)
    }));
  }, []);

  const removeVelocityLayer = useCallback((index: number) => {
    setSettings(prev => ({
      ...prev,
      velocityLayers: prev.velocityLayers.filter((_, i) => i !== index)
    }));
  }, []);

  const updateVelocityLayer = useCallback((index: number, updates: Partial<VelocityLayer>) => {
    setSettings(prev => ({
      ...prev,
      velocityLayers: prev.velocityLayers.map((layer, i) =>
        i === index ? { ...layer, ...updates } : layer
      ).sort((a, b) => a.velocity - b.velocity)
    }));
  }, []);

  const autoTuneVelocityLayers = useCallback(() => {
    setIsProcessing(true);

    setTimeout(() => {
      setSettings(prev => {
        const layers = prev.velocityLayers.length;
        const pitchRange = 12; // semitones
        
        return {
          ...prev,
          velocityLayers: prev.velocityLayers.map((layer, i) => ({
            ...layer,
            pitch: prev.basePitch * Math.pow(2, (i / layers) * (pitchRange / 12)),
            brightness: 0.3 + (i / layers) * 0.7,
            volume: 0.5 + (i / layers) * 0.5
          }))
        };
      });

      setIsProcessing(false);

      toast({
        title: "Auto-Tuned",
        description: "Velocity layers optimized for dynamic response",
      });
    }, 300);
  }, [toast]);

  const analyzeCharacter = useCallback(() => {
    const { woodiness, resonance, dampening } = settings.character;
    
    let description = '';
    
    if (woodiness > 0.7) {
      description += 'Very woody and organic. ';
    } else if (woodiness < 0.4) {
      description += 'Synthetic and clean. ';
    } else {
      description += 'Balanced wood character. ';
    }

    if (resonance > 0.7) {
      description += 'Highly resonant with long decay. ';
    } else if (resonance < 0.4) {
      description += 'Tight and controlled. ';
    } else {
      description += 'Moderate resonance. ';
    }

    if (dampening > 0.7) {
      description += 'Heavily dampened, short sustain.';
    } else if (dampening < 0.4) {
      description += 'Open and ringing.';
    } else {
      description += 'Natural dampening.';
    }

    return description;
  }, [settings.character]);

  // Real-time audio synthesis
  const playLogDrumSound = useCallback((velocity: number = 100, audioContext?: AudioContext) => {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const now = audioContext.currentTime;
    const { envelope, pitchEnvelope, character, basePitch } = settings;
    
    // Select velocity layer
    const normalizedVelocity = velocity;
    const layer = settings.velocityLayers.reduce((closest, current) => {
      return Math.abs(current.velocity - normalizedVelocity) < Math.abs(closest.velocity - normalizedVelocity)
        ? current
        : closest;
    });

    // Create oscillator with pitch envelope
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    // Pitch envelope
    osc.frequency.setValueAtTime(layer.pitch, now);
    osc.frequency.exponentialRampToValueAtTime(
      basePitch,
      now + pitchEnvelope.decay
    );

    // Character filter (simulates woodiness/resonance)
    filterNode.type = 'bandpass';
    filterNode.frequency.value = basePitch * (1 + character.woodiness);
    filterNode.Q.value = 10 * character.resonance;

    // ADSR Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(
      layer.volume * layer.brightness,
      now + envelope.attack
    );
    gainNode.gain.linearRampToValueAtTime(
      layer.volume * envelope.sustain,
      now + envelope.attack + envelope.decay
    );
    gainNode.gain.setValueAtTime(
      layer.volume * envelope.sustain,
      now + envelope.attack + envelope.decay + 0.1
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      now + envelope.attack + envelope.decay + envelope.release
    );

    // Apply dampening (simulates muting)
    const dampeningNode = audioContext.createGain();
    dampeningNode.gain.value = 1 - character.dampening * 0.5;

    // Connect nodes
    osc.connect(filterNode);
    filterNode.connect(dampeningNode);
    dampeningNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play
    osc.start(now);
    osc.stop(now + envelope.attack + envelope.decay + envelope.release + 0.1);

    toast({
      title: "Log Drum Sound",
      description: `Playing at ${Math.round(basePitch)}Hz`,
    });
  }, [settings, toast]);

  return {
    settings,
    selectedPreset,
    isProcessing,
    presets: PRESETS,
    applyPreset,
    updateEnvelope,
    updateCharacter,
    updatePitchEnvelope,
    setBasePitch,
    setTuning,
    addVelocityLayer,
    removeVelocityLayer,
    updateVelocityLayer,
    autoTuneVelocityLayers,
    analyzeCharacter,
    playLogDrumSound
  };
}
