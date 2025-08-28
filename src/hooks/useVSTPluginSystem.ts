import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Declare Web Audio API types for AudioWorklet
declare global {
  interface AudioWorkletProcessor {
    readonly port: MessagePort;
    process(
      inputs: Float32Array[][],
      outputs: Float32Array[][],
      parameters: Record<string, Float32Array>
    ): boolean;
  }

  const AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new (options?: any): AudioWorkletProcessor;
  };

  function registerProcessor(
    name: string,
    processorCtor: new (options?: any) => AudioWorkletProcessor
  ): void;

  const currentFrame: number;
  const sampleRate: number;
}

export interface VSTPluginManifest {
  id: string;
  name: string;
  vendor: string;
  version: string;
  type: 'VST2' | 'VST3' | 'AU' | 'CLAP';
  format: 'instrument' | 'effect';
  latency: number;
  parameters: VSTParameter[];
  presets: VSTPreset[];
  category: string;
  description: string;
  website?: string;
  price?: number;
  rating?: number;
  downloads?: number;
  tags: string[];
  screenshots?: string[];
  pluginPath?: string;
  isNative: boolean;
  supportsWebAudio: boolean;
}

export interface VSTParameter {
  id: string;
  name: string;
  label: string;
  type: 'float' | 'int' | 'bool' | 'enum' | 'string';
  min?: number;
  max?: number;
  default: any;
  unit?: string;
  options?: string[];
  automatable: boolean;
  displayFormat?: 'percentage' | 'db' | 'hz' | 'seconds' | 'raw';
}

export interface VSTPreset {
  id: string;
  name: string;
  author: string;
  category: string;
  parameters: Record<string, any>;
  tags: string[];
}

export interface VSTPluginInstance {
  id: string;
  pluginId: string;
  trackId: string;
  name: string;
  parameters: Record<string, any>;
  preset?: VSTPreset;
  isActive: boolean;
  isBypassed: boolean;
  processingLatency: number;
  audioNode?: AudioNode;
  processor?: AudioWorkletNode;
}

export interface VSTStore {
  plugins: VSTPluginManifest[];
  featured: string[];
  categories: string[];
  vendors: string[];
}

