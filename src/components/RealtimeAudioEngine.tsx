import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Mic, MicOff, Volume2, VolumeX, Headphones, 
  Activity, Zap, Settings, RadioIcon, Wifi, WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import { getEventProcessor } from '@/lib/EventProcessor';

interface RealtimeAudioEngineProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onAudioData?: (audioData: Float32Array) => void;
  className?: string;
}

interface AudioMetrics {
  inputLevel: number;
  outputLevel: number;
  latency: number;
  sampleRate: number;
  bufferSize: number;
  isConnected: boolean;
}

export const RealtimeAudioEngine: React.FC<RealtimeAudioEngineProps> = ({
  isEnabled,
  onToggle,
  onAudioData,
  className = ""
}) => {
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    inputLevel: 0,
    outputLevel: 0,
    latency: 0,
    sampleRate: 44100,
    bufferSize: 512,
    isConnected: false
  });
  
  const [settings, setSettings] = useState({
    inputGain: 0.8,
    outputVolume: 0.7,
    noiseGate: true,
    lowLatencyMode: true,
    echoCancellation: true,
    noiseSuppression: true
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEnabled) {
      initializeAudioEngine();
    } else {
      cleanupAudioEngine();
    }

    return () => cleanupAudioEngine();
  }, [isEnabled]);

  const initializeAudioEngine = async () => {
    try {
      // Initialize Web Audio API
      audioContextRef.current = new AudioContext({
        sampleRate: settings.lowLatencyMode ? 48000 : 44100,
        latencyHint: 'interactive'
      });

      // Request microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: settings.lowLatencyMode ? 48000 : 44100,
          channelCount: 1,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: true
        }
      });

      // Create audio processing chain
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // Create analyzer for audio visualization
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      analyzerRef.current.smoothingTimeConstant = 0.8;

      // Create audio processor for real-time processing
      processorRef.current = audioContextRef.current.createScriptProcessor(
        settings.lowLatencyMode ? 512 : 1024, 1, 1
      );

      processorRef.current.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Apply input gain
        const processedData = new Float32Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          processedData[i] = inputData[i] * settings.inputGain;
        }

        // Apply noise gate
        if (settings.noiseGate) {
          const threshold = 0.01;
          for (let i = 0; i < processedData.length; i++) {
            if (Math.abs(processedData[i]) < threshold) {
              processedData[i] = 0;
            }
          }
        }

        // VAST Integration: Dispatch audio event via EventProcessor
        const processor = getEventProcessor();
        processor.dispatch({
          type: 'audio.processed',
          priority: 'critical',
          payload: {
            data: processedData,
            inputLevel: audioMetrics.inputLevel,
            settings: settings
          },
          source: 'realtime-audio-engine'
        });

        // Send processed audio data to callback
        if (onAudioData) {
          onAudioData(processedData);
        }
      };

      // Connect audio chain
      source.connect(analyzerRef.current);
      analyzerRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // Start metrics monitoring
      startMetricsMonitoring();

      setAudioMetrics(prev => ({
        ...prev,
        isConnected: true,
        sampleRate: audioContextRef.current?.sampleRate || 44100,
        bufferSize: processorRef.current?.bufferSize || 512,
        latency: audioContextRef.current?.baseLatency || 0
      }));

      toast.success('Real-time audio engine initialized');

    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      toast.error('Failed to initialize audio engine');
      onToggle(false);
    }
  };

  const cleanupAudioEngine = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
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

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioMetrics(prev => ({ ...prev, isConnected: false }));
  };

  const startMetricsMonitoring = () => {
    metricsIntervalRef.current = setInterval(() => {
      if (analyzerRef.current && audioContextRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        // Calculate input level (RMS)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += (dataArray[i] / 255) ** 2;
        }
        const inputLevel = Math.sqrt(sum / dataArray.length);
        
        setAudioMetrics(prev => ({
          ...prev,
          inputLevel,
          outputLevel: inputLevel * settings.outputVolume,
          latency: audioContextRef.current?.baseLatency || 0
        }));
      }
    }, 100);
  };

  const handleSettingChange = (key: keyof typeof settings, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply setting changes to audio processing
    if (key === 'inputGain' || key === 'outputVolume') {
      // Gain changes are applied in the audio processing callback
    } else if (key === 'lowLatencyMode' && isEnabled) {
      // Restart audio engine with new latency settings
      cleanupAudioEngine();
      setTimeout(initializeAudioEngine, 100);
    }
  };

  const formatLatency = (latency: number): string => {
    return `${(latency * 1000).toFixed(1)}ms`;
  };

  const getLatencyColor = (latency: number): string => {
    if (latency < 0.01) return 'text-green-500';
    if (latency < 0.02) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className={`${className} border-accent/20`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Real-time Audio Engine
            {audioMetrics.isConnected ? 
              <Wifi className="w-4 h-4 text-green-500" /> : 
              <WifiOff className="w-4 h-4 text-red-500" />
            }
          </div>
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Active" : "Disabled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Engine Control */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable Real-time Processing</span>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
          />
        </div>

        {isEnabled && (
          <>
            {/* Audio Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Input Level</span>
                  <span>{(audioMetrics.inputLevel * 100).toFixed(1)}%</span>
                </div>
                <Progress value={audioMetrics.inputLevel * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Output Level</span>
                  <span>{(audioMetrics.outputLevel * 100).toFixed(1)}%</span>
                </div>
                <Progress value={audioMetrics.outputLevel * 100} className="h-2" />
              </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Latency</div>
                <div className={`text-sm font-medium ${getLatencyColor(audioMetrics.latency)}`}>
                  {formatLatency(audioMetrics.latency)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Sample Rate</div>
                <div className="text-sm font-medium">{audioMetrics.sampleRate}Hz</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Buffer</div>
                <div className="text-sm font-medium">{audioMetrics.bufferSize}</div>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Audio Settings
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm min-w-0 flex-1">Input Gain</span>
                  <Slider
                    value={[settings.inputGain * 100]}
                    onValueChange={([value]) => handleSettingChange('inputGain', value / 100)}
                    max={100}
                    step={1}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {(settings.inputGain * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm min-w-0 flex-1">Output Volume</span>
                  <Slider
                    value={[settings.outputVolume * 100]}
                    onValueChange={([value]) => handleSettingChange('outputVolume', value / 100)}
                    max={100}
                    step={1}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {(settings.outputVolume * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Latency Mode</span>
                  <Switch
                    checked={settings.lowLatencyMode}
                    onCheckedChange={(value) => handleSettingChange('lowLatencyMode', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Noise Gate</span>
                  <Switch
                    checked={settings.noiseGate}
                    onCheckedChange={(value) => handleSettingChange('noiseGate', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Echo Cancellation</span>
                  <Switch
                    checked={settings.echoCancellation}
                    onCheckedChange={(value) => handleSettingChange('echoCancellation', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Noise Suppression</span>
                  <Switch
                    checked={settings.noiseSuppression}
                    onCheckedChange={(value) => handleSettingChange('noiseSuppression', value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {!isEnabled && (
          <div className="text-center py-8 text-muted-foreground">
            <RadioIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Enable real-time audio processing to access advanced features</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};