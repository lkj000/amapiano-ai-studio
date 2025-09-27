import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  type: 'instrument' | 'effect' | 'utility' | 'generator';
  category: string;
  tags: string[];
  icon?: string;
  screenshots?: string[];
  
  // Technical specifications
  audioInputs: number;
  audioOutputs: number;
  midiInputs: number;
  midiOutputs: number;
  parameters: PluginParameter[];
  presets: PluginPreset[];
  
  // Runtime information
  entryPoint: string; // URL or path to plugin code
  dependencies: string[];
  minimumVersion: string;
  
  // Metadata
  website?: string;
  repository?: string;
  license: string;
  price: number; // 0 for free
  downloadCount: number;
  rating: number;
  reviews: number;
}

export interface PluginParameter {
  id: string;
  name: string;
  type: 'float' | 'int' | 'boolean' | 'enum' | 'string';
  defaultValue: any;
  minValue?: number;
  maxValue?: number;
  step?: number;
  options?: string[]; // for enum type
  unit?: string;
  description?: string;
  automatable: boolean;
}

export interface PluginPreset {
  id: string;
  name: string;
  author: string;
  description?: string;
  parameters: Record<string, any>;
  tags: string[];
}

export interface PluginInstance {
  id: string;
  pluginId: string;
  name: string;
  trackId: string;
  position: number; // Position in effects chain
  parameters: Record<string, any>;
  presetId?: string;
  bypass: boolean;
  
  // Runtime references
  audioNode?: AudioNode;
  processor?: any; // AudioWorkletProcessor reference
  worker?: Worker;
}

export interface PluginAPI {
  // Audio processing
  createAudioNode: (context: AudioContext) => AudioNode;
  processAudio: (inputs: Float32Array[], outputs: Float32Array[], parameters: Record<string, any>) => void;
  
  // MIDI handling
  processMidi?: (midiData: Uint8Array) => void;
  
  // Parameter management
  setParameter: (id: string, value: any) => void;
  getParameter: (id: string) => any;
  getParameters: () => Record<string, any>;
  
  // Presets
  loadPreset: (preset: PluginPreset) => void;
  savePreset: (name: string) => PluginPreset;
  
  // Lifecycle
  initialize: (sampleRate: number, bufferSize: number) => void;
  cleanup: () => void;
}

export interface PluginStore {
  searchPlugins: (query: string, filters?: PluginFilters) => Promise<PluginManifest[]>;
  getPlugin: (id: string) => Promise<PluginManifest>;
  downloadPlugin: (id: string) => Promise<void>;
  installPlugin: (pluginData: ArrayBuffer | string) => Promise<void>;
  uninstallPlugin: (id: string) => Promise<void>;
  getInstalledPlugins: () => Promise<PluginManifest[]>;
  checkUpdates: () => Promise<string[]>; // Returns plugin IDs with updates
  updatePlugin: (id: string) => Promise<void>;
}

export interface PluginFilters {
  type?: 'instrument' | 'effect' | 'utility' | 'generator';
  category?: string;
  tags?: string[];
  priceRange?: [number, number];
  rating?: number;
  author?: string;
  free?: boolean;
}

class PluginRegistry {
  private plugins = new Map<string, PluginManifest>();
  private instances = new Map<string, PluginInstance>();
  private loadedPlugins = new Map<string, PluginAPI>();
  private audioContext: AudioContext | null = null;

  setAudioContext(context: AudioContext) {
    this.audioContext = context;
  }

  registerPlugin(manifest: PluginManifest, api: PluginAPI) {
    this.plugins.set(manifest.id, manifest);
    this.loadedPlugins.set(manifest.id, api);
  }

  getPlugin(id: string): PluginManifest | undefined {
    return this.plugins.get(id);
  }

  getPluginAPI(id: string): PluginAPI | undefined {
    return this.loadedPlugins.get(id);
  }