// Mock VST/AU plugin registry
const createMockVSTPlugins = (): VSTPluginManifest[] => [
  {
    id: 'serum-wavetable',
    name: 'Serum',
    vendor: 'Xfer Records',
    version: '1.36b7',
    type: 'VST3',
    format: 'instrument',
    latency: 64,
    category: 'Synthesizer',
    description: 'Advanced wavetable synthesizer with high-quality sound generation',
    website: 'https://xferrecords.com/products/serum',
    price: 189,
    rating: 4.9,
    downloads: 2500000,
    tags: ['wavetable', 'synthesizer', 'electronic', 'bass', 'lead'],
    screenshots: ['/vst-screenshots/serum-1.jpg', '/vst-screenshots/serum-2.jpg'],
    isNative: false,
    supportsWebAudio: true,
    parameters: [
      {
        id: 'osc1-wavetable',
        name: 'Oscillator 1 Wavetable',
        label: 'OSC1 Wavetable',
        type: 'enum',
        options: ['Basic Shapes', 'Analog', 'Digital', 'Formant', 'Mallets'],
        default: 'Basic Shapes',
        automatable: true
      },
      {
        id: 'filter-cutoff',
        name: 'Filter Cutoff',
        label: 'Cutoff',
        type: 'float',
        min: 20,
        max: 20000,
        default: 1000,
        unit: 'Hz',
        automatable: true,
        displayFormat: 'hz'
      },
      {
        id: 'filter-resonance',
        name: 'Filter Resonance',
        label: 'Resonance',
        type: 'float',
        min: 0,
        max: 100,
        default: 10,
        unit: '%',
        automatable: true,
        displayFormat: 'percentage'
      }
    ],
    presets: [
      {
        id: 'serum-lead-1',
        name: 'Bright Lead',
        author: 'Xfer Records',
        category: 'Lead',
        parameters: { 'filter-cutoff': 3000, 'filter-resonance': 25 },
        tags: ['lead', 'bright', 'electronic']
      }
    ]
  },
  {
    id: 'fabfilter-pro-q3',
    name: 'FabFilter Pro-Q 3',
    vendor: 'FabFilter',
    version: '3.24',
    type: 'VST3',
    format: 'effect',
    latency: 32,
    category: 'EQ',
    description: 'Professional equalizer with dynamic EQ, spectrum analyzer and linear phase',
    website: 'https://www.fabfilter.com/products/pro-q-3-equalizer-plug-in',
    price: 179,
    rating: 4.8,
    downloads: 1800000,
    tags: ['eq', 'equalizer', 'mixing', 'mastering', 'professional'],
    screenshots: ['/vst-screenshots/pro-q3-1.jpg'],
    isNative: false,
    supportsWebAudio: true,
    parameters: [
      {
        id: 'band1-freq',
        name: 'Band 1 Frequency',
        label: 'Band 1 Freq',
        type: 'float',
        min: 20,
        max: 20000,
        default: 100,
        unit: 'Hz',
        automatable: true,
        displayFormat: 'hz'
      },
      {
        id: 'band1-gain',
        name: 'Band 1 Gain',
        label: 'Band 1 Gain',
        type: 'float',
        min: -18,
        max: 18,
        default: 0,
        unit: 'dB',
        automatable: true,
        displayFormat: 'db'
      }
    ],
    presets: [
      {
        id: 'vocal-clarity',
        name: 'Vocal Clarity',
        author: 'FabFilter',
        category: 'Vocal',
        parameters: { 'band1-freq': 2500, 'band1-gain': 2.5 },
        tags: ['vocal', 'clarity', 'mixing']
      }
    ]
  },
  {
    id: 'massive-x',
    name: 'Massive X',
    vendor: 'Native Instruments',
    version: '1.4.1',
    type: 'VST3',
    format: 'instrument',
    latency: 128,
    category: 'Synthesizer',
    description: 'Advanced synthesizer with wavetable and granular synthesis',
    website: 'https://www.native-instruments.com/en/products/komplete/synths/massive-x/',
    price: 199,
    rating: 4.7,
    downloads: 1200000,
    tags: ['synthesizer', 'wavetable', 'granular', 'bass', 'leads'],
    isNative: false,
    supportsWebAudio: true,
    parameters: [
      {
        id: 'osc1-wavetable',
        name: 'Oscillator 1 Wavetable',
        label: 'OSC1 Wavetable',
        type: 'enum',
        options: ['Scanned', 'Additive', 'Bend+', 'Formant I', 'Gorilla'],
        default: 'Scanned',
        automatable: true
      }
    ],
    presets: []
  }
];

// Web Audio API VST Plugin Processor
class VSTPluginProcessor extends AudioWorkletProcessor {
  private parameters: Map<string, any> = new Map();
  private manifest: VSTPluginManifest | null = null;

  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'init':
        this.manifest = data.manifest;
        this.initializePlugin();
        break;
      case 'updateParameter':
        this.parameters.set(data.parameterId, data.value);
        break;
      case 'loadPreset':
        this.loadPreset(data.preset);
        break;
    }
  }

  private initializePlugin() {
    if (!this.manifest) return;
    
    // Initialize default parameters
    this.manifest.parameters.forEach(param => {
      this.parameters.set(param.id, param.default);
    });
  }

  private loadPreset(preset: VSTPreset) {
    Object.entries(preset.parameters).forEach(([paramId, value]) => {
      this.parameters.set(paramId, value);
    });
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !output) return true;
    
    // Simple passthrough with basic processing simulation
    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      if (inputChannel && outputChannel) {
        for (let i = 0; i < outputChannel.length; i++) {
          // Apply basic processing based on plugin type
          let sample = inputChannel[i];
          
          if (this.manifest?.format === 'effect') {
            // Basic EQ simulation
            const gain = this.parameters.get('band1-gain') || 0;
            sample *= Math.pow(10, gain / 20);
          } else if (this.manifest?.format === 'instrument') {
            // Basic oscillator simulation for instruments
            const freq = this.parameters.get('filter-cutoff') || 440;
            const time = (typeof currentFrame !== 'undefined' ? currentFrame : 0) / (typeof sampleRate !== 'undefined' ? sampleRate : 44100);
            sample = Math.sin(2 * Math.PI * freq * time) * 0.1;
          }
          
          outputChannel[i] = sample;
        }
      }
    }
    
    return true;
  }
}

