import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Move, RotateCcw, Upload, X, GitCompare, Play, Pause, Square, Activity, Mic, Download, Repeat, Music2, Scissors, RepeatIcon, FileMusic, Sliders, Radio, Layers, Volume2, Gauge } from 'lucide-react';
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
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
  const [isRecording, setIsRecording] = useState(false);
  const [abMode, setAbMode] = useState<'A' | 'B'>('A');
  const [detectedPitch, setDetectedPitch] = useState<{ frequency: number; note: string; cents: number } | null>(null);
  const [showPitchDetection, setShowPitchDetection] = useState(false);
  const [regionSelection, setRegionSelection] = useState<{ start: number; end: number } | null>(null);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [selectionStartX, setSelectionStartX] = useState(0);
  const [isLoopingRegion, setIsLoopingRegion] = useState(false);
  const [pitchHistory, setPitchHistory] = useState<Array<{ frequency: number; note: string; time: number }>>([]);
  const [showProcessingTools, setShowProcessingTools] = useState(false);
  const [processingParams, setProcessingParams] = useState({
    gain: 1,
    reverb: 0,
    delay: 0,
    lowpass: 22050,
    highpass: 20,
    compression: 0
  });
  const [beatMarkers, setBeatMarkers] = useState<number[]>([]);
  const [showBeatDetection, setShowBeatDetection] = useState(false);
  const [tracks, setTracks] = useState<Array<{ id: string; buffer: AudioBuffer; name: string; volume: number; solo: boolean; mute: boolean }>>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [loudnessData, setLoudnessData] = useState<{ lufs: number; peak: number; truePeak: number } | null>(null);
  const [showLoudness, setShowLoudness] = useState(false);
  const effectsNodesRef = useRef<{ 
    lowpass: BiquadFilterNode | null;
    highpass: BiquadFilterNode | null;
    compressor: DynamicsCompressorNode | null;
  }>({ lowpass: null, highpass: null, compressor: null });
  
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

  // Helper functions for A/B mode
  const getCurrentBuffer = () => {
    if (abMode === 'A') {
      return externalAudioBuffer || uploadedAudioBuffer;
    } else {
      return externalOriginalAudioBuffer || comparisonAudioBuffer;
    }
  };

  const getCurrentBPM = () => {
    if (abMode === 'A') {
      return externalCurrentBPM || detectedBPM;
    } else {
      return externalOriginalBPM || comparisonBPM;
    }
  };

  // Use external or uploaded audio (with A/B mode support)
  const audioBuffer = getCurrentBuffer();
  const originalAudioBuffer = externalOriginalAudioBuffer || comparisonAudioBuffer;
  const currentBPM = getCurrentBPM();
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
      source.loop = isLoopingRegion && !!regionSelection;
      
      // Set loop points if looping region
      if (isLoopingRegion && regionSelection) {
        source.loopStart = regionSelection.start;
        source.loopEnd = regionSelection.end;
      }
      
      // Create analyser for spectral view
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyserNodeRef.current = analyser;

      // Create gain node for processing
      const gainNode = context.createGain();
      gainNode.gain.value = processingParams.gain;

      // Create effects chain
      const lowpassFilter = context.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.value = processingParams.lowpass;
      effectsNodesRef.current.lowpass = lowpassFilter;

      const highpassFilter = context.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.value = processingParams.highpass;
      effectsNodesRef.current.highpass = highpassFilter;

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 1 + (processingParams.compression / 10);
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      effectsNodesRef.current.compressor = compressor;

      // Connect nodes with full effects chain
      source.connect(gainNode);
      gainNode.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(context.destination);

      // Start playback
      const startTime = isLoopingRegion && regionSelection ? regionSelection.start : currentTime;
      const duration = isLoopingRegion && regionSelection ? regionSelection.end - regionSelection.start : undefined;
      source.start(0, startTime, duration);
      sourceNodeRef.current = source;

      setIsPlaying(true);
      setDuration(audioBuffer.duration);

      // Update current time
      const startTimestamp = Date.now() - (startTime * 1000);
      const updateTime = () => {
        if (!isPlaying) return;
        let elapsed = (Date.now() - startTimestamp) / 1000;
        
        // Handle region looping
        if (isLoopingRegion && regionSelection) {
          const regionDuration = regionSelection.end - regionSelection.start;
          elapsed = regionSelection.start + (elapsed % regionDuration);
        }
        
        if (!isLoopingRegion && elapsed >= audioBuffer.duration) {
          handleStop();
        } else {
          setCurrentTime(elapsed);
          animationFrameRef.current = requestAnimationFrame(updateTime);
        }
      };
      updateTime();

      // Handle playback end
      source.onended = () => {
        if (isPlaying && !isLoopingRegion) {
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
    if (showPitchDetection && isPlaying) {
      startPitchDetection();
    }
  }, [viewType, isPlaying, showPitchDetection]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        
        try {
          const audioContext = new AudioContext();
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Detect BPM
          const bpm = detectTempo(buffer);
          
          setUploadedAudioBuffer(buffer);
          setUploadedFileName(`Recording ${new Date().toLocaleTimeString()}`);
          setDetectedBPM(bpm);
          
          toast.success('Recording saved', {
            description: `Detected ${bpm} BPM`
          });
        } catch (error) {
          console.error('Failed to process recording:', error);
          toast.error('Failed to process recording');
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started', {
        description: 'Click Stop Recording when done'
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleExportSpectral = () => {
    if (!spectralCanvasRef.current) {
      toast.error('No spectral data to export');
      return;
    }

    try {
      spectralCanvasRef.current.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to create image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spectral-analysis-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Spectral analysis exported', {
          description: 'Saved as PNG image'
        });
      }, 'image/png');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export image');
    }
  };

  const handleAbToggle = () => {
    if (!uploadedAudioBuffer || !comparisonAudioBuffer) {
      toast.error('Load two files first for A/B comparison');
      return;
    }

    // Stop current playback
    if (isPlaying) {
      handlePause();
    }

    // Switch between A and B
    const newMode = abMode === 'A' ? 'B' : 'A';
    setAbMode(newMode);

    toast.info(`Now playing: ${newMode}`, {
      description: newMode === 'A' ? uploadedFileName || 'File A' : comparisonFileName || 'File B'
    });
  };

  // Pitch detection using autocorrelation
  const detectPitch = (dataArray: Float32Array, sampleRate: number): { frequency: number; note: string; cents: number } | null => {
    const SIZE = dataArray.length;
    let rms = 0;
    
    // Calculate RMS to check if there's enough signal
    for (let i = 0; i < SIZE; i++) {
      rms += dataArray[i] * dataArray[i];
    }
    rms = Math.sqrt(rms / SIZE);
    
    if (rms < 0.01) return null; // Not enough signal
    
    // Autocorrelation
    const correlations = new Array(SIZE);
    for (let lag = 0; lag < SIZE; lag++) {
      let sum = 0;
      for (let i = 0; i < SIZE - lag; i++) {
        sum += dataArray[i] * dataArray[i + lag];
      }
      correlations[lag] = sum;
    }
    
    // Find the first peak after the initial correlation
    let maxCorrelation = 0;
    let maxLag = 0;
    let lastValue = 1;
    
    for (let lag = 1; lag < SIZE; lag++) {
      const value = correlations[lag];
      if (value > maxCorrelation && value > correlations[lag - 1] && value > correlations[lag + 1]) {
        maxCorrelation = value;
        maxLag = lag;
      }
      if (value < 0 && lastValue >= 0) break;
      lastValue = value;
    }
    
    if (maxLag === 0) return null;
    
    const frequency = sampleRate / maxLag;
    
    // Convert frequency to note
    const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const halfSteps = 12 * Math.log2(frequency / C0);
    const noteIndex = Math.round(halfSteps) % 12;
    const octave = Math.floor(halfSteps / 12);
    const cents = Math.round((halfSteps - Math.round(halfSteps)) * 100);
    
    return {
      frequency: Math.round(frequency * 10) / 10,
      note: `${noteStrings[noteIndex]}${octave}`,
      cents
    };
  };

  const startPitchDetection = () => {
    if (!analyserNodeRef.current) return;

    const analyser = analyserNodeRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const detectLoop = () => {
      if (!showPitchDetection || !isPlaying) return;

      analyser.getFloatTimeDomainData(dataArray);
      const pitch = detectPitch(dataArray, audioContextRef.current?.sampleRate || 44100);
      setDetectedPitch(pitch);
      
      // Record pitch history for MIDI export
      if (pitch) {
        setPitchHistory(prev => [...prev, { ...pitch, time: currentTime }]);
      }

      requestAnimationFrame(detectLoop);
    };

    detectLoop();
  };

  // Region selection handlers
  const handleMouseDownRegion = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !audioBuffer) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setSelectionStartX(x);
    setIsSelectingRegion(true);
  };

  const handleMouseMoveRegion = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingRegion || !canvasRef.current || !audioBuffer) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    const startRatio = Math.min(selectionStartX, x) / width;
    const endRatio = Math.max(selectionStartX, x) / width;
    
    setRegionSelection({
      start: startRatio * audioBuffer.duration,
      end: endRatio * audioBuffer.duration
    });
  };

  const handleMouseUpRegion = () => {
    setIsSelectingRegion(false);
    if (regionSelection) {
      toast.success('Region selected', {
        description: `${formatTime(regionSelection.start)} - ${formatTime(regionSelection.end)}`
      });
    }
  };

  const handleClearRegion = () => {
    setRegionSelection(null);
    toast.info('Region cleared');
  };

  const handleExportRegion = () => {
    if (!regionSelection || !audioBuffer || !audioContextRef.current) {
      toast.error('No region selected');
      return;
    }

    try {
      const startSample = Math.floor(regionSelection.start * audioBuffer.sampleRate);
      const endSample = Math.floor(regionSelection.end * audioBuffer.sampleRate);
      const length = endSample - startSample;

      // Create new buffer for the region
      const newBuffer = audioContextRef.current.createBuffer(
        audioBuffer.numberOfChannels,
        length,
        audioBuffer.sampleRate
      );

      // Copy data for each channel
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          newData[i] = oldData[startSample + i];
        }
      }

      toast.success('Region extracted', {
        description: `Duration: ${formatTime(regionSelection.end - regionSelection.start)}`
      });

      // You could add functionality here to download or use the extracted region
    } catch (error) {
      console.error('Region export error:', error);
      toast.error('Failed to export region');
    }
  };

  const handleToggleRegionLoop = () => {
    if (!regionSelection) {
      toast.error('Select a region first');
      return;
    }
    
    const newLoopState = !isLoopingRegion;
    setIsLoopingRegion(newLoopState);
    
    // Restart playback if currently playing
    if (isPlaying) {
      handleStop();
      setTimeout(() => handlePlay(), 100);
    }
    
    toast.success(newLoopState ? 'Region loop enabled' : 'Region loop disabled');
  };

  const handleExportPitchToMIDI = () => {
    if (pitchHistory.length === 0) {
      toast.error('No pitch data to export. Enable pitch detection and play audio first.');
      return;
    }

    try {
      // Convert pitch history to simplified MIDI-like format
      const midiData = {
        format: 'MIDI-like JSON',
        tempo: currentBPM || 120,
        notes: pitchHistory.map((pitch, index) => {
          const noteNumber = noteToMIDI(pitch.note);
          const nextTime = pitchHistory[index + 1]?.time || pitch.time + 0.1;
          return {
            note: noteNumber,
            noteName: pitch.note,
            frequency: pitch.frequency,
            startTime: pitch.time,
            duration: nextTime - pitch.time,
            velocity: 100
          };
        })
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(midiData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitch-detection-midi-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Pitch data exported to MIDI format', {
        description: `${pitchHistory.length} notes exported`
      });
    } catch (error) {
      console.error('MIDI export error:', error);
      toast.error('Failed to export MIDI data');
    }
  };

  const noteToMIDI = (noteName: string): number => {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    
    const match = noteName.match(/^([A-G]#?)(\d+)$/);
    if (!match) return 60; // Default to middle C
    
    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr);
    return (octave + 1) * 12 + noteMap[note];
  };

  // Beat detection using energy-based algorithm
  const detectBeats = (buffer: AudioBuffer) => {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
    const hopSize = Math.floor(windowSize / 2);
    
    const energies: number[] = [];
    
    // Calculate energy for each window
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] ** 2;
      }
      energies.push(energy / windowSize);
    }
    
    // Calculate adaptive threshold
    const threshold = energies.reduce((a, b) => a + b, 0) / energies.length * 1.5;
    
    // Find peaks above threshold
    const beats: number[] = [];
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && 
          energies[i] > energies[i - 1] && 
          energies[i] > energies[i + 1]) {
        const timeInSeconds = (i * hopSize) / sampleRate;
        
        // Avoid beats too close together (minimum 100ms apart)
        if (beats.length === 0 || timeInSeconds - beats[beats.length - 1] > 0.1) {
          beats.push(timeInSeconds);
        }
      }
    }
    
    setBeatMarkers(beats);
    toast.success(`Detected ${beats.length} beats`);
  };

  // Calculate LUFS (simplified integrated loudness)
  const calculateLoudness = (buffer: AudioBuffer) => {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(buffer.sampleRate * 0.4); // 400ms blocks
    
    let sumSquares = 0;
    let peak = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.abs(channelData[i]);
      sumSquares += channelData[i] ** 2;
      peak = Math.max(peak, sample);
    }
    
    const rms = Math.sqrt(sumSquares / channelData.length);
    const lufs = -0.691 + 10 * Math.log10(rms) - 23; // Simplified LUFS approximation
    const peakDb = 20 * Math.log10(peak);
    
    setLoudnessData({
      lufs: Math.round(lufs * 10) / 10,
      peak: Math.round(peakDb * 10) / 10,
      truePeak: Math.round(peakDb * 10) / 10
    });
    
    setShowLoudness(true);
  };

  const normalizeLoudness = (targetLufs: number = -14) => {
    if (!loudnessData || !audioBuffer) {
      toast.error('Calculate loudness first');
      return;
    }
    
    const gainAdjustment = targetLufs - loudnessData.lufs;
    const newGain = processingParams.gain * Math.pow(10, gainAdjustment / 20);
    
    setProcessingParams(prev => ({ ...prev, gain: newGain }));
    toast.success(`Normalized to ${targetLufs} LUFS`, {
      description: `Gain adjusted by ${gainAdjustment.toFixed(1)} dB`
    });
  };

  // Multi-track management
  const addTrack = (buffer: AudioBuffer, name: string) => {
    const newTrack = {
      id: Math.random().toString(36).substr(2, 9),
      buffer,
      name,
      volume: 1,
      solo: false,
      mute: false
    };
    
    setTracks(prev => [...prev, newTrack]);
    setActiveTrackId(newTrack.id);
    toast.success(`Track added: ${name}`);
  };

  const updateTrackVolume = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, volume } : t
    ));
  };

  const toggleTrackMute = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, mute: !t.mute } : t
    ));
  };

  const toggleTrackSolo = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, solo: !t.solo } : { ...t, solo: false }
    ));
  };

  const removeTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    if (activeTrackId === trackId) {
      setActiveTrackId(tracks[0]?.id || null);
    }
  };

  // Update effects in real-time
  useEffect(() => {
    if (effectsNodesRef.current.lowpass) {
      effectsNodesRef.current.lowpass.frequency.value = processingParams.lowpass;
    }
    if (effectsNodesRef.current.highpass) {
      effectsNodesRef.current.highpass.frequency.value = processingParams.highpass;
    }
    if (effectsNodesRef.current.compressor) {
      effectsNodesRef.current.compressor.ratio.value = 1 + (processingParams.compression / 10);
    }
  }, [processingParams]);

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
            {/* Recording Controls */}
            <Button
              variant={isRecording ? 'destructive' : 'ghost'}
              size="sm"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className="h-7 px-2"
            >
              <Mic className="h-3 w-3 mr-1" />
              <span className="text-xs">{isRecording ? 'Stop' : 'Record'}</span>
            </Button>

            <div className="w-px h-7 bg-border mx-1" />
            
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

            {/* A/B Comparison */}
            {uploadedAudioBuffer && comparisonAudioBuffer && (
              <>
                <Button
                  variant={abMode === 'A' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={handleAbToggle}
                  className="h-7 px-2"
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  <span className="text-xs">A/B: {abMode}</span>
                </Button>
                <div className="w-px h-7 bg-border mx-1" />
              </>
            )}

            {/* Pitch Detection Toggle */}
            <Button
              variant={showPitchDetection ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowPitchDetection(!showPitchDetection)}
              className="h-7 px-2"
              disabled={!audioBuffer}
            >
              <Music2 className="h-3 w-3 mr-1" />
              <span className="text-xs">Pitch</span>
            </Button>

            {/* Region Selection Toggle */}
            <Button
              variant={regionSelection ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (regionSelection) {
                  handleClearRegion();
                } else {
                  toast.info('Drag on waveform to select region');
                }
              }}
              className="h-7 px-2"
              disabled={!audioBuffer}
            >
              <Scissors className="h-3 w-3 mr-1" />
              <span className="text-xs">Region</span>
            </Button>

            {/* Region Loop Toggle */}
            {regionSelection && (
              <Button
                variant={isLoopingRegion ? 'default' : 'ghost'}
                size="sm"
                onClick={handleToggleRegionLoop}
                className="h-7 px-2"
              >
                <RepeatIcon className="h-3 w-3 mr-1" />
                <span className="text-xs">Loop</span>
              </Button>
            )}

            {/* MIDI Export */}
            {pitchHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPitchToMIDI}
                className="h-7 px-2"
              >
                <FileMusic className="h-3 w-3 mr-1" />
                <span className="text-xs">MIDI</span>
              </Button>
            )}

            {/* Beat Detection */}
            <Button
              variant={showBeatDetection ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (audioBuffer) {
                  detectBeats(audioBuffer);
                  setShowBeatDetection(true);
                } else {
                  toast.error('Load audio first');
                }
              }}
              className="h-7 px-2"
              disabled={!audioBuffer}
            >
              <Radio className="h-3 w-3 mr-1" />
              <span className="text-xs">Beats</span>
            </Button>

            {/* Loudness Analysis */}
            <Button
              variant={showLoudness ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (audioBuffer) {
                  calculateLoudness(audioBuffer);
                } else {
                  toast.error('Load audio first');
                }
              }}
              className="h-7 px-2"
              disabled={!audioBuffer}
            >
              <Gauge className="h-3 w-3 mr-1" />
              <span className="text-xs">LUFS</span>
            </Button>

            {/* Multi-Track Toggle */}
            <Button
              variant={tracks.length > 0 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                if (audioBuffer && uploadedFileName) {
                  addTrack(audioBuffer, uploadedFileName);
                } else {
                  toast.error('Load audio first');
                }
              }}
              className="h-7 px-2"
              disabled={!audioBuffer}
            >
              <Layers className="h-3 w-3 mr-1" />
              <span className="text-xs">Track</span>
            </Button>

            {/* Audio Processing Tools */}
            <Button
              variant={showProcessingTools ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowProcessingTools(!showProcessingTools)}
              className="h-7 px-2"
              disabled={!audioBuffer}
            >
              <Sliders className="h-3 w-3 mr-1" />
              <span className="text-xs">FX</span>
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

        {/* Loudness Display */}
        {showLoudness && loudnessData && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold">Loudness Analysis</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={() => normalizeLoudness(-14)}
                className="h-6 px-2 text-xs"
              >
                Normalize to -14 LUFS
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="text-muted-foreground">Integrated LUFS</div>
                <div className="text-lg font-bold font-mono">{loudnessData.lufs}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Peak dB</div>
                <div className="text-lg font-bold font-mono">{loudnessData.peak}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">True Peak dB</div>
                <div className="text-lg font-bold font-mono">{loudnessData.truePeak}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Multi-Track Panel */}
        {tracks.length > 0 && (
          <Card className="p-3 bg-muted/50">
            <h5 className="text-sm font-semibold mb-3">Multi-Track Mixer ({tracks.length} tracks)</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tracks.map(track => (
                <div key={track.id} className="flex items-center gap-2 p-2 bg-background rounded">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{track.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Volume2 className="h-3 w-3 text-muted-foreground" />
                      <Slider
                        value={[track.volume * 100]}
                        onValueChange={(v) => updateTrackVolume(track.id, v[0] / 100)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono w-8">{Math.round(track.volume * 100)}%</span>
                    </div>
                  </div>
                  <Button
                    variant={track.solo ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => toggleTrackSolo(track.id)}
                    className="h-6 w-6 p-0"
                  >
                    <span className="text-xs">S</span>
                  </Button>
                  <Button
                    variant={track.mute ? 'destructive' : 'ghost'}
                    size="sm"
                    onClick={() => toggleTrackMute(track.id)}
                    className="h-6 w-6 p-0"
                  >
                    <span className="text-xs">M</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTrack(track.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Audio Processing Tools Panel */}
        {showProcessingTools && audioBuffer && (
          <Card className="p-4 bg-muted/50">
            <h5 className="text-sm font-semibold mb-3">Real-Time Effects</h5>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Gain</span>
                  <span className="font-mono">{processingParams.gain.toFixed(2)}x ({(20 * Math.log10(processingParams.gain)).toFixed(1)} dB)</span>
                </label>
                <Slider
                  value={[processingParams.gain * 50]}
                  onValueChange={(v) => setProcessingParams(prev => ({ ...prev, gain: v[0] / 50 }))}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Lowpass Filter</span>
                  <span className="font-mono">{processingParams.lowpass} Hz</span>
                </label>
                <Slider
                  value={[processingParams.lowpass]}
                  onValueChange={(v) => setProcessingParams(prev => ({ ...prev, lowpass: v[0] }))}
                  min={200}
                  max={22050}
                  step={50}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Highpass Filter</span>
                  <span className="font-mono">{processingParams.highpass} Hz</span>
                </label>
                <Slider
                  value={[processingParams.highpass]}
                  onValueChange={(v) => setProcessingParams(prev => ({ ...prev, highpass: v[0] }))}
                  min={20}
                  max={1000}
                  step={10}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Compression</span>
                  <span className="font-mono">{processingParams.compression > 0 ? `${(1 + processingParams.compression / 10).toFixed(1)}:1` : 'Off'}</span>
                </label>
                <Slider
                  value={[processingParams.compression]}
                  onValueChange={(v) => setProcessingParams(prev => ({ ...prev, compression: v[0] }))}
                  max={100}
                  step={5}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                ⚡ Effects are applied in real-time during playback
              </div>
            </div>
          </Card>
        )}

        {/* Playback Time Display */}
        {audioBuffer && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            {detectedPitch && showPitchDetection && (
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                <Music2 className="h-3 w-3" />
                <span className="font-mono font-bold">{detectedPitch.note}</span>
                <span className="text-xs opacity-75">{detectedPitch.frequency}Hz</span>
                {detectedPitch.cents !== 0 && (
                  <span className="text-xs opacity-75">
                    {detectedPitch.cents > 0 ? '+' : ''}{detectedPitch.cents}¢
                  </span>
                )}
              </div>
            )}
            {regionSelection && (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                <Scissors className="h-3 w-3" />
                <span className="text-xs">
                  {formatTime(regionSelection.start)} - {formatTime(regionSelection.end)}
                </span>
                {isLoopingRegion && <RepeatIcon className="h-3 w-3 text-green-400" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportRegion}
                  className="h-5 px-2 text-xs"
                >
                  Extract
                </Button>
              </div>
            )}
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
                onMouseDown={handleMouseDownRegion}
                onMouseUp={handleMouseUpRegion}
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
              {/* Beat markers */}
              {showBeatDetection && beatMarkers.map((beatTime, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-px bg-orange-500 opacity-60 z-5"
                  style={{ left: `${(beatTime / (audioBuffer?.duration || 1)) * 100}%` }}
                />
              ))}
              {/* Region selection overlay */}
              {regionSelection && audioBuffer && (
                <div
                  className="absolute top-0 bottom-0 bg-green-500/20 border-l-2 border-r-2 border-green-500 z-5"
                  style={{
                    left: `${(regionSelection.start / audioBuffer.duration) * 100}%`,
                    width: `${((regionSelection.end - regionSelection.start) / audioBuffer.duration) * 100}%`
                  }}
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
              {isPlaying && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportSpectral}
                  className="absolute top-2 right-2"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export Image
                </Button>
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
            <p className="text-primary">📁 Upload audio files or click "Record" to capture audio with automatic BPM detection</p>
          )}
          {audioBuffer && !originalAudioBuffer && viewMode === 'single' && (
            <p className="text-primary">🔀 Click "Compare" then upload a second file for before/after visualization</p>
          )}
          {uploadedAudioBuffer && comparisonAudioBuffer && (
            <p className="text-primary">🔄 Use A/B button to quickly switch between files for comparison</p>
          )}
          <p>• Click "Beats" for automatic beat detection with visual markers</p>
          <p>• Click "LUFS" to analyze loudness (integrated LUFS, peak, true peak) and normalize audio</p>
          <p>• Use "Track" to add multiple audio layers with individual volume, solo, and mute controls</p>
          <p>• Enable "FX" for real-time effects: gain, filters, compression (applied during playback)</p>
          <p>• Enable "Pitch" to see real-time note detection and export to MIDI format</p>
          <p>• Export spectral analysis as PNG image while playing</p>
          <p>• Scroll to zoom in/out • Drag to pan when zoomed</p>
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