  createInstance(pluginId: string, trackId: string): PluginInstance | null {
    const plugin = this.plugins.get(pluginId);
    const api = this.loadedPlugins.get(pluginId);
    
    if (!plugin || !api || !this.audioContext) return null;

    const instanceId = `${pluginId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize parameters with defaults
    const parameters: Record<string, any> = {};
    plugin.parameters.forEach(param => {
      parameters[param.id] = param.defaultValue;
    });

    const instance: PluginInstance = {
      id: instanceId,
      pluginId,
      name: plugin.name,
      trackId,
      position: 0,
      parameters,
      bypass: false
    };

    // Create audio node
    try {
      instance.audioNode = api.createAudioNode(this.audioContext);
      api.initialize(this.audioContext.sampleRate, 4096);
    } catch (error) {
      console.error('Failed to create plugin instance:', error);
      return null;
    }

    this.instances.set(instanceId, instance);
    return instance;
  }

  removeInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    const api = this.loadedPlugins.get(instance.pluginId);
    if (api) {
      api.cleanup();
    }

    if (instance.audioNode) {
      instance.audioNode.disconnect();
    }

    if (instance.worker) {
      instance.worker.terminate();
    }

    this.instances.delete(instanceId);
    return true;
  }

  getInstance(instanceId: string): PluginInstance | undefined {
    return this.instances.get(instanceId);
  }

  getInstancesByTrack(trackId: string): PluginInstance[] {
    return Array.from(this.instances.values()).filter(instance => instance.trackId === trackId);
  }

  updateParameter(instanceId: string, parameterId: string, value: any): boolean {
    const instance = this.instances.get(instanceId);
    const api = this.loadedPlugins.get(instance?.pluginId || '');
    
    if (!instance || !api) return false;

    instance.parameters[parameterId] = value;
    api.setParameter(parameterId, value);
    return true;
  }
}

const pluginRegistry = new PluginRegistry();

export function usePluginSystem(audioContext: AudioContext | null) {
  const [installedPlugins, setInstalledPlugins] = useState<PluginManifest[]>([]);
  const [pluginInstances, setPluginInstances] = useState<Map<string, PluginInstance[]>>(new Map());
  const [availablePlugins, setAvailablePlugins] = useState<PluginManifest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  // Initialize plugin registry with audio context
  useEffect(() => {
    if (audioContext) {
      pluginRegistry.setAudioContext(audioContext);
    }
  }, [audioContext]);

  // Load built-in plugins
  useEffect(() => {
    loadBuiltInPlugins();
  }, []);

  const loadBuiltInPlugins = useCallback(async () => {
    const builtInPlugins: PluginManifest[] = [
      {
        id: 'builtin-reverb',
        name: 'Studio Reverb',
        version: '1.0.0',
        author: 'DAW Team',
        description: 'High-quality algorithmic reverb with multiple room types',
        type: 'effect',
        category: 'Reverb',
        tags: ['reverb', 'space', 'ambience'],
        audioInputs: 2,
        audioOutputs: 2,
        midiInputs: 0,
        midiOutputs: 0,
        parameters: [
          {
            id: 'roomSize',
            name: 'Room Size',
            type: 'float',
            defaultValue: 0.5,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            automatable: true
          },
          {
            id: 'damping',
            name: 'Damping',
            type: 'float',
            defaultValue: 0.3,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            automatable: true
          },
          {
            id: 'wet',
            name: 'Wet/Dry',
            type: 'float',
            defaultValue: 0.3,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            automatable: true
          }
        ],
        presets: [
          {
            id: 'hall',
            name: 'Concert Hall',
            author: 'DAW Team',
            parameters: { roomSize: 0.8, damping: 0.2, wet: 0.4 },
            tags: ['hall', 'large']
          },
          {
            id: 'room',
            name: 'Small Room',
            author: 'DAW Team',
            parameters: { roomSize: 0.3, damping: 0.6, wet: 0.2 },
            tags: ['room', 'intimate']
          }
        ],
        entryPoint: 'builtin://reverb',
        dependencies: [],
        minimumVersion: '1.0.0',
        license: 'MIT',
        price: 0,
        downloadCount: 0,
        rating: 4.8,
        reviews: 0
      },
      {
        id: 'builtin-compressor',
        name: 'Precision Compressor',
        version: '1.0.0',
        author: 'DAW Team',
        description: 'Transparent optical-style compressor with advanced controls',
        type: 'effect',
        category: 'Dynamics',
        tags: ['compressor', 'dynamics', 'leveling'],
        audioInputs: 2,
        audioOutputs: 2,
        midiInputs: 0,
        midiOutputs: 0,
        parameters: [
          {
            id: 'threshold',
            name: 'Threshold',
            type: 'float',
            defaultValue: -12,
            minValue: -60,
            maxValue: 0,
            unit: 'dB',
            automatable: true
          },
          {
            id: 'ratio',
            name: 'Ratio',
            type: 'float',
            defaultValue: 4.0,
            minValue: 1.0,
            maxValue: 20.0,
            unit: ':1',
            automatable: true
          },
          {
            id: 'attack',
            name: 'Attack',
            type: 'float',
            defaultValue: 5,
            minValue: 0.1,
            maxValue: 100,
            unit: 'ms',
            automatable: true
          },
          {
            id: 'release',
            name: 'Release',
            type: 'float',
            defaultValue: 50,
            minValue: 1,
            maxValue: 1000,
            unit: 'ms',
            automatable: true
          }
        ],
        presets: [
          {
            id: 'vocal',
            name: 'Vocal Leveling',
            author: 'DAW Team',
            parameters: { threshold: -18, ratio: 3.0, attack: 2, release: 30 },
            tags: ['vocal', 'leveling']
          },
          {
            id: 'drums',
            name: 'Drum Bus',
            author: 'DAW Team',
            parameters: { threshold: -8, ratio: 4.0, attack: 1, release: 100 },
            tags: ['drums', 'punch']
          }
        ],
        entryPoint: 'builtin://compressor',
        dependencies: [],
        minimumVersion: '1.0.0',
        license: 'MIT',
        price: 0,
        downloadCount: 0,
        rating: 4.9,
        reviews: 0
      },
      {
        id: 'builtin-synthesizer',
        name: 'PolyWave Synthesizer',
        version: '1.0.0',
        author: 'DAW Team',
        description: 'Versatile wavetable synthesizer with multiple oscillators',
        type: 'instrument',
        category: 'Synthesizers',
        tags: ['synth', 'wavetable', 'polyphonic'],
        audioInputs: 0,
        audioOutputs: 2,
        midiInputs: 1,
        midiOutputs: 0,
        parameters: [
          {
            id: 'osc1Wave',
            name: 'Oscillator 1 Wave',
            type: 'enum',
            defaultValue: 'saw',
            options: ['sine', 'square', 'saw', 'triangle', 'noise'],
            automatable: true
          },
          {
            id: 'osc1Level',
            name: 'Oscillator 1 Level',
            type: 'float',
            defaultValue: 0.8,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            automatable: true
          },
          {
            id: 'filterCutoff',
            name: 'Filter Cutoff',
            type: 'float',
            defaultValue: 2000,
            minValue: 20,
            maxValue: 20000,
            unit: 'Hz',
            automatable: true
          },
          {
            id: 'filterResonance',
            name: 'Filter Resonance',
            type: 'float',
            defaultValue: 0.2,
            minValue: 0.0,
            maxValue: 0.99,
            unit: '%',
            automatable: true
          }
        ],
        presets: [
          {
            id: 'lead',
            name: 'Bright Lead',
            author: 'DAW Team',
            parameters: { osc1Wave: 'saw', osc1Level: 0.9, filterCutoff: 3000, filterResonance: 0.3 },
            tags: ['lead', 'bright']
          },
          {
            id: 'bass',
            name: 'Deep Bass',
            author: 'DAW Team',
            parameters: { osc1Wave: 'square', osc1Level: 1.0, filterCutoff: 800, filterResonance: 0.1 },
            tags: ['bass', 'deep']
          }
        ],
        entryPoint: 'builtin://synthesizer',
        dependencies: [],
        minimumVersion: '1.0.0',
        license: 'MIT',
        price: 0,
        downloadCount: 0,
        rating: 4.7,
        reviews: 0
      },
      {
        id: 'aura-808-log-drum',
        name: 'Aura 808 Log Drum',
        version: '1.0.0',
        author: 'Aura Team',
        description: 'Authentic Amapiano log drum synthesizer with AI-driven presets and hybrid synth-sampler engine',
        type: 'instrument',
        category: 'Drums',
        tags: ['808', 'log drum', 'amapiano', 'south african', 'AI'],
        icon: '🥁',
        audioInputs: 0,
        audioOutputs: 2,
        midiInputs: 1,
        midiOutputs: 0,
        parameters: [
          {
            id: 'pitch',
            name: 'Pitch',
            type: 'int',
            defaultValue: 60,
            minValue: 24,
            maxValue: 96,
            unit: 'MIDI',
            description: 'MIDI note number for the fundamental frequency',
            automatable: true
          },
          {
            id: 'glide_time',
            name: 'Glide Time',
            type: 'int',
            defaultValue: 100,
            minValue: 0,
            maxValue: 1000,
            unit: 'ms',
            description: 'Pitch glide duration for classic 808 slides',
            automatable: true
          },
          {
            id: 'knock_mix',
            name: 'Knock Mix',
            type: 'float',
            defaultValue: 0.3,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            description: 'Mix level of the high-frequency knock transient',
            automatable: true
          },
          {
            id: 'body_mix',
            name: 'Body Mix',
            type: 'float',
            defaultValue: 0.7,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            description: 'Mix level of the sub-bass body',
            automatable: true
          },
          {
            id: 'decay_time',
            name: 'Decay Time',
            type: 'int',
            defaultValue: 800,
            minValue: 50,
            maxValue: 2000,
            unit: 'ms',
            description: 'ADSR decay time',
            automatable: true
          },
          {
            id: 'attack_time',
            name: 'Attack Time',
            type: 'int',
            defaultValue: 5,
            minValue: 1,
            maxValue: 100,
            unit: 'ms',
            description: 'ADSR attack time',
            automatable: true
          },
          {
            id: 'sustain_level',
            name: 'Sustain Level',
            type: 'float',
            defaultValue: 0.3,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            description: 'ADSR sustain level',
            automatable: true
          },
          {
            id: 'release_time',
            name: 'Release Time',
            type: 'int',
            defaultValue: 1200,
            minValue: 100,
            maxValue: 3000,
            unit: 'ms',
            description: 'ADSR release time',
            automatable: true
          },
          {
            id: 'master_gain',
            name: 'Master Gain',
            type: 'float',
            defaultValue: 0.8,
            minValue: 0.0,
            maxValue: 1.0,
            unit: '%',
            description: 'Master output gain',
            automatable: true
          }
        ],
        presets: [
          {
            id: 'amapiano_classic',
            name: 'Amapiano Classic',
            author: 'Aura Team',
            description: 'Traditional Amapiano log drum sound',
            parameters: { 
              pitch: 50, 
              glide_time: 200, 
              knock_mix: 0.4, 
              body_mix: 0.8, 
              decay_time: 600,
              attack_time: 2,
              sustain_level: 0.4,
              release_time: 1000,
              master_gain: 0.8
            },
            tags: ['amapiano', 'classic', 'traditional']
          },
          {
            id: 'private_school',
            name: 'Private School',
            author: 'Aura Team',
            description: 'Tighter, punchier sound for Private School sub-genre',
            parameters: { 
              pitch: 55, 
              glide_time: 80, 
              knock_mix: 0.2, 
              body_mix: 0.9, 
              decay_time: 400,
              attack_time: 1,
              sustain_level: 0.2,
              release_time: 800,
              master_gain: 0.8
            },
            tags: ['private school', 'tight', 'punchy']
          },
          {
            id: 'deep_amapiano',
            name: 'Deep Amapiano',
            author: 'Aura Team',
            description: 'Deeper, more sustained log drum for deep Amapiano',
            parameters: { 
              pitch: 45, 
              glide_time: 300, 
              knock_mix: 0.6, 
              body_mix: 0.7, 
              decay_time: 1200,
              attack_time: 8,
              sustain_level: 0.5,
              release_time: 1800,
              master_gain: 0.8
            },
            tags: ['deep', 'sustained', 'atmospheric']
          }
        ],
        entryPoint: 'builtin://aura-808-log-drum',
        dependencies: [],
        minimumVersion: '1.0.0',
        license: 'MIT',
        price: 0,
        downloadCount: 0,
        rating: 5.0,
        reviews: 0
      }
    ];

    // Register built-in plugins with their implementations
    builtInPlugins.forEach(plugin => {
      const api = createBuiltInPluginAPI(plugin);
      pluginRegistry.registerPlugin(plugin, api);
    });

    setInstalledPlugins(builtInPlugins);
  }, []);

  const createBuiltInPluginAPI = (plugin: PluginManifest): PluginAPI => {
    const parameters: Record<string, any> = {};
    plugin.parameters.forEach(param => {
      parameters[param.id] = param.defaultValue;
    });

    return {
      createAudioNode: (context: AudioContext) => {
        if (plugin.id === 'builtin-reverb') {
          return createReverbNode(context);
        } else if (plugin.id === 'builtin-compressor') {
          return createCompressorNode(context);
        } else if (plugin.id === 'builtin-synthesizer') {
          return createSynthesizerNode(context);
        } else if (plugin.id === 'aura-808-log-drum') {
          return createAura808LogDrumNode(context);
        }
        return context.createGain(); // Fallback
      },
      
      processAudio: (inputs, outputs, params) => {
        // Built-in processing is handled by Web Audio API nodes
      },
      
      setParameter: (id: string, value: any) => {
        parameters[id] = value;
      },
      
      getParameter: (id: string) => parameters[id],
      getParameters: () => ({ ...parameters }),
      
      loadPreset: (preset: PluginPreset) => {
        Object.assign(parameters, preset.parameters);
      },
      
      savePreset: (name: string) => ({
        id: `preset_${Date.now()}`,
        name,
        author: 'User',
        parameters: { ...parameters },
        tags: []
      }),
      
      initialize: (sampleRate: number, bufferSize: number) => {
        console.log(`Initializing ${plugin.name} at ${sampleRate}Hz`);
      },
      
      cleanup: () => {
        console.log(`Cleaning up ${plugin.name}`);
      }
    };
  };

  // Create Web Audio API nodes for built-in effects
  const createReverbNode = (context: AudioContext): AudioNode => {
    const convolver = context.createConvolver();
    const wetGain = context.createGain();
    const dryGain = context.createGain();
    const outputGain = context.createGain();
    
    // Create impulse response for reverb
    const length = context.sampleRate * 2; // 2 second reverb
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
      }
    }
    
    convolver.buffer = impulse;
    
    // Set up routing
    dryGain.gain.value = 0.7;
    wetGain.gain.value = 0.3;
    
    // Create wrapper node
    const wrapper = context.createGain();
    wrapper.connect(dryGain);
    wrapper.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);
    
    return outputGain;
  };

  const createCompressorNode = (context: AudioContext): AudioNode => {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.05;
    return compressor;
  };

  const createSynthesizerNode = (context: AudioContext): AudioNode => {
    // This would be a more complex implementation
    // For now, return a gain node as placeholder
    return context.createGain();
  };

  const createAura808LogDrumNode = (context: AudioContext): AudioNode => {
    const gainNode = context.createGain();
    gainNode.gain.value = 0.8;
    
    // Add some basic filtering for the 808 character
    const filterNode = context.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 8000;
    filterNode.Q.value = 1;
    
    filterNode.connect(gainNode);
    
    // Return the filter as the input node, gain as output
    (gainNode as any).inputNode = filterNode;
    return gainNode;
  };

  // Plugin management functions
  const createPluginInstance = useCallback((pluginId: string, trackId: string): string | null => {
    const instance = pluginRegistry.createInstance(pluginId, trackId);
    if (!instance) return null;

    setPluginInstances(prev => {
      const updated = new Map(prev);
      const trackInstances = updated.get(trackId) || [];
      updated.set(trackId, [...trackInstances, instance]);
      return updated;
    });

    return instance.id;
  }, []);

  const removePluginInstance = useCallback((instanceId: string): boolean => {
    const instance = pluginRegistry.getInstance(instanceId);
    if (!instance) return false;

    const success = pluginRegistry.removeInstance(instanceId);
    if (success) {
      setPluginInstances(prev => {
        const updated = new Map(prev);
        const trackInstances = updated.get(instance.trackId) || [];
        updated.set(instance.trackId, trackInstances.filter(inst => inst.id !== instanceId));
        return updated;
      });
    }

    return success;
  }, []);

  const updatePluginParameter = useCallback((instanceId: string, parameterId: string, value: any): boolean => {
    const success = pluginRegistry.updateParameter(instanceId, parameterId, value);
    if (success) {
      // Update local state
      setPluginInstances(prev => {
        const updated = new Map(prev);
        for (const [trackId, instances] of updated.entries()) {
          const updatedInstances = instances.map(inst => 
            inst.id === instanceId 
              ? { ...inst, parameters: { ...inst.parameters, [parameterId]: value } }
              : inst
          );
          updated.set(trackId, updatedInstances);
        }
        return updated;
      });
    }
    return success;
  }, []);

  const getTrackPlugins = useCallback((trackId: string): PluginInstance[] => {
    return pluginInstances.get(trackId) || [];
  }, [pluginInstances]);

  const searchMarketplace = useCallback(async (query: string, filters?: PluginFilters): Promise<PluginManifest[]> => {
    setIsLoading(true);
    try {
      // This would query a real marketplace API
      const mockResults = availablePlugins.filter(plugin => 
        plugin.name.toLowerCase().includes(query.toLowerCase()) ||
        plugin.description.toLowerCase().includes(query.toLowerCase()) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      
      return mockResults;
    } finally {
      setIsLoading(false);
    }
  }, [availablePlugins]);

  const installPlugin = useCallback(async (pluginManifest: PluginManifest): Promise<void> => {
    setIsLoading(true);
    try {
      // In a real implementation, this would download and install the plugin
      const api = createBuiltInPluginAPI(pluginManifest); // Placeholder
      pluginRegistry.registerPlugin(pluginManifest, api);
      
      setInstalledPlugins(prev => [...prev, pluginManifest]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    installedPlugins,
    pluginInstances,
    availablePlugins,
    isLoading,
    
    // Plugin management
    createPluginInstance,
    removePluginInstance,
    updatePluginParameter,
    getTrackPlugins,
    
    // Marketplace
    searchMarketplace,
    installPlugin,
    
    // Registry access
    getPlugin: (id: string) => pluginRegistry.getPlugin(id),
    getPluginAPI: (id: string) => pluginRegistry.getPluginAPI(id)
  };
}