// Register the processor
if (typeof AudioWorkletProcessor !== 'undefined') {
  registerProcessor('vst-plugin-processor', VSTPluginProcessor);
}

export function useVSTPluginSystem(audioContext: AudioContext | null) {
  const [availablePlugins, setAvailablePlugins] = useState<VSTPluginManifest[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<VSTPluginManifest[]>([]);
  const [pluginInstances, setPluginInstances] = useState<Map<string, VSTPluginInstance[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [store, setStore] = useState<VSTStore | null>(null);
  
  const processorNodesRef = useRef<Map<string, AudioWorkletNode>>(new Map());

  // Initialize VST system
  useEffect(() => {
    const initVSTSystem = async () => {
      try {
        setIsLoading(true);
        
        // Load mock plugins
        const mockPlugins = createMockVSTPlugins();
        setAvailablePlugins(mockPlugins);
        
        // Set up mock store
        setStore({
          plugins: mockPlugins,
          featured: ['serum-wavetable', 'fabfilter-pro-q3'],
          categories: ['Synthesizer', 'EQ', 'Compressor', 'Reverb', 'Delay'],
          vendors: ['Xfer Records', 'FabFilter', 'Native Instruments', 'Waves', 'Plugin Alliance']
        });
        
        // Load AudioWorklet processor if available
        if (audioContext && audioContext.state !== 'closed') {
          try {
            await audioContext.audioWorklet.addModule('/vst-plugin-processor.js');
          } catch (error) {
            console.warn('Failed to load VST processor worklet:', error);
          }
        }
        
      } catch (error) {
        console.error('Failed to initialize VST system:', error);
        toast.error('Failed to initialize VST plugin system');
      } finally {
        setIsLoading(false);
      }
    };

    initVSTSystem();
  }, [audioContext]);

  const scanForVSTPlugins = useCallback(async (): Promise<VSTPluginManifest[]> => {
    setIsLoading(true);
    try {
      // In a real implementation, this would scan VST directories
      // For now, return mock plugins
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate scan time
      
      const scannedPlugins = createMockVSTPlugins().slice(0, 2);
      setInstalledPlugins(prev => {
        const existing = new Set(prev.map(p => p.id));
        const newPlugins = scannedPlugins.filter(p => !existing.has(p.id));
        return [...prev, ...newPlugins];
      });
      
      toast.success(`Found ${scannedPlugins.length} VST/AU plugins`);
      return scannedPlugins;
    } catch (error) {
      console.error('VST scan failed:', error);
      toast.error('Failed to scan for VST plugins');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createVSTInstance = useCallback(async (
    pluginId: string, 
    trackId: string, 
    inputGain?: GainNode
  ): Promise<string | null> => {
    if (!audioContext) return null;
    
    const plugin = availablePlugins.find(p => p.id === pluginId) || 
                  installedPlugins.find(p => p.id === pluginId);
    
    if (!plugin) {
      toast.error(`Plugin ${pluginId} not found`);
      return null;
    }

    try {
      const instanceId = `vst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create processor node
      let processor: AudioWorkletNode | null = null;
      
      if (plugin.supportsWebAudio) {
        try {
          processor = new AudioWorkletNode(audioContext, 'vst-plugin-processor');
          
          // Initialize the processor
          processor.port.postMessage({
            type: 'init',
            data: { manifest: plugin }
          });
          
          // Connect to input if provided
          if (inputGain) {
            inputGain.connect(processor);
          }
          
          processorNodesRef.current.set(instanceId, processor);
        } catch (error) {
          console.warn('Failed to create AudioWorklet processor, using fallback:', error);
        }
      }
      
      // Create instance
      const instance: VSTPluginInstance = {
        id: instanceId,
        pluginId,
        trackId,
        name: `${plugin.name} Instance`,
        parameters: plugin.parameters.reduce((acc, param) => {
          acc[param.id] = param.default;
          return acc;
        }, {} as Record<string, any>),
        isActive: true,
        isBypassed: false,
        processingLatency: plugin.latency,
        audioNode: processor || undefined,
        processor: processor || undefined
      };
      
      // Add to instances
      setPluginInstances(prev => {
        const updated = new Map(prev);
        const trackInstances = updated.get(trackId) || [];
        updated.set(trackId, [...trackInstances, instance]);
        return updated;
      });
      
      toast.success(`${plugin.name} loaded successfully`);
      return instanceId;
    } catch (error) {
      console.error('Failed to create VST instance:', error);
      toast.error(`Failed to load ${plugin.name}`);
      return null;
    }
  }, [audioContext, availablePlugins, installedPlugins]);

  const removeVSTInstance = useCallback((instanceId: string): boolean => {
    try {
      // Clean up audio nodes
      const processor = processorNodesRef.current.get(instanceId);
      if (processor) {
        processor.disconnect();
        processorNodesRef.current.delete(instanceId);
      }
      
      // Remove from instances
      setPluginInstances(prev => {
        const updated = new Map(prev);
        for (const [trackId, instances] of updated.entries()) {
          const filtered = instances.filter(inst => inst.id !== instanceId);
          if (filtered.length === 0) {
            updated.delete(trackId);
          } else {
            updated.set(trackId, filtered);
          }
        }
        return updated;
      });
      
      return true;
    } catch (error) {
      console.error('Failed to remove VST instance:', error);
      return false;
    }
  }, []);

  const updateVSTParameter = useCallback((instanceId: string, parameterId: string, value: any): boolean => {
    try {
      // Update processor
      const processor = processorNodesRef.current.get(instanceId);
      if (processor) {
        processor.port.postMessage({
          type: 'updateParameter',
          data: { parameterId, value }
        });
      }
      
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
      
      return true;
    } catch (error) {
      console.error('Failed to update VST parameter:', error);
      return false;
    }
  }, []);

  const loadVSTPreset = useCallback((instanceId: string, preset: VSTPreset): boolean => {
    try {
      // Update processor
      const processor = processorNodesRef.current.get(instanceId);
      if (processor) {
        processor.port.postMessage({
          type: 'loadPreset',
          data: { preset }
        });
      }
      
      // Update local state
      setPluginInstances(prev => {
        const updated = new Map(prev);
        for (const [trackId, instances] of updated.entries()) {
          const updatedInstances = instances.map(inst => 
            inst.id === instanceId 
              ? { 
                  ...inst, 
                  preset,
                  parameters: { ...inst.parameters, ...preset.parameters }
                }
              : inst
          );
          updated.set(trackId, updatedInstances);
        }
        return updated;
      });
      
      toast.success(`Loaded preset: ${preset.name}`);
      return true;
    } catch (error) {
      console.error('Failed to load VST preset:', error);
      toast.error('Failed to load preset');
      return false;
    }
  }, []);

  const getTrackVSTPlugins = useCallback((trackId: string): VSTPluginInstance[] => {
    return pluginInstances.get(trackId) || [];
  }, [pluginInstances]);

  const downloadPlugin = useCallback(async (pluginId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const plugin = availablePlugins.find(p => p.id === pluginId);
      if (!plugin) return false;
      
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setInstalledPlugins(prev => [...prev, plugin]);
      toast.success(`${plugin.name} downloaded and installed successfully`);
      return true;
    } catch (error) {
      console.error('Failed to download plugin:', error);
      toast.error('Failed to download plugin');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [availablePlugins]);

  return {
    // State
    availablePlugins,
    installedPlugins,
    pluginInstances,
    store,
    isLoading,
    
    // Actions
    scanForVSTPlugins,
    createVSTInstance,
    removeVSTInstance,
    updateVSTParameter,
    loadVSTPreset,
    getTrackVSTPlugins,
    downloadPlugin,
    
    // Utils
    getVSTPlugin: useCallback((id: string) => 
      availablePlugins.find(p => p.id === id) || installedPlugins.find(p => p.id === id), 
      [availablePlugins, installedPlugins]
    )
  };
}