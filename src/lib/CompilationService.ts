import { supabase } from '@/integrations/supabase/client';

export interface CompilationRequest {
  code: string;
  pluginName: string;
  pluginType: 'instrument' | 'effect' | 'utility';
  framework: 'juce' | 'web-audio';
  parameters: any[];
  targets: ('wasm' | 'vst3' | 'au')[];
}

export interface CompilationResult {
  success: boolean;
  pluginName: string;
  binaries: {
    wasm?: Uint8Array;
    vst3?: Uint8Array;
    au?: Uint8Array;
  };
  manifest: any;
  logs: string[];
  warnings: string[];
  errors: string[];
  performanceMetrics?: {
    compilationTime: number;
    wasmSize?: number;
    vst3Size?: number;
    auSize?: number;
  };
}

export class CompilationService {
  private static instance: CompilationService;

  private constructor() {}

  static getInstance(): CompilationService {
    if (!CompilationService.instance) {
      CompilationService.instance = new CompilationService();
    }
    return CompilationService.instance;
  }

  async compilePlugin(request: CompilationRequest): Promise<CompilationResult> {
    const startTime = performance.now();

    console.log('[CompilationService] Starting real compilation:', request.pluginName);

    try {
      const { data, error } = await supabase.functions.invoke('compile-cpp-plugin', {
        body: request
      });

      if (error) {
        throw new Error(`Compilation service error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(`Compilation failed: ${data.errors.join(', ')}`);
      }

      // Convert base64 binaries back to Uint8Array
      const result: CompilationResult = {
        success: data.success,
        pluginName: data.pluginName,
        binaries: {},
        manifest: data.manifest,
        logs: data.logs,
        warnings: data.warnings,
        errors: data.errors,
        performanceMetrics: {
          compilationTime: performance.now() - startTime
        }
      };

      // Convert binary data
      if (data.binaries.wasm) {
        result.binaries.wasm = this.base64ToUint8Array(data.binaries.wasm);
        result.performanceMetrics!.wasmSize = result.binaries.wasm.length;
      }
      if (data.binaries.vst3) {
        result.binaries.vst3 = this.base64ToUint8Array(data.binaries.vst3);
        result.performanceMetrics!.vst3Size = result.binaries.vst3.length;
      }
      if (data.binaries.au) {
        result.binaries.au = this.base64ToUint8Array(data.binaries.au);
        result.performanceMetrics!.auSize = result.binaries.au.length;
      }

      console.log('[CompilationService] Compilation successful:', {
        pluginName: result.pluginName,
        formats: Object.keys(result.binaries),
        totalTime: result.performanceMetrics.compilationTime.toFixed(2) + 'ms'
      });

      return result;

    } catch (error) {
      console.error('[CompilationService] Compilation failed:', error);
      
      return {
        success: false,
        pluginName: request.pluginName,
        binaries: {},
        manifest: null,
        logs: ['❌ Compilation failed'],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        performanceMetrics: {
          compilationTime: performance.now() - startTime
        }
      };
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    // Handle both regular strings and base64
    if (typeof base64 === 'object') {
      return new Uint8Array(Object.values(base64));
    }
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async validateCode(code: string, framework: string): Promise<string[]> {
    const errors: string[] = [];

    if (!code.trim()) {
      errors.push('Code cannot be empty');
      return errors;
    }

    if (framework === 'juce') {
      // Basic JUCE validation
      if (!code.includes('juce::')) {
        errors.push('JUCE code must include juce:: namespace');
      }
      if (!code.includes('processBlock')) {
        errors.push('JUCE plugin must implement processBlock method');
      }
    }

    return errors;
  }

  createManifestBlob(manifest: any): Blob {
    return new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json'
    });
  }

  downloadBinary(binary: Uint8Array, filename: string) {
    const blob = new Blob([new Uint8Array(binary)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadManifest(manifest: any, pluginName: string) {
    const blob = this.createManifestBlob(manifest);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pluginName}-manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const compilationService = CompilationService.getInstance();
