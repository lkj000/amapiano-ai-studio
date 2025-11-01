import { useState, useEffect, useCallback } from 'react';
import { wasmPluginLoader, WasmPluginInstance, WasmLoadResult } from '@/lib/wasm/WasmPluginLoader';
import { useRealTimeAudioEngine } from './useRealTimeAudioEngine';

export function useWasmPluginLoader() {
  const { audioContext, isInitialized } = useRealTimeAudioEngine();
  const [isLoaderReady, setIsLoaderReady] = useState(false);
  const [loadedPlugins, setLoadedPlugins] = useState<WasmPluginInstance[]>([]);

  useEffect(() => {
    const initLoader = async () => {
      if (isInitialized && audioContext) {
        try {
          await wasmPluginLoader.initialize(audioContext);
          setIsLoaderReady(true);
        } catch (error) {
          console.error('[useWasmPluginLoader] Initialization failed:', error);
        }
      }
    };

    initLoader();
  }, [isInitialized, audioContext]);

  const loadPlugin = useCallback(async (
    pluginName: string,
    wasmBinary: Uint8Array,
    manifest: any
  ): Promise<WasmLoadResult> => {
    if (!isLoaderReady) {
      return {
        success: false,
        error: 'WASM loader not initialized'
      };
    }

    const result = await wasmPluginLoader.loadPlugin(pluginName, wasmBinary, manifest);
    
    if (result.success) {
      setLoadedPlugins(wasmPluginLoader.getLoadedPlugins());
    }

    return result;
  }, [isLoaderReady]);

  const unloadPlugin = useCallback(async (instanceId: string) => {
    await wasmPluginLoader.unloadPlugin(instanceId);
    setLoadedPlugins(wasmPluginLoader.getLoadedPlugins());
  }, []);

  const setParameter = useCallback((
    instanceId: string,
    parameterId: string,
    value: number
  ) => {
    wasmPluginLoader.setParameter(instanceId, parameterId, value);
  }, []);

  const getParameter = useCallback((
    instanceId: string,
    parameterId: string
  ): number | undefined => {
    return wasmPluginLoader.getParameter(instanceId, parameterId);
  }, []);

  const getInstance = useCallback((instanceId: string): WasmPluginInstance | undefined => {
    return wasmPluginLoader.getInstance(instanceId);
  }, []);

  return {
    isLoaderReady,
    loadedPlugins,
    loadPlugin,
    unloadPlugin,
    setParameter,
    getParameter,
    getInstance
  };
}
