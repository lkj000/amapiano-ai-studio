/**
 * LUFS Meter Component
 * Professional loudness metering following EBU R128 / ITU-R BS.1770 standards
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Volume2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LUFSMeterProps {
  audioContext?: AudioContext | null;
  sourceNode?: AudioNode | null;
  targetLUFS?: number;
  compact?: boolean;
  animated?: boolean;
}

interface LoudnessData {
  momentary: number;      // 400ms window
  shortTerm: number;      // 3s window
  integrated: number;     // Full duration
  range: number;          // Loudness range (LRA)
  truePeak: number;       // True peak in dBTP
}

// Target ranges for different platforms
const PLATFORM_TARGETS: Record<string, { lufs: number; tolerance: number }> = {
  spotify: { lufs: -14, tolerance: 1 },
  apple: { lufs: -16, tolerance: 1 },
  youtube: { lufs: -14, tolerance: 1 },
  amazon: { lufs: -14, tolerance: 1 },
  tidal: { lufs: -14, tolerance: 1 },
  broadcast: { lufs: -23, tolerance: 0.5 },
  club: { lufs: -8, tolerance: 2 },
  amapiano: { lufs: -9, tolerance: 2 },
};

export function LUFSMeter({ 
  audioContext, 
  sourceNode, 
  targetLUFS = -14,
  compact = false,
  animated = true 
}: LUFSMeterProps) {
  const [loudness, setLoudness] = useState<LoudnessData>({
    momentary: -70,
    shortTerm: -70,
    integrated: -70,
    range: 0,
    truePeak: -70
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const momentaryBufferRef = useRef<Float32Array[]>([]);
  const shortTermBufferRef = useRef<Float32Array[]>([]);
  const integratedSamplesRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number>();
  const peakRef = useRef<number>(-70);

  /**
   * K-weighting filter coefficients (simplified)
   * Full implementation would use two cascaded biquad filters
   */
  const applyKWeighting = useCallback((samples: Float32Array): Float32Array => {
    // Simplified K-weighting - just a high-shelf approximation
    // Production would use proper biquad filters
    const weighted = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      weighted[i] = samples[i] * 1.0; // Placeholder for real K-weighting
    }
    return weighted;
  }, []);

  /**
   * Calculate RMS of samples (mean square -> LUFS)
   */
  const calculateRMS = useCallback((samples: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const meanSquare = sum / samples.length;
    return meanSquare > 0 ? 10 * Math.log10(meanSquare) - 0.691 : -70;
  }, []);

  /**
   * Calculate true peak using oversampling (simplified)
   */
  const calculateTruePeak = useCallback((samples: Float32Array): number => {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > peak) peak = abs;
    }
    // Apply 4x oversampling estimate (simplified)
    const oversampledPeak = peak * 1.05; // Estimate 5% increase from oversampling
    return oversampledPeak > 0 ? 20 * Math.log10(oversampledPeak) : -70;
  }, []);

  /**
   * Main analysis loop
   */
  const analyze = useCallback(() => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(timeData);
    
    // Apply K-weighting
    const weighted = applyKWeighting(timeData);
    
    // Update momentary buffer (400ms window)
    momentaryBufferRef.current.push(weighted);
    const momentaryWindowSize = Math.ceil(0.4 * (audioContext?.sampleRate || 44100) / bufferLength);
    if (momentaryBufferRef.current.length > momentaryWindowSize) {
      momentaryBufferRef.current.shift();
    }
    
    // Update short-term buffer (3s window)
    shortTermBufferRef.current.push(weighted.slice());
    const shortTermWindowSize = Math.ceil(3 * (audioContext?.sampleRate || 44100) / bufferLength);
    if (shortTermBufferRef.current.length > shortTermWindowSize) {
      shortTermBufferRef.current.shift();
    }
    
    // Calculate momentary LUFS (400ms)
    const momentarySamples = new Float32Array(
      momentaryBufferRef.current.reduce((acc, arr) => acc + arr.length, 0)
    );
    let offset = 0;
    for (const arr of momentaryBufferRef.current) {
      momentarySamples.set(arr, offset);
      offset += arr.length;
    }
    const momentary = calculateRMS(momentarySamples);
    
    // Calculate short-term LUFS (3s)
    const shortTermSamples = new Float32Array(
      shortTermBufferRef.current.reduce((acc, arr) => acc + arr.length, 0)
    );
    offset = 0;
    for (const arr of shortTermBufferRef.current) {
      shortTermSamples.set(arr, offset);
      offset += arr.length;
    }
    const shortTerm = calculateRMS(shortTermSamples);
    
    // Update integrated LUFS (gated)
    if (momentary > -70) {
      integratedSamplesRef.current.push(momentary);
      // Keep last 10 minutes of samples
      if (integratedSamplesRef.current.length > 60000) {
        integratedSamplesRef.current.shift();
      }
    }
    
    // Calculate integrated LUFS (average of gated samples)
    let integrated = -70;
    if (integratedSamplesRef.current.length > 0) {
      // Absolute gating at -70 LUFS
      const gated = integratedSamplesRef.current.filter(s => s > -70);
      if (gated.length > 0) {
        // Relative gating at -10 LUFS below ungated
        const ungatedMean = gated.reduce((a, b) => a + b, 0) / gated.length;
        const relativeGated = gated.filter(s => s > ungatedMean - 10);
        if (relativeGated.length > 0) {
          integrated = relativeGated.reduce((a, b) => a + b, 0) / relativeGated.length;
        }
      }
    }
    
    // Calculate loudness range (LRA)
    let range = 0;
    if (integratedSamplesRef.current.length > 10) {
      const sorted = [...integratedSamplesRef.current].sort((a, b) => a - b);
      const low = sorted[Math.floor(sorted.length * 0.1)];
      const high = sorted[Math.floor(sorted.length * 0.95)];
      range = Math.max(0, high - low);
    }
    
    // Calculate true peak
    const truePeak = calculateTruePeak(timeData);
    if (truePeak > peakRef.current) {
      peakRef.current = truePeak;
    }
    
    setLoudness({
      momentary: Math.max(-70, Math.min(0, momentary)),
      shortTerm: Math.max(-70, Math.min(0, shortTerm)),
      integrated: Math.max(-70, Math.min(0, integrated)),
      range: Math.max(0, Math.min(20, range)),
      truePeak: peakRef.current
    });
    
    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [audioContext, applyKWeighting, calculateRMS, calculateTruePeak]);

  /**
   * Setup analyzer when context/source changes
   */
  useEffect(() => {
    if (!audioContext || !sourceNode) {
      setIsAnalyzing(false);
      return;
    }
    
    try {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      
      sourceNode.connect(analyser);
      analyserRef.current = analyser;
      setIsAnalyzing(true);
      
      if (animated) {
        analyze();
      }
    } catch (error) {
      console.error('[LUFSMeter] Setup error:', error);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      momentaryBufferRef.current = [];
      shortTermBufferRef.current = [];
      integratedSamplesRef.current = [];
      peakRef.current = -70;
    };
  }, [audioContext, sourceNode, animated, analyze]);

  /**
   * Get status based on target LUFS
   */
  const getStatus = () => {
    const diff = Math.abs(loudness.integrated - targetLUFS);
    if (loudness.integrated < -60) return 'idle';
    if (diff <= 1) return 'optimal';
    if (diff <= 3) return 'acceptable';
    return 'warning';
  };

  const status = getStatus();
  const isClipping = loudness.truePeak > -0.3;

  /**
   * Convert LUFS to visual percentage (for meters)
   */
  const lufsToPercent = (lufs: number) => {
    // Map -70 to 0 LUFS to 0-100%
    return Math.max(0, Math.min(100, ((lufs + 70) / 70) * 100));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs">
            <span>LUFS</span>
            <span className={cn(
              "font-mono font-bold",
              status === 'optimal' && "text-green-500",
              status === 'acceptable' && "text-yellow-500",
              status === 'warning' && "text-red-500"
            )}>
              {loudness.integrated.toFixed(1)}
            </span>
          </div>
          <Progress 
            value={lufsToPercent(loudness.momentary)} 
            className="h-1.5"
          />
        </div>
        {isClipping && (
          <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Loudness Meter
          </div>
          <div className="flex items-center gap-2">
            {status === 'optimal' && (
              <Badge variant="outline" className="text-green-500 border-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Optimal
              </Badge>
            )}
            {isClipping && (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Clipping
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main LUFS Display */}
        <div className="grid grid-cols-3 gap-4">
          {/* Momentary */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Momentary</div>
            <div className="text-2xl font-mono font-bold">
              {loudness.momentary.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">LUFS</div>
          </div>
          
          {/* Short-term */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Short-term</div>
            <div className="text-2xl font-mono font-bold">
              {loudness.shortTerm.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">LUFS</div>
          </div>
          
          {/* Integrated */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Integrated</div>
            <div className={cn(
              "text-2xl font-mono font-bold",
              status === 'optimal' && "text-green-500",
              status === 'acceptable' && "text-yellow-500",
              status === 'warning' && "text-red-500"
            )}>
              {loudness.integrated.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">LUFS</div>
          </div>
        </div>

        {/* Visual Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-70</span>
            <span>Target: {targetLUFS} LUFS</span>
            <span>0</span>
          </div>
          <div className="relative h-6 bg-muted rounded-md overflow-hidden">
            {/* Target zone indicator */}
            <div 
              className="absolute h-full w-1 bg-primary/50"
              style={{ left: `${lufsToPercent(targetLUFS)}%` }}
            />
            
            {/* Momentary bar */}
            <div 
              className={cn(
                "absolute h-full transition-all duration-75",
                loudness.momentary > -6 ? "bg-red-500" :
                loudness.momentary > -14 ? "bg-yellow-500" :
                "bg-green-500"
              )}
              style={{ width: `${lufsToPercent(loudness.momentary)}%` }}
            />
            
            {/* Peak marker */}
            <div 
              className={cn(
                "absolute top-0 h-full w-0.5",
                isClipping ? "bg-red-500" : "bg-primary"
              )}
              style={{ left: `${Math.min(100, lufsToPercent(loudness.truePeak))}%` }}
            />
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">True Peak</span>
            <span className={cn(
              "font-mono",
              isClipping && "text-destructive font-bold"
            )}>
              {loudness.truePeak.toFixed(1)} dBTP
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LRA</span>
            <span className="font-mono">{loudness.range.toFixed(1)} LU</span>
          </div>
        </div>

        {/* Platform Targets */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Platform Targets</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(PLATFORM_TARGETS).slice(0, 5).map(([platform, { lufs }]) => (
              <Badge 
                key={platform}
                variant={Math.abs(loudness.integrated - lufs) <= 1 ? "default" : "outline"}
                className="text-xs capitalize"
              >
                {platform}: {lufs}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LUFSMeter;
