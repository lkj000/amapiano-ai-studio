import { useState, useCallback, useRef, useEffect } from 'react';

interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

interface BPMMarker {
  position: number; // in seconds
  bar: number;
}

export function useWaveformVisualization() {
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateWaveform = useCallback(async (audioBuffer: AudioBuffer, samples: number = 2000): Promise<WaveformData> => {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const peaks: number[] = [];

    // Generate peaks using RMS for better visualization
    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = start + blockSize;
      let sum = 0;
      
      for (let j = start; j < end && j < channelData.length; j++) {
        sum += channelData[j] * channelData[j];
      }
      
      const rms = Math.sqrt(sum / blockSize);
      peaks.push(rms);
    }

    // Normalize peaks
    const maxPeak = Math.max(...peaks);
    const normalizedPeaks = peaks.map(p => p / maxPeak);

    const data = {
      peaks: normalizedPeaks,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate
    };

    setWaveformData(data);
    return data;
  }, []);

  const generateBPMMarkers = useCallback((bpm: number, duration: number): BPMMarker[] => {
    const beatsPerSecond = bpm / 60;
    const barsPerSecond = beatsPerSecond / 4; // Assuming 4/4 time
    const markers: BPMMarker[] = [];
    
    let bar = 1;
    let position = 0;
    
    while (position < duration) {
      markers.push({ position, bar });
      position += 1 / barsPerSecond;
      bar++;
    }
    
    return markers;
  }, []);

  const drawWaveform = useCallback((
    canvas: HTMLCanvasElement,
    peaks: number[],
    color: string = '#3b82f6',
    bpmMarkers?: BPMMarker[],
    currentBPM?: number
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !peaks.length) return;

    const width = canvas.width;
    const height = canvas.height;
    const middle = height / 2;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, middle);
    ctx.lineTo(width, middle);
    ctx.stroke();

    // Calculate visible range based on zoom and offset
    const visibleSamples = Math.floor(peaks.length / zoom);
    const startSample = Math.floor(offset * peaks.length);
    const endSample = Math.min(startSample + visibleSamples, peaks.length);
    const visiblePeaks = peaks.slice(startSample, endSample);

    // Draw waveform
    ctx.fillStyle = color;
    const barWidth = width / visiblePeaks.length;

    visiblePeaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = peak * (height / 2) * 0.9;
      
      // Draw top half
      ctx.fillRect(x, middle - barHeight, Math.max(barWidth, 1), barHeight);
      // Draw bottom half (mirrored)
      ctx.fillRect(x, middle, Math.max(barWidth, 1), barHeight);
    });

    // Draw BPM markers
    if (bpmMarkers && currentBPM && waveformData) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#f59e0b';

      bpmMarkers.forEach(marker => {
        const normalizedPosition = marker.position / waveformData.duration;
        const x = (normalizedPosition - offset) * width * zoom;
        
        if (x >= 0 && x <= width) {
          // Draw vertical line
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          
          // Draw bar number
          if (marker.bar % 4 === 1) { // Every 4 bars
            ctx.fillText(`${marker.bar}`, x + 2, 15);
          }
        }
      });
    }

    // Draw zoom info
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.fillText(`Zoom: ${zoom.toFixed(1)}x`, 10, height - 10);
  }, [zoom, offset, waveformData]);

  const drawComparison = useCallback((
    canvas: HTMLCanvasElement,
    originalPeaks: number[],
    processedPeaks: number[],
    originalBPM: number,
    processedBPM: number
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const halfHeight = height / 2;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw divider
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(width, halfHeight);
    ctx.stroke();

    // Draw original (top half)
    ctx.fillStyle = '#ef4444';
    const originalBarWidth = width / originalPeaks.length;
    originalPeaks.forEach((peak, i) => {
      const x = i * originalBarWidth;
      const barHeight = peak * (halfHeight * 0.45);
      const y = halfHeight / 2 - barHeight / 2;
      ctx.fillRect(x, y, Math.max(originalBarWidth, 1), barHeight);
    });

    // Draw processed (bottom half)
    ctx.fillStyle = '#10b981';
    const processedBarWidth = width / processedPeaks.length;
    processedPeaks.forEach((peak, i) => {
      const x = i * processedBarWidth;
      const barHeight = peak * (halfHeight * 0.45);
      const y = halfHeight + halfHeight / 2 - barHeight / 2;
      ctx.fillRect(x, y, Math.max(processedBarWidth, 1), barHeight);
    });

    // Draw labels
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Original: ${originalBPM} BPM`, 10, 20);
    
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Processed: ${processedBPM} BPM`, 10, halfHeight + 20);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(1, Math.min(prev + delta, 10)));
  }, []);

  const handlePan = useCallback((delta: number) => {
    setOffset(prev => Math.max(0, Math.min(prev + delta, 1 - 1/zoom)));
  }, [zoom]);

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset(0);
  }, []);

  useEffect(() => {
    if (!waveformData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    drawWaveform(canvas, waveformData.peaks, '#3b82f6');
  }, [waveformData, zoom, offset, drawWaveform]);

  return {
    waveformData,
    isProcessing,
    zoom,
    offset,
    canvasRef,
    generateWaveform,
    generateBPMMarkers,
    drawWaveform,
    drawComparison,
    handleZoom,
    handlePan,
    resetView,
    setCanvasRef: (ref: HTMLCanvasElement | null) => {
      canvasRef.current = ref;
    }
  };
}
