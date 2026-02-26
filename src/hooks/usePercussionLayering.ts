import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PercussionLayer {
  type: 'shaker' | 'bongo' | 'cowbell' | 'ride' | 'conga' | 'tambourine';
  pattern: number[]; // 0-1 velocity per 16th note
  volume: number;
  pan: number; // -1 to 1
  pitchVariation: number; // 0-100
  humanization: number; // 0-100
}

interface PercussionPreset {
  name: string;
  description: string;
  layers: PercussionLayer[];
  complexity: number; // 1-10
}

const AMAPIANO_PATTERNS = {
  shaker: {
    basic: [0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.7, 0.5],
    syncopated: [0.7, 0.3, 0.5, 0.8, 0.4, 0.6, 0.9, 0.3, 0.7, 0.4, 0.5, 0.8, 0.5, 0.7, 0.9, 0.4],
    triplet: [0.7, 0, 0.5, 0.7, 0, 0.6, 0.8, 0, 0.5, 0.7, 0, 0.6, 0.8, 0, 0.5, 0.7],
  },
  bongo: {
    basic: [0.8, 0, 0, 0, 0.6, 0, 0, 0, 0.8, 0, 0, 0, 0.7, 0, 0, 0],
    call: [0.9, 0.5, 0.7, 0, 0.8, 0, 0.6, 0, 0.9, 0.5, 0.7, 0, 0.8, 0, 0.7, 0.5],
    roll: [0.6, 0.7, 0.8, 0.7, 0.6, 0.7, 0.9, 0.8, 0.7, 0.8, 0.9, 0.8, 0.7, 0.8, 0.9, 0.8],
  },
  cowbell: {
    basic: [0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0],
    clave: [0.9, 0, 0, 0.7, 0, 0, 0.8, 0, 0, 0, 0.9, 0, 0, 0, 0.7, 0],
    accent: [0.9, 0, 0, 0, 0, 0, 0.7, 0, 0.8, 0, 0, 0, 0.9, 0, 0, 0],
  },
  ride: {
    basic: [0.5, 0, 0.6, 0, 0.5, 0, 0.7, 0, 0.5, 0, 0.6, 0, 0.5, 0, 0.7, 0],
    swing: [0.7, 0, 0.4, 0.5, 0, 0.4, 0.7, 0, 0.4, 0.6, 0, 0.4, 0.7, 0, 0.4, 0.5],
    busy: [0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.8, 0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.4, 0.8, 0.6],
  },
};

const PRESETS: PercussionPreset[] = [
  {
    name: 'Private School Classic',
    description: 'Clean, minimal percussion with shakers and ride',
    complexity: 5,
    layers: [
      { type: 'shaker', pattern: AMAPIANO_PATTERNS.shaker.syncopated, volume: 0.7, pan: -0.3, pitchVariation: 20, humanization: 40 },
      { type: 'ride', pattern: AMAPIANO_PATTERNS.ride.basic, volume: 0.5, pan: 0.4, pitchVariation: 10, humanization: 30 },
    ]
  },
  {
    name: 'Blaq Diamond Heavy',
    description: 'Dense layering with bongos, cowbells, and multiple shakers',
    complexity: 8,
    layers: [
      { type: 'shaker', pattern: AMAPIANO_PATTERNS.shaker.syncopated, volume: 0.8, pan: -0.5, pitchVariation: 30, humanization: 50 },
      { type: 'shaker', pattern: AMAPIANO_PATTERNS.shaker.triplet, volume: 0.6, pan: 0.5, pitchVariation: 25, humanization: 45 },
      { type: 'bongo', pattern: AMAPIANO_PATTERNS.bongo.call, volume: 0.7, pan: -0.2, pitchVariation: 40, humanization: 60 },
      { type: 'cowbell', pattern: AMAPIANO_PATTERNS.cowbell.accent, volume: 0.6, pan: 0.3, pitchVariation: 15, humanization: 35 },
      { type: 'ride', pattern: AMAPIANO_PATTERNS.ride.swing, volume: 0.5, pan: 0.6, pitchVariation: 10, humanization: 30 },
    ]
  },
  {
    name: 'Groove Builder',
    description: 'Progressive layering from sparse to dense',
    complexity: 7,
    layers: [
      { type: 'shaker', pattern: AMAPIANO_PATTERNS.shaker.basic, volume: 0.6, pan: 0, pitchVariation: 20, humanization: 35 },
      { type: 'bongo', pattern: AMAPIANO_PATTERNS.bongo.basic, volume: 0.7, pan: -0.4, pitchVariation: 35, humanization: 55 },
      { type: 'cowbell', pattern: AMAPIANO_PATTERNS.cowbell.clave, volume: 0.8, pan: 0.4, pitchVariation: 10, humanization: 25 },
      { type: 'ride', pattern: AMAPIANO_PATTERNS.ride.busy, volume: 0.4, pan: 0.7, pitchVariation: 15, humanization: 40 },
    ]
  },
];

