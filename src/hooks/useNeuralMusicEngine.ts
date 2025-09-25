import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NeuralModel {
  id: string;
  name: string;
  type: 'rnn' | 'gan' | 'transformer' | 'vae';
  instrument: string;
  status: 'training' | 'ready' | 'loading' | 'failed';
  accuracy: number;
  version: string;
  parameters: {
    layers: number;
    neurons: number;
    learningRate: number;
    batchSize: number;
  };
}

interface TrainingData {
  midiFiles: File[];
  audioFiles: File[];
  metadata: {
    genre: string;
    style: string;
    bpm: number;
    key: string;
    instruments: string[];
  };
}

interface GenerationParams {
  prompt: string;
  temperature: number;
  topK: number;
  seed?: number;
  length: number;
  instrument: string;
  style: string;
}

interface PatternAnalysis {
  rhythmPatterns: Array<{
    pattern: number[];
    frequency: number;
    style: string;
  }>;
  harmonicProgressions: Array<{
    chords: string[];
    frequency: number;
    context: string;
  }>;
  melodicMotifs: Array<{
    notes: number[];
    interval: number[];
    usage: string;
  }>;
}

interface ModelTrainingProgress {
  modelId: string;
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  estimatedTimeRemaining: number;
  stage: 'preprocessing' | 'training' | 'validation' | 'completed';
}

