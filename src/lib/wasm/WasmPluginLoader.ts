/**
 * WASM Plugin Loader
 * Loads and instantiates compiled WASM audio plugins
 */

export interface WasmPluginInstance {
  id: string;
  name: string;
  wasmModule: WebAssembly.Module;
  wasmInstance: WebAssembly.Instance;
  audioNode: AudioWorkletNode | null;
  parameters: Map<string, number>;
  manifest: any;
}

export interface WasmLoadResult {
  success: boolean;
  instance?: WasmPluginInstance;
  error?: string;
}

export class WasmPluginLoader {
  private static instance: WasmPluginLoader;
  private loadedPlugins: Map<string, WasmPluginInstance> = new Map();
  private audioContext: AudioContext | null = null;

  private constructor() {}

  static getInstance(): WasmPluginLoader {
    if (!WasmPluginLoader.instance) {
      WasmPluginLoader.instance = new WasmPluginLoader();
    }
    return WasmPluginLoader.instance;
  }

  async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
    
    try {
      // Load AudioWorklet processor for WASM plugins
      await audioContext.audioWorklet.addModule('/audio-dsp-processor.worklet.js');
      console.log('[WasmPluginLoader] AudioWorklet loaded successfully');
    } catch (error) {
      console.error('[WasmPluginLoader] Failed to load AudioWorklet:', error);
      throw error;
    }
  }

  async loadPlugin(
    pluginName: string,
    wasmBinary: Uint8Array,
    manifest: any
  ): Promise<WasmLoadResult> {
    try {
      console.log(`[WasmPluginLoader] Loading plugin: ${pluginName}`);

      // Compile WASM module
      const wasmModule = await WebAssembly.compile(wasmBinary as BufferSource);
      
      // Create imports for WASM module
      const imports = this.createWasmImports();
      
      // Instantiate WASM module
      const wasmInstance = await WebAssembly.instantiate(wasmModule, imports);

      // Create plugin instance
      const instance: WasmPluginInstance = {
        id: crypto.randomUUID(),
        name: pluginName,
        wasmModule,
        wasmInstance,
        audioNode: null,
        parameters: new Map(),
        manifest
      };

      // Initialize parameters from manifest
      if (manifest.parameters) {
        manifest.parameters.forEach((param: any) => {
          instance.parameters.set(param.id, param.defaultValue || 0);
        });
      }

      // Create AudioWorklet node
      if (this.audioContext) {
        instance.audioNode = await this.createAudioNode(instance);
      }

      // Store instance
      this.loadedPlugins.set(instance.id, instance);

      console.log(`[WasmPluginLoader] Plugin loaded successfully:`, {
        id: instance.id,
        name: pluginName,
        parameters: Array.from(instance.parameters.keys())
      });

      return { success: true, instance };

    } catch (error) {
      console.error(`[WasmPluginLoader] Failed to load plugin:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private createWasmImports(): WebAssembly.Imports {
    return {
      env: {
        // Math functions
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        exp: Math.exp,
        log: Math.log,
        pow: Math.pow,
        sqrt: Math.sqrt,
        
        // Memory allocation (simplified)
        malloc: (size: number) => {
          console.warn('[WASM] malloc called, returning 0');
          return 0;
        },
        free: (ptr: number) => {
          // No-op for now
        },
        
        // Console logging
        consoleLog: (ptr: number) => {
          console.log('[WASM Plugin]:', ptr);
        }
      }
    };
  }

  private async createAudioNode(instance: WasmPluginInstance): Promise<AudioWorkletNode> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const node = new AudioWorkletNode(this.audioContext, 'dsp-processor', {
      processorOptions: {
        pluginType: instance.manifest.type || 'effect',
        parameters: Object.fromEntries(instance.parameters)
      }
    });

    // Set up parameter automation
    node.port.onmessage = (event) => {
      if (event.data.type === 'parameter-changed') {
        instance.parameters.set(event.data.id, event.data.value);
      }
    };

    return node;
  }

  setParameter(instanceId: string, parameterId: string, value: number): void {
    const instance = this.loadedPlugins.get(instanceId);
    if (!instance) {
      console.warn(`[WasmPluginLoader] Plugin instance not found: ${instanceId}`);
      return;
    }

    instance.parameters.set(parameterId, value);

    if (instance.audioNode) {
      instance.audioNode.port.postMessage({
        type: 'setParameter',
        id: parameterId,
        value
      });
    }
  }

  getParameter(instanceId: string, parameterId: string): number | undefined {
    const instance = this.loadedPlugins.get(instanceId);
    return instance?.parameters.get(parameterId);
  }

  getInstance(instanceId: string): WasmPluginInstance | undefined {
    return this.loadedPlugins.get(instanceId);
  }

  async unloadPlugin(instanceId: string): Promise<void> {
    const instance = this.loadedPlugins.get(instanceId);
    if (!instance) return;

    // Disconnect audio node
    if (instance.audioNode) {
      instance.audioNode.disconnect();
      instance.audioNode = null;
    }

    // Remove from map
    this.loadedPlugins.delete(instanceId);

    console.log(`[WasmPluginLoader] Plugin unloaded: ${instanceId}`);
  }

  getLoadedPlugins(): WasmPluginInstance[] {
    return Array.from(this.loadedPlugins.values());
  }

  async processAudio(
    instanceId: string,
    inputBuffer: Float32Array
  ): Promise<Float32Array> {
    const instance = this.loadedPlugins.get(instanceId);
    if (!instance) {
      throw new Error(`Plugin instance not found: ${instanceId}`);
    }

    // For now, return input buffer
    // In production, this would call WASM process function
    return inputBuffer;
  }

  dispose(): void {
    this.loadedPlugins.forEach((instance, id) => {
      this.unloadPlugin(id);
    });
    this.loadedPlugins.clear();
    this.audioContext = null;
  }
}

export const wasmPluginLoader = WasmPluginLoader.getInstance();