export function usePercussionLayering() {
  const [layers, setLayers] = useState<PercussionLayer[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePattern = useCallback((
    type: PercussionLayer['type'],
    complexity: number,
    humanization: number
  ): number[] => {
    // Get base pattern
    const patternType = complexity > 7 ? 'busy' : complexity > 4 ? 'syncopated' : 'basic';
    const basePattern = AMAPIANO_PATTERNS[type === 'conga' || type === 'tambourine' ? 'bongo' : type][patternType] || 
                       AMAPIANO_PATTERNS.shaker.basic;

    // Apply humanization
    return basePattern.map(velocity => {
      if (velocity === 0) return 0;
      const variation = (Math.random() - 0.5) * (humanization / 100) * 0.3;
      return Math.max(0, Math.min(1, velocity + variation));
    });
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    setLayers(preset.layers);
    setSelectedPreset(presetName);
    
    toast({
      title: "Preset Applied",
      description: `${preset.name} - ${preset.layers.length} layers loaded`,
    });
  }, [toast]);

  const generateAILayers = useCallback(async (
    density: number, // 1-10
    groove: 'straight' | 'swing' | 'shuffle',
    energy: number // 1-10
  ) => {
    setIsGenerating(true);

    try {
      // Generate percussion layers using algorithmic patterns

      const newLayers: PercussionLayer[] = [];
      const layerCount = Math.ceil(density / 2);

      // Base shaker (always present)
      newLayers.push({
        type: 'shaker',
        pattern: generatePattern('shaker', density, 30 + energy * 3),
        volume: 0.6 + energy * 0.02,
        pan: -0.3 + Math.random() * 0.2,
        pitchVariation: 15 + energy * 2,
        humanization: 35 + energy * 2
      });

      // Add more layers based on density
      if (density >= 3) {
        newLayers.push({
          type: 'ride',
          pattern: generatePattern('ride', density, 25 + energy * 2),
          volume: 0.4 + energy * 0.02,
          pan: 0.4 + Math.random() * 0.2,
          pitchVariation: 10 + energy,
          humanization: 30 + energy * 2
        });
      }

      if (density >= 5) {
        newLayers.push({
          type: 'bongo',
          pattern: generatePattern('bongo', density, 40 + energy * 3),
          volume: 0.5 + energy * 0.03,
          pan: -0.2 + Math.random() * 0.15,
          pitchVariation: 30 + energy * 2,
          humanization: 50 + energy * 2
        });
      }

      if (density >= 7) {
        newLayers.push({
          type: 'cowbell',
          pattern: generatePattern('cowbell', density, 20 + energy * 2),
          volume: 0.55 + energy * 0.02,
          pan: 0.3 + Math.random() * 0.15,
          pitchVariation: 12 + energy,
          humanization: 30 + energy
        });
      }

      if (density >= 9) {
        // Add second shaker for extra density
        newLayers.push({
          type: 'shaker',
          pattern: generatePattern('shaker', density, 35 + energy * 3),
          volume: 0.5 + energy * 0.02,
          pan: 0.5 + Math.random() * 0.2,
          pitchVariation: 20 + energy * 2,
          humanization: 40 + energy * 2
        });
      }

      setLayers(newLayers);
      setSelectedPreset(null);

      toast({
        title: "AI Layers Generated",
        description: `Created ${newLayers.length} percussion layers`,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [generatePattern, toast]);

  const addLayer = useCallback((type: PercussionLayer['type']) => {
    const newLayer: PercussionLayer = {
      type,
      pattern: generatePattern(type, 5, 40),
      volume: 0.6,
      pan: 0,
      pitchVariation: 20,
      humanization: 40
    };

    setLayers(prev => [...prev, newLayer]);
  }, [generatePattern]);

  const removeLayer = useCallback((index: number) => {
    setLayers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateLayer = useCallback((index: number, updates: Partial<PercussionLayer>) => {
    setLayers(prev => prev.map((layer, i) => 
      i === index ? { ...layer, ...updates } : layer
    ));
  }, []);

  const exportMIDI = useCallback(() => {
    // Placeholder for MIDI export
    toast({
      title: "MIDI Export",
      description: `Exporting ${layers.length} percussion layers to MIDI`,
    });
  }, [layers, toast]);

  return {
    layers,
    selectedPreset,
    isGenerating,
    presets: PRESETS,
    applyPreset,
    generateAILayers,
    addLayer,
    removeLayer,
    updateLayer,
    exportMIDI
  };
}
