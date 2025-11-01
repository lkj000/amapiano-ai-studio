import { useState, useCallback } from 'react';
import { compilationService, type CompilationRequest } from '@/lib/CompilationService';

interface CompilerOptions {
  code: string;
  framework: 'juce' | 'web-audio' | 'custom';
  pluginType: 'instrument' | 'effect' | 'utility';
  parameters: any[];
  useWASM: boolean;
}

interface CompilationResult {
  success: boolean;
  binary?: ArrayBuffer;
  vst3Binary?: ArrayBuffer;
  auBinary?: ArrayBuffer;
  errors: string[];
  warnings: string[];
  compilationTime: number;
  performance: string;
  manifest?: PluginManifest;
}

interface PluginManifest {
  name: string;
  version: string;
  manufacturer: string;
  pluginType: string;
  category: string;
  uid: string;
  parameters: Array<{
    id: string;
    name: string;
    type: string;
    defaultValue: any;
    min?: number;
    max?: number;
    unit?: string;
  }>;
}

export function usePluginCompiler(audioContext: AudioContext | null) {
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastResult, setLastResult] = useState<CompilationResult | null>(null);

  const compile = useCallback(async (options: CompilerOptions): Promise<CompilationResult> => {
    setIsCompiling(true);
    const startTime = performance.now();

    try {
      console.log('[usePluginCompiler] Starting REAL compilation...');
      
      // Validate code first
      const validationErrors = await compilationService.validateCode(
        options.code, 
        options.framework
      );
      
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          warnings: [],
          compilationTime: performance.now() - startTime,
          performance: 'N/A'
        };
      }

      // Prepare compilation request
      const request: CompilationRequest = {
        code: options.code,
        pluginName: 'MyPlugin',
        pluginType: options.pluginType,
        framework: options.framework === 'custom' ? 'juce' : options.framework,
        parameters: options.parameters,
        targets: ['wasm', 'vst3', 'au']
      };

      // Call real compilation service
      const serviceResult = await compilationService.compilePlugin(request);

      // Convert to hook result format
      const result: CompilationResult = {
        success: serviceResult.success,
        binary: serviceResult.binaries.wasm ? serviceResult.binaries.wasm.buffer as ArrayBuffer : undefined,
        vst3Binary: serviceResult.binaries.vst3 ? serviceResult.binaries.vst3.buffer as ArrayBuffer : undefined,
        auBinary: serviceResult.binaries.au ? serviceResult.binaries.au.buffer as ArrayBuffer : undefined,
        errors: serviceResult.errors,
        warnings: serviceResult.warnings,
        compilationTime: serviceResult.performanceMetrics?.compilationTime || 0,
        performance: options.useWASM ? 'Professional Grade' : 'Standard',
        manifest: serviceResult.manifest
      };

      setLastResult(result);
      console.log('[usePluginCompiler] Compilation complete:', result.success);
      return result;

    } catch (error: any) {
      console.error('[usePluginCompiler] Compilation error:', error);
      return {
        success: false,
        errors: [error.message || 'Compilation failed'],
        warnings: [],
        compilationTime: performance.now() - startTime,
        performance: 'N/A'
      };
    } finally {
      setIsCompiling(false);
    }
  }, [audioContext]);

  const compileJUCEToWASM = useCallback(async (juceCode: string): Promise<CompilationResult> => {
    console.log('[usePluginCompiler] Compiling JUCE to WASM...');
    
    return compile({
      code: juceCode,
      framework: 'juce',
      pluginType: 'effect',
      parameters: [],
      useWASM: true
    });
  }, [compile]);

  const validateCode = useCallback((code: string, framework: string): string[] => {
    const errors: string[] = [];
    
    if (!code.trim()) {
      errors.push('Empty code');
      return errors;
    }

    // Basic syntax validation
    try {
      if (framework === 'web-audio') {
        // Check for basic JavaScript syntax
        new Function(code);
      }
    } catch (e: any) {
      errors.push(`Syntax error: ${e.message}`);
    }

    return errors;
  }, []);

  return {
    compile,
    compileJUCEToWASM,
    validateCode,
    isCompiling,
    lastResult
  };
}
