import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BassLayer {
  type: 'sub' | 'mid' | 'top';
  frequency: number; // Hz
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter: {
    cutoff: number; // Hz
    resonance: number; // 0-1
  };
  volume: number; // 0-1
  phase: number; // 0-360 degrees
}

interface BassPreset {
  name: string;
  description: string;
  subBass: BassLayer;
  midBass: BassLayer;
  topBass: BassLayer;
  stereoWidth: number;
}

const DEFAULT_PRESETS: BassPreset[] = [
  {
    name: 'Deep & Clean',
    description: 'Tight sub-bass with minimal harmonics',
    stereoWidth: 0.2,
    subBass: {
      type: 'sub',
      frequency: 45,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.2 },
      filter: { cutoff: 80, resonance: 0.1 },
      volume: 0.85,
      phase: 0
    },
    midBass: {
      type: 'mid',
      frequency: 90,
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.15 },
      filter: { cutoff: 200, resonance: 0.3 },
      volume: 0.5,
      phase: 0
    },
    topBass: {
      type: 'top',
      frequency: 180,
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.5, release: 0.1 },
      filter: { cutoff: 500, resonance: 0.2 },
      volume: 0.3,
      phase: 0
    }
  },
  {
    name: 'Amapiano Punch',
    description: 'Aggressive mid-bass with sub support',
    stereoWidth: 0.35,
    subBass: {
      type: 'sub',
      frequency: 50,
      envelope: { attack: 0.005, decay: 0.08, sustain: 0.95, release: 0.15 },
      filter: { cutoff: 70, resonance: 0.15 },
      volume: 0.9,
      phase: 0
    },
    midBass: {
      type: 'mid',
      frequency: 100,
      envelope: { attack: 0.003, decay: 0.12, sustain: 0.8, release: 0.12 },
      filter: { cutoff: 250, resonance: 0.5 },
      volume: 0.7,
      phase: 0
    },
    topBass: {
      type: 'top',
      frequency: 200,
      envelope: { attack: 0.002, decay: 0.08, sustain: 0.6, release: 0.08 },
      filter: { cutoff: 600, resonance: 0.4 },
      volume: 0.45,
      phase: 0
    }
  },
  {
    name: 'Rolling Sub',
    description: 'Long sub-bass rolls with harmonic richness',
    stereoWidth: 0.15,
    subBass: {
      type: 'sub',
      frequency: 42,
      envelope: { attack: 0.02, decay: 0.15, sustain: 1.0, release: 0.3 },
      filter: { cutoff: 90, resonance: 0.2 },
      volume: 1.0,
      phase: 0
    },
    midBass: {
      type: 'mid',
      frequency: 84,
      envelope: { attack: 0.015, decay: 0.2, sustain: 0.9, release: 0.25 },
      filter: { cutoff: 220, resonance: 0.4 },
      volume: 0.6,
      phase: 180
    },
    topBass: {
      type: 'top',
      frequency: 168,
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.2 },
      filter: { cutoff: 550, resonance: 0.35 },
      volume: 0.4,
      phase: 90
    }
  },
];

