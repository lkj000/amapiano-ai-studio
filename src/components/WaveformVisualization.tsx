import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, RotateCcw, Upload, X, GitCompare } from 'lucide-react';
import { useWaveformVisualization } from '@/hooks/useWaveformVisualization';
import { useAutoTimeStretch } from '@/hooks/useAutoTimeStretch';
import { toast } from 'sonner';

interface WaveformVisualizationProps {
  audioBuffer?: AudioBuffer;
  originalAudioBuffer?: AudioBuffer;
  originalBPM?: number;
  currentBPM?: number;
  mode?: 'single' | 'comparison';
  className?: string;
}

export function WaveformVisualization({
  audioBuffer: externalAudioBuffer,
  originalAudioBuffer: externalOriginalAudioBuffer,
  originalBPM: externalOriginalBPM,
  currentBPM: externalCurrentBPM,
  mode: externalMode = 'single',
  className
}: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for uploaded files
  const [uploadedAudioBuffer, setUploadedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [comparisonAudioBuffer, setComparisonAudioBuffer] = useState<AudioBuffer | null>(null);
  const [comparisonFileName, setComparisonFileName] = useState<string | null>(null);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [comparisonBPM, setComparisonBPM] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>(externalMode);
  
  const { detectTempo } = useAutoTimeStretch();
  
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

  // Use external or uploaded audio
  const audioBuffer = externalAudioBuffer || uploadedAudioBuffer;
  const originalAudioBuffer = externalOriginalAudioBuffer || comparisonAudioBuffer;
  const currentBPM = externalCurrentBPM || detectedBPM;
  const originalBPM = externalOriginalBPM || comparisonBPM;
  const mode = externalMode || viewMode;

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isComparison: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Detect BPM
      const bpm = detectTempo(buffer);
      
      if (isComparison) {
        setComparisonAudioBuffer(buffer);
        setComparisonFileName(file.name);
        setComparisonBPM(bpm);
        setViewMode('comparison');
        toast.success(`Comparison file loaded: ${file.name}`, {
          description: `Detected ${bpm} BPM`
        });
      } else {
        setUploadedAudioBuffer(buffer);
        setUploadedFileName(file.name);
        setDetectedBPM(bpm);
        toast.success(`File loaded: ${file.name}`, {
          description: `Detected ${bpm} BPM`
        });
      }
    } catch (error) {
      console.error('Failed to process audio file:', error);
      toast.error('Failed to process audio file');
    }

    // Reset input
    e.target.value = '';
  };

  const clearUploadedFile = (isComparison: boolean = false) => {
    if (isComparison) {
      setComparisonAudioBuffer(null);
      setComparisonFileName(null);
      setComparisonBPM(null);
      if (!uploadedAudioBuffer) {
        setViewMode('single');
      }
    } else {
      setUploadedAudioBuffer(null);
      setUploadedFileName(null);
      setDetectedBPM(null);
    }
  };

  const toggleComparisonMode = () => {
    if (viewMode === 'single' && uploadedAudioBuffer) {
      setViewMode('comparison');
      toast.info('Upload a second file to compare');
    } else {
      setViewMode('single');
    }
  };

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Waveform Analyzer</h4>
            {isProcessing && (
              <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'comparison' ? 'default' : 'ghost'}
              size="sm"
              onClick={toggleComparisonMode}
              className="h-7 px-2"
              disabled={!uploadedAudioBuffer}
            >
              <GitCompare className="h-3 w-3 mr-1" />
              <span className="text-xs">Compare</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-2"
            >
              <Upload className="h-3 w-3 mr-1" />
              <span className="text-xs">Upload</span>
            </Button>
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

        {/* File Upload Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => handleFileUpload(e, viewMode === 'comparison' && !!uploadedAudioBuffer)}
          className="hidden"
        />

        {/* Uploaded Files Info */}
        {(uploadedFileName || comparisonFileName) && (
          <div className="flex flex-wrap gap-2">
            {uploadedFileName && (
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{uploadedFileName}</span>
                {detectedBPM && <span className="text-xs opacity-75">{detectedBPM} BPM</span>}
                <button
                  onClick={() => clearUploadedFile(false)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {comparisonFileName && viewMode === 'comparison' && (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{comparisonFileName}</span>
                {comparisonBPM && <span className="text-xs opacity-75">{comparisonBPM} BPM</span>}
                <button
                  onClick={() => clearUploadedFile(true)}
                  className="hover:bg-green-500/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

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
          {!audioBuffer && (
            <p className="text-primary">📁 Click "Upload" to analyze your audio files with automatic BPM detection</p>
          )}
          {audioBuffer && !originalAudioBuffer && viewMode === 'single' && (
            <p className="text-primary">🔀 Click "Compare" then upload a second file to see before/after visualization</p>
          )}
          <p>• Scroll to zoom in/out</p>
          <p>• Drag to pan when zoomed</p>
          {currentBPM && <p>• Orange markers show bar positions at {currentBPM} BPM</p>}
          {mode === 'comparison' && <p>• Red (top) = original, Green (bottom) = processed</p>}
        </div>
      </div>
    </Card>
  );
}
