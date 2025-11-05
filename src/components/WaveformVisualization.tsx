import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZoomIn, ZoomOut, Move, RotateCcw, Upload, X, GitCompare, Play, Pause, Square, Activity } from 'lucide-react';
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
  const spectralCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Local state for uploaded files
  const [uploadedAudioBuffer, setUploadedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [comparisonAudioBuffer, setComparisonAudioBuffer] = useState<AudioBuffer | null>(null);
  const [comparisonFileName, setComparisonFileName] = useState<string | null>(null);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [comparisonBPM, setComparisonBPM] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>(externalMode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewType, setViewType] = useState<'waveform' | 'spectral'>('waveform');
  
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

  const handlePlay = () => {
    if (!audioBuffer) {
      toast.error('No audio loaded');
      return;
    }

    if (isPlaying) {
      handlePause();
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const context = audioContextRef.current;
      
      // Stop existing playback
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }

      // Create new source
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create analyser for spectral view
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyserNodeRef.current = analyser;

      // Connect nodes
      source.connect(analyser);
      analyser.connect(context.destination);

      // Start playback
      const startTime = currentTime;
      source.start(0, startTime);
      sourceNodeRef.current = source;

      setIsPlaying(true);
      setDuration(audioBuffer.duration);

      // Update current time
      const startTimestamp = Date.now() - (startTime * 1000);
      const updateTime = () => {
        if (!isPlaying) return;
        const elapsed = (Date.now() - startTimestamp) / 1000;
        if (elapsed >= audioBuffer.duration) {
          handleStop();
        } else {
          setCurrentTime(elapsed);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };
      updateTime();

      // Handle playback end
      source.onended = () => {
        if (isPlaying) {
          handleStop();
        }
      };

      // Start spectral visualization if in spectral view
      if (viewType === 'spectral') {
        drawSpectralAnalysis();
      }

    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play audio');
    }
  };

  const handlePause = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
  };

  const handleStop = () => {
    handlePause();
    setCurrentTime(0);
  };

  const drawSpectralAnalysis = () => {
    if (!spectralCanvasRef.current || !analyserNodeRef.current) return;

    const canvas = spectralCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserNodeRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return;

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(26, 26, 26, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Draw frequency bars
      const barWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        // Color based on frequency intensity
        const hue = (i / bufferLength) * 240; // Blue to red spectrum
        const intensity = dataArray[i] / 255;
        ctx.fillStyle = `hsla(${hue}, 100%, ${50 + intensity * 50}%, ${intensity})`;
        
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth;
      }
    };

    draw();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update spectral visualization when view changes
  useEffect(() => {
    if (viewType === 'spectral' && isPlaying && analyserNodeRef.current) {
      drawSpectralAnalysis();
    }
  }, [viewType, isPlaying]);

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
            {/* Playback Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              className="h-7 w-7 p-0"
              disabled={!audioBuffer}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="h-7 w-7 p-0"
              disabled={!audioBuffer}
            >
              <Square className="h-3 w-3" />
            </Button>
            
            <div className="w-px h-7 bg-border mx-1" />
            
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

        {/* Playback Time Display */}
        {audioBuffer && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || audioBuffer.duration)}</span>
          </div>
        )}

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

        <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'waveform' | 'spectral')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="waveform">Waveform</TabsTrigger>
            <TabsTrigger value="spectral">
              <Activity className="w-3 h-3 mr-1" />
              Spectral Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="waveform" className="mt-4">
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
              {/* Playhead indicator */}
              {isPlaying && audioBuffer && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                  style={{ left: `${(currentTime / audioBuffer.duration) * 100}%` }}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="spectral" className="mt-4">
            <div className="relative bg-[#1a1a1a] rounded-lg overflow-hidden border border-border">
              <canvas
                ref={spectralCanvasRef}
                width={800}
                height={300}
                className="w-full"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Press Play to view live frequency spectrum</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
          <p>• Click Play/Pause to control playback</p>
          <p>• Switch to Spectral Analysis to view live frequency spectrum</p>
          <p>• Scroll to zoom in/out</p>
          <p>• Drag to pan when zoomed</p>
          {currentBPM && <p>• Orange markers show bar positions at {currentBPM} BPM</p>}
          {mode === 'comparison' && <p>• Red (top) = original, Green (bottom) = processed</p>}
        </div>
      </div>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