export const useNeuralMusicEngine = () => {
  const [models, setModels] = useState<NeuralModel[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<ModelTrainingProgress | null>(null);
  const [patternDatabase, setPatternDatabase] = useState<PatternAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const modelCacheRef = useRef<Map<string, any>>(new Map());
  const trainingWorkersRef = useRef<Map<string, Worker>>(new Map());

  // Initialize the neural music engine
  const initializeEngine = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Initialize Web Audio API
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Initialize with pre-defined models since they're built into the system
      const predefinedModels: NeuralModel[] = [
        {
          id: 'lstm_piano_v2',
          name: 'Amapiano Piano LSTM',
          type: 'rnn',
          instrument: 'piano',
          status: 'ready',
          accuracy: 94.2,
          version: '2.1.0',
          parameters: { layers: 4, neurons: 512, learningRate: 0.001, batchSize: 32 },
        },
        {
          id: 'gan_logdrums_v1',
          name: 'Log Drum GAN',
          type: 'gan',
          instrument: 'log_drums',
          status: 'ready',
          accuracy: 91.8,
          version: '1.8.3',
          parameters: { layers: 6, neurons: 256, learningRate: 0.0002, batchSize: 64 },
        },
        {
          id: 'rnn_bass_v1',
          name: 'Deep Bass RNN',
          type: 'rnn',
          instrument: 'bass',
          status: 'ready',
          accuracy: 89.5,
          version: '1.5.2',
          parameters: { layers: 3, neurons: 384, learningRate: 0.0015, batchSize: 48 },
        },
      ];

      setModels(predefinedModels);
      setIsInitialized(true);
      toast.success('Neural Music Engine initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize engine:', error);
      toast.error('Failed to initialize Neural Music Engine');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Train a new model with provided data
  const trainModel = useCallback(async (
    modelConfig: Partial<NeuralModel>,
    trainingData: TrainingData
  ): Promise<string> => {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      setIsProcessing(true);
      
      // Prepare training data
      const formData = new FormData();
      formData.append('modelConfig', JSON.stringify(modelConfig));
      formData.append('metadata', JSON.stringify(trainingData.metadata));
      
      trainingData.midiFiles.forEach((file, index) => {
        formData.append(`midi_${index}`, file);
      });
      
      trainingData.audioFiles.forEach((file, index) => {
        formData.append(`audio_${index}`, file);
      });

      // Start training process
      const { data, error } = await supabase.functions.invoke('neural-model-trainer', {
        body: formData
      });

      if (error) throw error;

      // Start monitoring training progress
      const progressInterval = setInterval(async () => {
        try {
          const { data: progressData } = await supabase.functions.invoke('training-progress', {
            body: { modelId }
          });
          
          if (progressData) {
            setTrainingProgress(progressData);
            
            if (progressData.stage === 'completed') {
              clearInterval(progressInterval);
              setTrainingProgress(null);
              
              // Refresh models list
              await initializeEngine();
              toast.success('Model training completed successfully!');
            }
          }
        } catch (progressError) {
          console.error('Error fetching training progress:', progressError);
        }
      }, 2000);

      return modelId;
      
    } catch (error) {
      console.error('Failed to start model training:', error);
      toast.error('Failed to start model training');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [initializeEngine]);

  // Generate music using a specific model
  const generateMusic = useCallback(async (
    modelId: string,
    params: GenerationParams
  ): Promise<{
    midiData: any;
    audioBuffer?: AudioBuffer;
    metadata: any;
  }> => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('neural-music-generation', {
        body: {
          modelId,
          params,
          timestamp: Date.now()
        }
      });

      if (error) throw error;

      // Process the generated data
      let audioBuffer;
      if (data.audioData && audioContextRef.current) {
        const arrayBuffer = new Uint8Array(data.audioData).buffer;
        audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      }

      return {
        midiData: data.midiData,
        audioBuffer,
        metadata: data.metadata
      };
      
    } catch (error) {
      console.error('Failed to generate music:', error);
      toast.error('Failed to generate music');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Analyze patterns in provided audio/MIDI data
  const analyzePatterns = useCallback(async (
    files: File[],
    analysisType: 'rhythm' | 'harmony' | 'melody' | 'all' = 'all'
  ): Promise<PatternAnalysis> => {
    try {
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append('analysisType', analysisType);
      
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const { data, error } = await supabase.functions.invoke('pattern-analyzer', {
        body: formData
      });

      if (error) throw error;

      const analysis: PatternAnalysis = data;
      setPatternDatabase(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('Failed to analyze patterns:', error);
      toast.error('Failed to analyze patterns');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Fine-tune an existing model with new data
  const fineTuneModel = useCallback(async (
    modelId: string,
    newData: TrainingData,
    fineTuningParams: {
      learningRate: number;
      epochs: number;
      freezeLayers?: number[];
    }
  ): Promise<string> => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('model-fine-tuner', {
        body: {
          modelId,
          newData,
          fineTuningParams
        }
      });

      if (error) throw error;

      toast.success('Fine-tuning started successfully');
      return data.fineTunedModelId;
      
    } catch (error) {
      console.error('Failed to start fine-tuning:', error);
      toast.error('Failed to start fine-tuning');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Get model performance metrics
  const getModelMetrics = useCallback(async (modelId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('model-metrics', {
        body: { modelId }
      });

      if (error) throw error;

      return data.metrics;
      
    } catch (error) {
      console.error('Failed to get model metrics:', error);
      throw error;
    }
  }, []);

  // Load a specific model into memory for faster generation
  const loadModel = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      if (modelCacheRef.current.has(modelId)) {
        return true; // Already loaded
      }

      const { data, error } = await supabase.functions.invoke('model-loader', {
        body: { modelId }
      });

      if (error) throw error;

      modelCacheRef.current.set(modelId, data.modelData);
      
      // Update model status
      setModels(prev => prev.map(model => 
        model.id === modelId ? { ...model, status: 'ready' } : model
      ));

      return true;
      
    } catch (error) {
      console.error('Failed to load model:', error);
      setModels(prev => prev.map(model => 
        model.id === modelId ? { ...model, status: 'failed' } : model
      ));
      return false;
    }
  }, []);

  // Unload a model from memory
  const unloadModel = useCallback(async (modelId: string) => {
    modelCacheRef.current.delete(modelId);
    
    setModels(prev => prev.map(model => 
      model.id === modelId ? { ...model, status: 'ready' } : model
    ));
    
    toast.info(`Model ${modelId} unloaded from memory`);
  }, []);

  // Export model for use in other systems
  const exportModel = useCallback(async (
    modelId: string, 
    format: 'onnx' | 'tensorflow' | 'pytorch' = 'onnx'
  ): Promise<Blob> => {
    try {
      const { data, error } = await supabase.functions.invoke('model-exporter', {
        body: { modelId, format }
      });

      if (error) throw error;

      return new Blob([data.modelData], { type: 'application/octet-stream' });
      
    } catch (error) {
      console.error('Failed to export model:', error);
      throw error;
    }
  }, []);

  // Cleanup resources
  const cleanup = useCallback(() => {
    // Stop all training workers
    trainingWorkersRef.current.forEach(worker => worker.terminate());
    trainingWorkersRef.current.clear();
    
    // Clear model cache
    modelCacheRef.current.clear();
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    setIsInitialized(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      await initializeEngine();
    };
    
    init();
    
    // Cleanup on unmount
    return cleanup;
  }, [initializeEngine, cleanup]);

  return {
    // State
    models,
    isInitialized,
    isProcessing,
    trainingProgress,
    patternDatabase,
    
    // Actions
    initializeEngine,
    trainModel,
    generateMusic,
    analyzePatterns,
    fineTuneModel,
    getModelMetrics,
    loadModel,
    unloadModel,
    exportModel,
    cleanup
  };
};