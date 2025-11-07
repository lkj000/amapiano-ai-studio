/**
 * High-Speed DAW Engine Component
 * 
 * Professional-grade audio processing using C++ WASM
 * Displays real-time performance metrics and status
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Cpu, Zap, Activity, Clock, CheckCircle2, AlertCircle, 
  TrendingUp, Gauge 
} from 'lucide-react';
import { useHighSpeedAudioEngine } from '@/hooks/useHighSpeedAudioEngine';
import { useRealtimeFeatureExtraction } from '@/hooks/useRealtimeFeatureExtraction';

export const HighSpeedDAWEngine: React.FC<{ 
  onInitialized?: () => void;
  showMetrics?: boolean;
}> = ({ 
  onInitialized,
  showMetrics = true 
}) => {
  const audioEngine = useHighSpeedAudioEngine();
  const featureExtractor = useRealtimeFeatureExtraction();

  // Auto-initialize only after explicit user gesture (autoplay policy)
  useEffect(() => {
    const initializeEngines = async () => {
      await Promise.all([
        audioEngine.initialize(),
        featureExtractor.initialize(),
      ]);
      if (onInitialized) onInitialized();
    };

    // If audio was already started in this session, initialize immediately
    const started = sessionStorage.getItem('audioContextStarted') === 'true';
    if (started && (!audioEngine.isInitialized || !featureExtractor.isInitialized)) {
      initializeEngines();
    }

    // Listen for audio-started event dispatched by AudioStartGate
    const onAudioStarted = () => {
      if (!audioEngine.isInitialized || !featureExtractor.isInitialized) {
        initializeEngines();
      }
    };
    window.addEventListener('audio-started', onAudioStarted);

    return () => {
      window.removeEventListener('audio-started', onAudioStarted);
    };
  }, []);

  const latencyColor = audioEngine.stats.latency < 5 ? 'text-green-500' : 
                       audioEngine.stats.latency < 10 ? 'text-yellow-500' : 
                       'text-red-500';

  const cpuColor = audioEngine.stats.cpuLoad < 0.5 ? 'text-green-500' : 
                   audioEngine.stats.cpuLoad < 0.7 ? 'text-yellow-500' : 
                   'text-red-500';

  if (!showMetrics) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>High-Speed C++ Audio Engine</span>
          </div>
          <div className="flex items-center gap-2">
            {audioEngine.isInitialized ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Initializing
              </Badge>
            )}
            {audioEngine.isProfessionalGrade && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                Pro Grade
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Latency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-muted-foreground">Latency</span>
              </div>
              <span className={`font-mono font-semibold ${latencyColor}`}>
                {audioEngine.stats.latency.toFixed(2)}ms
              </span>
            </div>
            <Progress 
              value={Math.min(audioEngine.stats.latency / 10 * 100, 100)} 
              className="h-1"
            />
            <div className="text-[10px] text-muted-foreground">
              Target: {'<'}5ms for professional
            </div>
          </div>

          {/* CPU Load */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span className="text-muted-foreground">CPU Load</span>
              </div>
              <span className={`font-mono font-semibold ${cpuColor}`}>
                {(audioEngine.stats.cpuLoad * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={audioEngine.stats.cpuLoad * 100} 
              className="h-1"
            />
            <div className="text-[10px] text-muted-foreground">
              Buffer: {(audioEngine.stats.bufferUtilization * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <Separator />

        {/* Processing Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Processing Time</span>
            </div>
            <div className="font-mono text-sm font-semibold">
              {audioEngine.stats.processingTime.toFixed(0)}μs
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Gauge className="h-3 w-3" />
              <span>Feature Extraction</span>
            </div>
            <div className="font-mono text-sm font-semibold">
              {featureExtractor.speedupFactor > 0 
                ? `${featureExtractor.speedupFactor.toFixed(1)}x real-time`
                : 'Ready'}
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              C++ WASM
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              AudioWorklet
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Essentia.js
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Multi-threaded
            </Badge>
          </div>
        </div>

        {/* Status Messages */}
        {audioEngine.isProfessionalGrade && (
          <div className="flex items-start gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-green-500">Professional-Grade Performance</div>
              <div className="text-muted-foreground">
                Latency and CPU usage meet professional audio standards
              </div>
            </div>
          </div>
        )}

        {!audioEngine.isProfessionalGrade && audioEngine.isInitialized && (
          <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-yellow-500">Performance Warning</div>
              <div className="text-muted-foreground">
                System load is high. Close other applications for better performance.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
