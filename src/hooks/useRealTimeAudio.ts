import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface AudioProcessingOptions {
  sampleRate?: number;
  channels?: number;
  bufferSize?: number;
  enableAnalysis?: boolean;
}

interface AudioAnalysisData {
  volume: number;
  frequency: number;
  waveform: Float32Array;
  spectrum: Float32Array;
}

export const useRealTimeAudio = (options: AudioProcessingOptions = {}) => {
  const {
    sampleRate = 44100,
    channels = 2,
    bufferSize = 4096,
    enableAnalysis = true
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(null);
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get available audio devices
  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      setDeviceList(audioDevices);
      
      if (audioDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(audioDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to load audio devices:', error);
      toast.error('Failed to access audio devices');
    }
  }, [selectedDevice]);

  // Initialize audio context and processing
  const startAudio = useCallback(async () => {
    try {
      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate });
      
      // Get user media with selected device
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          sampleRate,
          channelCount: channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create audio processing nodes
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      if (enableAnalysis) {
        // Create analyzer for real-time analysis
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 1024;
        analyzerRef.current.smoothingTimeConstant = 0.8;
        
        // Create script processor for custom processing
        processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, channels, channels);
        
        // Connect the nodes
        source.connect(analyzerRef.current);
        analyzerRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
        
        // Set up audio processing callback
        processorRef.current.onaudioprocess = (event) => {
          const inputBuffer = event.inputBuffer;
          const outputBuffer = event.outputBuffer;
          
          // Copy input to output (passthrough)
          for (let channel = 0; channel < channels; channel++) {
            const inputData = inputBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);
            outputData.set(inputData);
          }
        };
        
        // Start analysis loop
        startAnalysis();
      } else {
        // Just connect source to destination for monitoring
        source.connect(audioContextRef.current.destination);
      }
      
      setIsActive(true);
      toast.success('Audio processing started');
      
    } catch (error) {
      console.error('Failed to start audio:', error);
      toast.error('Failed to start audio processing');
    }
  }, [selectedDevice, sampleRate, channels, bufferSize, enableAnalysis]);

  // Stop audio processing
  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (analyzerRef.current) {
      analyzerRef.current.disconnect();
      analyzerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsActive(false);
    setAnalysisData(null);
    toast.success('Audio processing stopped');
  }, []);

  // Real-time audio analysis
  const startAnalysis = useCallback(() => {
    if (!analyzerRef.current) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const waveformData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!analyzerRef.current || !isActive) return;

      // Get waveform data
      analyzerRef.current.getByteTimeDomainData(waveformData);
      
      // Get frequency data
      analyzerRef.current.getByteFrequencyData(frequencyData);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < waveformData.length; i++) {
        const sample = (waveformData[i] - 128) / 128;
        sum += sample * sample;
      }
      const volume = Math.sqrt(sum / waveformData.length);

      // Find dominant frequency
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxValue) {
          maxValue = frequencyData[i];
          maxIndex = i;
        }
      }
      const frequency = (maxIndex * audioContextRef.current!.sampleRate / 2) / frequencyData.length;

      // Convert to Float32Array for smoother processing
      const waveform = new Float32Array(waveformData.length);
      const spectrum = new Float32Array(frequencyData.length);
      
      for (let i = 0; i < waveformData.length; i++) {
        waveform[i] = (waveformData[i] - 128) / 128;
      }
      
      for (let i = 0; i < frequencyData.length; i++) {
        spectrum[i] = frequencyData[i] / 255;
      }

      setAnalysisData({
        volume: volume * 100,
        frequency,
        waveform,
        spectrum
      });

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [isActive]);

  // Load devices on mount
  useEffect(() => {
    loadDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
      stopAudio();
    };
  }, [loadDevices, stopAudio]);

  return {
    isActive,
    analysisData,
    deviceList,
    selectedDevice,
    setSelectedDevice,
    startAudio,
    stopAudio,
    loadDevices
  };
};