export function useBassLayering() {
  const [subBass, setSubBass] = useState<BassLayer>(DEFAULT_PRESETS[0].subBass);
  const [midBass, setMidBass] = useState<BassLayer>(DEFAULT_PRESETS[0].midBass);
  const [topBass, setTopBass] = useState<BassLayer>(DEFAULT_PRESETS[0].topBass);
  const [stereoWidth, setStereoWidth] = useState(0.2);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const applyPreset = useCallback((presetName: string) => {
    const preset = DEFAULT_PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    setSubBass(preset.subBass);
    setMidBass(preset.midBass);
    setTopBass(preset.topBass);
    setStereoWidth(preset.stereoWidth);
    setSelectedPreset(presetName);

    toast({
      title: "Preset Applied",
      description: `${preset.name} - ${preset.description}`,
    });
  }, [toast]);

  const analyzePhaseAlignment = useCallback(() => {
    // Calculate phase relationship between layers
    const subMidPhase = Math.abs(subBass.phase - midBass.phase);
    const midTopPhase = Math.abs(midBass.phase - topBass.phase);
    
    const isAligned = subMidPhase % 180 === 0 && midTopPhase % 180 === 0;
    
    return {
      isAligned,
      subMidPhase,
      midTopPhase,
      recommendation: isAligned ? 'Phases are aligned!' : 'Consider adjusting phase for better coherence'
    };
  }, [subBass.phase, midBass.phase, topBass.phase]);

  const autoAlignPhase = useCallback(() => {
    setIsProcessing(true);
    
    setTimeout(() => {
      // Auto-align phases for maximum coherence
      setMidBass(prev => ({ ...prev, phase: 0 }));
      setTopBass(prev => ({ ...prev, phase: 0 }));
      
      setIsProcessing(false);
      
      toast({
        title: "Phase Aligned",
        description: "All layers aligned for maximum coherence",
      });
    }, 300);
  }, [toast]);

  const analyzeFrequencyGaps = useCallback(() => {
    const gaps: string[] = [];
    
    // Check sub to mid gap
    const subMidGap = midBass.frequency - subBass.frequency;
    if (subMidGap > 60) {
      gaps.push(`Large gap between sub (${subBass.frequency}Hz) and mid (${midBass.frequency}Hz)`);
    }
    
    // Check mid to top gap
    const midTopGap = topBass.frequency - midBass.frequency;
    if (midTopGap > 120) {
      gaps.push(`Large gap between mid (${midBass.frequency}Hz) and top (${topBass.frequency}Hz)`);
    }
    
    // Check for overlap
    if (subBass.filter.cutoff > midBass.frequency * 0.8) {
      gaps.push('Sub-bass filter may overlap with mid-bass');
    }
    
    return {
      hasGaps: gaps.length > 0,
      gaps,
      coverage: gaps.length === 0 ? 'Full spectrum coverage' : 'Consider adjusting frequencies'
    };
  }, [subBass, midBass, topBass]);

  const optimizeForGenre = useCallback((genre: 'amapiano' | 'deep-house' | 'afrotech') => {
    setIsProcessing(true);
    
    setTimeout(() => {
      switch (genre) {
        case 'amapiano':
          // Boost mid-bass, moderate sub
          setSubBass(prev => ({ ...prev, volume: 0.85, frequency: 48 }));
          setMidBass(prev => ({ ...prev, volume: 0.75, filter: { ...prev.filter, resonance: 0.5 } }));
          setTopBass(prev => ({ ...prev, volume: 0.5 }));
          setStereoWidth(0.35);
          break;
        case 'deep-house':
          // Stronger sub, less mid
          setSubBass(prev => ({ ...prev, volume: 1.0, frequency: 42 }));
          setMidBass(prev => ({ ...prev, volume: 0.5 }));
          setTopBass(prev => ({ ...prev, volume: 0.3 }));
          setStereoWidth(0.15);
          break;
        case 'afrotech':
          // Balanced with punch
          setSubBass(prev => ({ ...prev, volume: 0.9, frequency: 50 }));
          setMidBass(prev => ({ ...prev, volume: 0.7 }));
          setTopBass(prev => ({ ...prev, volume: 0.6 }));
          setStereoWidth(0.4);
          break;
      }
      
      setIsProcessing(false);
      
      toast({
        title: "Optimized for Genre",
        description: `Bass configured for ${genre}`,
      });
    }, 300);
  }, [toast]);

  const updateSubBass = useCallback((updates: Partial<BassLayer>) => {
    setSubBass(prev => ({ ...prev, ...updates }));
  }, []);

  const updateMidBass = useCallback((updates: Partial<BassLayer>) => {
    setMidBass(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTopBass = useCallback((updates: Partial<BassLayer>) => {
    setTopBass(prev => ({ ...prev, ...updates }));
  }, []);

  // Real-time 3-layer bass synthesis
  const playBassSound = useCallback((note: number = 60, audioContext?: AudioContext) => {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const now = audioContext.currentTime;
    const frequency = 440 * Math.pow(2, (note - 69) / 12);

    // Create 3 oscillators for sub, mid, top
    const layers = [
      { ...subBass, freq: frequency * (subBass.frequency / 50) },
      { ...midBass, freq: frequency * (midBass.frequency / 100) },
      { ...topBass, freq: frequency * (topBass.frequency / 200) }
    ];

    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.7;

    layers.forEach((layer, idx) => {
      const osc = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      const filter = audioContext!.createBiquadFilter();
      const panner = audioContext!.createStereoPanner();

      // Oscillator setup
      osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sawtooth';
      osc.frequency.value = layer.freq;

      // Phase offset
      osc.detune.value = (layer.phase / 360) * 100;

      // Filter setup
      filter.type = 'lowpass';
      filter.frequency.value = layer.filter.cutoff;
      filter.Q.value = layer.filter.resonance * 10;

      // Stereo width (sub=mono, mid=narrow, top=wide)
      const panAmount = (idx / 2) * stereoWidth * (Math.random() - 0.5);
      panner.pan.value = panAmount;

      // ADSR Envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(
        layer.volume,
        now + layer.envelope.attack
      );
      gain.gain.linearRampToValueAtTime(
        layer.volume * layer.envelope.sustain,
        now + layer.envelope.attack + layer.envelope.decay
      );
      gain.gain.setValueAtTime(
        layer.volume * layer.envelope.sustain,
        now + layer.envelope.attack + layer.envelope.decay + 0.5
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        now + layer.envelope.attack + layer.envelope.decay + layer.envelope.release + 0.5
      );

      // Connect: osc -> filter -> panner -> gain -> master
      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(masterGain);

      // Play
      osc.start(now);
      osc.stop(now + layer.envelope.attack + layer.envelope.decay + layer.envelope.release + 0.6);
    });

    masterGain.connect(audioContext.destination);

    toast({
      title: "3-Layer Bass",
      description: `Playing ${Math.round(frequency)}Hz`,
    });
  }, [subBass, midBass, topBass, stereoWidth, toast]);

  return {
    subBass,
    midBass,
    topBass,
    stereoWidth,
    selectedPreset,
    isProcessing,
    presets: DEFAULT_PRESETS,
    applyPreset,
    analyzePhaseAlignment,
    autoAlignPhase,
    analyzeFrequencyGaps,
    optimizeForGenre,
    updateSubBass,
    updateMidBass,
    updateTopBass,
    setStereoWidth,
    playBassSound
  };
}
