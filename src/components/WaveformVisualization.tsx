import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, RotateCcw } from 'lucide-react';
import { useWaveformVisualization } from '@/hooks/useWaveformVisualization';

interface WaveformVisualizationProps {
  audioBuffer?: AudioBuffer;
  originalAudioBuffer?: AudioBuffer;
  originalBPM?: number;
  currentBPM?: number;
  mode?: 'single' | 'comparison';
  className?: string;
}

export function WaveformVisualization({
  audioBuffer,
  originalAudioBuffer,
  originalBPM,
  currentBPM,
  mode = 'single',
  className
}: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    waveformData,
    isProcessing,
    zoom,
    generateWaveform,
    generateBPMMarkers,
    drawWaveform,
    drawComparison,
    handleZoom,
    handlePan,
    resetView,
    setCanvasRef
  } = useWaveformVisualization();

  useEffect(() => {
    if (canvasRef.current) {
      setCanvasRef(canvasRef.current);
    }
  }, [setCanvasRef]);

  useEffect(() => {
    if (audioBuffer && mode === 'single') {
      generateWaveform(audioBuffer);
    }
  }, [audioBuffer, mode, generateWaveform]);

  useEffect(() => {
    if (mode === 'comparison' && originalAudioBuffer && audioBuffer && canvasRef.current && originalBPM && currentBPM) {
      const processComparison = async () => {
        const originalData = await generateWaveform(originalAudioBuffer);
        const processedData = await generateWaveform(audioBuffer);
        
        if (canvasRef.current) {
          drawComparison(
            canvasRef.current,
            originalData.peaks,
            processedData.peaks,
            originalBPM,
            currentBPM
          );
        }
      };
      
      processComparison();
    }
  }, [mode, originalAudioBuffer, audioBuffer, originalBPM, currentBPM, generateWaveform, drawComparison]);

  useEffect(() => {
    if (mode === 'single' && waveformData && canvasRef.current && currentBPM) {
      const markers = generateBPMMarkers(currentBPM, waveformData.duration);
      drawWaveform(canvasRef.current, waveformData.peaks, '#3b82f6', markers, currentBPM);
    }
  }, [mode, waveformData, currentBPM, zoom, generateBPMMarkers, drawWaveform]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoom(0.5);
    } else {
      handleZoom(-0.5);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) { // Left mouse button
      const delta = e.movementX / (canvasRef.current?.width || 800);
      handlePan(-delta);
    }
  };

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Waveform Viewer</h4>
            {isProcessing && (
              <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom(0.5)}
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom(-0.5)}
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="h-7 w-7 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="relative bg-[#1a1a1a] rounded-lg overflow-hidden border border-border">
          <canvas
            ref={canvasRef}
            width={800}
            height={mode === 'comparison' ? 300 : 200}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            className="w-full cursor-move"
          />
          {zoom > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              <Move className="h-3 w-3" />
              <span>Drag to pan</span>
            </div>
          )}
        </div>

        {mode === 'comparison' && originalBPM && currentBPM && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span>Original: {originalBPM} BPM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span>Processed: {currentBPM} BPM</span>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Scroll to zoom in/out</p>
          <p>• Drag to pan when zoomed</p>
          {currentBPM && <p>• Orange markers show bar positions</p>}
        </div>
      </div>
    </Card>
  );
}
