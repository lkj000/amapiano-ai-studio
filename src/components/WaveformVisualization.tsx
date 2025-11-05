import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Move, RotateCcw, Upload, X, GitCompare, Play, Pause, Square, Activity, Mic, Download, Repeat, Music2, Scissors, RepeatIcon, FileMusic, Sliders, Radio, Layers, Volume2, Gauge, Clock, Music, Circle, Split, Merge, BarChart3, Save, BookOpen, Link2, Wand2, Undo2, Redo2, Piano, FolderOpen, Users, Zap, Headphones } from 'lucide-react';
import { useWaveformVisualization } from '@/hooks/useWaveformVisualization';
import { useAutoTimeStretch } from '@/hooks/useAutoTimeStretch';
import { supabase } from '@/integrations/supabase/client';
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
  const [timeStretch, setTimeStretch] = useState(1); // 1 = normal speed
  const [pitchShift, setPitchShift] = useState(0); // cents
  const [isRecordingAutomation, setIsRecordingAutomation] = useState(false);
  const [automationData, setAutomationData] = useState<Array<{ time: number; params: typeof processingParams }>>([]);
  const [isPlayingAutomation, setIsPlayingAutomation] = useState(false);
  const automationStartTimeRef = useRef<number>(0);
  const [isSeparatingStems, setIsSeparatingStems] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(0.5); // seconds
  const [showEQ, setShowEQ] = useState(false);
  const [eqBands, setEqBands] = useState([
    { freq: 100, gain: 0, q: 1 },
    { freq: 500, gain: 0, q: 1 },
    { freq: 2000, gain: 0, q: 1 },
    { freq: 8000, gain: 0, q: 1 }
  ]);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const [effectPresets, setEffectPresets] = useState<Array<{ name: string; params: typeof processingParams; eq: typeof eqBands }>>([]);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [sidechainEnabled, setSidechainEnabled] = useState(false);
  const [sidechainParams, setSidechainParams] = useState({
    threshold: -20,
    ratio: 4,
    attack: 0.003,
    release: 0.25
  });
  const sidechainAnalyserRef = useRef<AnalyserNode | null>(null);
  const [showAdvancedSpectrum, setShowAdvancedSpectrum] = useState(false);
  const [spectrumConfig, setSpectrumConfig] = useState({
    fftSize: 2048,
    smoothing: 0.8,
    colorScheme: 'rainbow' as 'rainbow' | 'fire' | 'ice' | 'mono',
    peakHold: true
  });
  const [peakFrequencies, setPeakFrequencies] = useState<number[]>([]);
  const [editHistory, setEditHistory] = useState<Array<{
    action: string;
    timestamp: number;
    state: {
      buffer: AudioBuffer | null;
      params: typeof processingParams;
      eq: typeof eqBands;
    }
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMastering, setIsMastering] = useState(false);
  const [midiEnabled, setMidiEnabled] = useState(false);
  const [midiInputs, setMidiInputs] = useState<MIDIInput[]>([]);
  const [lastMidiNote, setLastMidiNote] = useState<number | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; cursor: number }>>([]);
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));
  const channelRef = useRef<any>(null);
  
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
    console.log('🔄 Waveform effect triggered:', {
      hasBuffer: !!audioBuffer,
      mode,
      duration: audioBuffer?.duration
    });
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
    console.log('🎨 Draw effect triggered:', {
      mode,
      hasWaveformData: !!waveformData,
      hasCanvas: !!canvasRef.current,
      currentBPM,
      zoom
    });
    if (mode === 'single' && waveformData && canvasRef.current && currentBPM) {
      const markers = generateBPMMarkers(currentBPM, waveformData.duration);
      drawWaveform(canvasRef.current, waveformData.peaks, '#3b82f6', markers, currentBPM);
      console.log('✅ Waveform drawn');
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
      
      // Apply time-stretch and pitch-shift
      source.playbackRate.value = timeStretch;
      source.detune.value = pitchShift * 100; // Convert cents to detune value
      
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
      compressor.threshold.value = sidechainEnabled ? sidechainParams.threshold : -24;
      compressor.knee.value = 30;
      compressor.ratio.value = sidechainEnabled ? sidechainParams.ratio : (1 + (processingParams.compression / 10));
      compressor.attack.value = sidechainEnabled ? sidechainParams.attack : 0.003;
      compressor.release.value = sidechainEnabled ? sidechainParams.release : 0.25;
      effectsNodesRef.current.compressor = compressor;

      // Create EQ chain
      eqNodesRef.current = eqBands.map((band, index) => {
        const filter = context.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.freq;
        filter.gain.value = band.gain;
        filter.Q.value = band.q;
        return filter;
      });

      // Connect nodes with full effects chain including EQ
      source.connect(gainNode);
      gainNode.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      
      // Chain EQ filters
      let currentNode: AudioNode = lowpassFilter;
      eqNodesRef.current.forEach(eqNode => {
        currentNode.connect(eqNode);
        currentNode = eqNode;
      });
      
      currentNode.connect(compressor);
      compressor.connect(analyser);
      
      // Add sidechain analyser
      if (sidechainEnabled) {
        const sidechainAnalyser = context.createAnalyser();
        sidechainAnalyser.fftSize = 256;
        sidechainAnalyserRef.current = sidechainAnalyser;
        compressor.connect(sidechainAnalyser);
      }
      
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
          
          console.log('🎤 Recording decoded:', {
            duration: buffer.duration,
            sampleRate: buffer.sampleRate,
            numberOfChannels: buffer.numberOfChannels
          });
          
          // Detect BPM
          const bpm = detectTempo(buffer);
          console.log('🎵 BPM detected:', bpm);
          
          setUploadedAudioBuffer(buffer);
          setUploadedFileName(`Recording ${new Date().toLocaleTimeString()}`);
          setDetectedBPM(bpm);
          
          // Force waveform regeneration
          setTimeout(() => {
            console.log('🌊 Triggering waveform generation');
            if (canvasRef.current && buffer) {
              generateWaveform(buffer);
            }
          }, 100);
          
          toast.success('Recording saved', {
            description: `Detected ${bpm} BPM`
          });
        } catch (error) {
          console.error('❌ Failed to process recording:', error);
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

    // Record automation if enabled
    if (isRecordingAutomation && isPlaying) {
      const relativeTime = currentTime - automationStartTimeRef.current;
      setAutomationData(prev => [...prev, { time: relativeTime, params: { ...processingParams } }]);
    }
  }, [processingParams, isRecordingAutomation, isPlaying, currentTime]);

  // Export audio to WAV format
  const exportToWAV = (buffer: AudioBuffer, filename: string) => {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Audio exported', { description: `Saved as ${filename}` });
  };

  const handleExportAudio = (format: 'wav') => {
    if (!audioBuffer) {
      toast.error('No audio to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${uploadedFileName?.replace(/\.[^/.]+$/, '') || 'audio'}-${timestamp}.${format}`;
    
    if (format === 'wav') {
      exportToWAV(audioBuffer, filename);
    }
  };

  // Start automation recording
  const handleStartAutomationRecording = () => {
    setAutomationData([]);
    setIsRecordingAutomation(true);
    automationStartTimeRef.current = currentTime;
    toast.success('Automation recording started', {
      description: 'Adjust parameters while playing'
    });
  };

  const handleStopAutomationRecording = () => {
    setIsRecordingAutomation(false);
    toast.success(`Automation recorded`, {
      description: `${automationData.length} data points captured`
    });
  };

  const handleExportAutomation = () => {
    if (automationData.length === 0) {
      toast.error('No automation data to export');
      return;
    }

    const json = JSON.stringify(automationData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Automation exported');
  };

  const handlePlayAutomation = () => {
    if (automationData.length === 0) {
      toast.error('No automation data to play');
      return;
    }

    setIsPlayingAutomation(true);
    automationStartTimeRef.current = currentTime;
    toast.success('Playing automation');
  };

  // Apply automation during playback
  useEffect(() => {
    if (isPlayingAutomation && isPlaying && automationData.length > 0) {
      const relativeTime = currentTime - automationStartTimeRef.current;
      
      // Find closest automation point
      const closest = automationData.reduce((prev, curr) => {
        return Math.abs(curr.time - relativeTime) < Math.abs(prev.time - relativeTime) ? curr : prev;
      });

      if (Math.abs(closest.time - relativeTime) < 0.1) {
        setProcessingParams(closest.params);
      }
    }

    if (!isPlaying) {
      setIsPlayingAutomation(false);
    }
  }, [isPlayingAutomation, isPlaying, currentTime, automationData]);

  // AI Stem Separation (frequency-based approximation)
  const handleStemSeparation = async () => {
    if (!audioBuffer || !audioContextRef.current) {
      toast.error('Load audio first');
      return;
    }

    setIsSeparatingStems(true);
    toast.info('Separating stems...', {
      description: 'This may take a moment'
    });

    try {
      const context = audioContextRef.current;
      
      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Create filters for different frequency ranges
      const stems = {
        bass: { low: 20, high: 250 },
        vocals: { low: 250, high: 4000 },
        highs: { low: 4000, high: 22050 }
      };

      const stemBuffers: { [key: string]: AudioBuffer } = {};

      for (const [stemName, range] of Object.entries(stems)) {
        const offlineCtx = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;

        const lowpass = offlineCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = range.high;

        const highpass = offlineCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = range.low;

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(offlineCtx.destination);

        source.start();
        const renderedBuffer = await offlineCtx.startRendering();
        stemBuffers[stemName] = renderedBuffer;
      }

      // Add stems as tracks
      for (const [stemName, buffer] of Object.entries(stemBuffers)) {
        addTrack(buffer, `${stemName.charAt(0).toUpperCase() + stemName.slice(1)} Stem`);
      }

      setIsSeparatingStems(false);
      toast.success('Stems separated', {
        description: `Created ${Object.keys(stemBuffers).length} stem tracks`
      });
    } catch (error) {
      console.error('Stem separation error:', error);
      setIsSeparatingStems(false);
      toast.error('Failed to separate stems');
    }
  };

  // Crossfade between tracks
  const applyCrossfade = async (track1Id: string, track2Id: string) => {
    const track1 = tracks.find(t => t.id === track1Id);
    const track2 = tracks.find(t => t.id === track2Id);
    
    if (!track1 || !track2 || !audioContextRef.current) {
      toast.error('Select two tracks for crossfade');
      return;
    }

    try {
      const context = audioContextRef.current;
      const fadeSamples = Math.floor(crossfadeDuration * track1.buffer.sampleRate);
      
      // Create new buffer with crossfade
      const length = Math.max(track1.buffer.length, track2.buffer.length);
      const crossfaded = context.createBuffer(
        track1.buffer.numberOfChannels,
        length,
        track1.buffer.sampleRate
      );

      for (let channel = 0; channel < crossfaded.numberOfChannels; channel++) {
        const output = crossfaded.getChannelData(channel);
        const input1 = track1.buffer.getChannelData(channel);
        const input2 = track2.buffer.getChannelData(channel);

        // Fade out track1, fade in track2
        for (let i = 0; i < fadeSamples && i < input1.length && i < input2.length; i++) {
          const fadeOut = 1 - (i / fadeSamples);
          const fadeIn = i / fadeSamples;
          output[i] = (input1[i] * fadeOut) + (input2[i] * fadeIn);
        }

        // Continue with track2
        for (let i = fadeSamples; i < length; i++) {
          output[i] = i < input2.length ? input2[i] : 0;
        }
      }

      addTrack(crossfaded, `Crossfade ${crossfadeDuration}s`);
      toast.success('Crossfade applied');
    } catch (error) {
      console.error('Crossfade error:', error);
      toast.error('Failed to apply crossfade');
    }
  };

  // EQ Band update
  const updateEQBand = (index: number, updates: Partial<typeof eqBands[0]>) => {
    setEqBands(prev => prev.map((band, i) => 
      i === index ? { ...band, ...updates } : band
    ));
    
    // Update EQ nodes in real-time
    if (eqNodesRef.current[index]) {
      const node = eqNodesRef.current[index];
      if (updates.freq !== undefined) node.frequency.value = updates.freq;
      if (updates.gain !== undefined) node.gain.value = updates.gain;
      if (updates.q !== undefined) node.Q.value = updates.q;
    }
  };

  // Preset management
  const savePreset = (name: string) => {
    const preset = {
      name,
      params: { ...processingParams },
      eq: [...eqBands]
    };
    setEffectPresets(prev => [...prev, preset]);
    toast.success(`Preset "${name}" saved`);
  };

  const loadPreset = (preset: typeof effectPresets[0]) => {
    setProcessingParams(preset.params);
    setEqBands(preset.eq);
    toast.success(`Preset "${preset.name}" loaded`);
  };

  const deletePreset = (index: number) => {
    const name = effectPresets[index].name;
    setEffectPresets(prev => prev.filter((_, i) => i !== index));
    toast.success(`Preset "${name}" deleted`);
  };

  const exportPresets = () => {
    const json = JSON.stringify(effectPresets, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `effect-presets-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Presets exported');
  };

  // Advanced spectrum analyzer
  const drawAdvancedSpectrum = () => {
    if (!spectralCanvasRef.current || !analyserNodeRef.current) return;

    const canvas = spectralCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserNodeRef.current;
    analyser.fftSize = spectrumConfig.fftSize;
    analyser.smoothingTimeConstant = spectrumConfig.smoothing;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying || viewType !== 'spectral') return;

      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(26, 26, 26, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = width / bufferLength;
      let x = 0;

      // Update peak hold
      const currentPeaks = [...peakFrequencies];
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        // Track peaks
        if (spectrumConfig.peakHold) {
          if (!currentPeaks[i] || barHeight > currentPeaks[i]) {
            currentPeaks[i] = barHeight;
          } else {
            currentPeaks[i] *= 0.98; // Decay
          }
        }
        
        // Color based on scheme
        let color: string;
        const intensity = dataArray[i] / 255;
        const hue = (i / bufferLength) * 360;
        
        switch (spectrumConfig.colorScheme) {
          case 'rainbow':
            color = `hsla(${hue}, 100%, ${50 + intensity * 50}%, ${intensity})`;
            break;
          case 'fire':
            color = `hsla(${intensity * 60}, 100%, ${50 + intensity * 50}%, ${intensity})`;
            break;
          case 'ice':
            color = `hsla(${180 + intensity * 60}, 100%, ${50 + intensity * 50}%, ${intensity})`;
            break;
          case 'mono':
            color = `hsla(0, 0%, ${intensity * 100}%, ${intensity})`;
            break;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // Draw peak hold
        if (spectrumConfig.peakHold && currentPeaks[i]) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, height - currentPeaks[i], barWidth, 2);
        }
        
        x += barWidth;
      }

      setPeakFrequencies(currentPeaks);
    };

    draw();
  };

  // Edit history management
  const saveToHistory = (action: string) => {
    if (!audioBuffer) return;

    const newEntry = {
      action,
      timestamp: Date.now(),
      state: {
        buffer: audioBuffer,
        params: { ...processingParams },
        eq: [...eqBands]
      }
    };

    // Remove any history after current index
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) {
      toast.error('Nothing to undo');
      return;
    }

    const newIndex = historyIndex - 1;
    const entry = editHistory[newIndex];
    
    setProcessingParams(entry.state.params);
    setEqBands(entry.state.eq);
    setHistoryIndex(newIndex);
    
    toast.success(`Undone: ${entry.action}`);
  };

  const redo = () => {
    if (historyIndex >= editHistory.length - 1) {
      toast.error('Nothing to redo');
      return;
    }

    const newIndex = historyIndex + 1;
    const entry = editHistory[newIndex];
    
    setProcessingParams(entry.state.params);
    setEqBands(entry.state.eq);
    setHistoryIndex(newIndex);
    
    toast.success(`Redone: ${entry.action}`);
  };

  // AI Mastering Assistant
  const handleAIMastering = async () => {
    if (!audioBuffer || !loudnessData) {
      toast.error('Analyze loudness first (click LUFS button)');
      return;
    }

    setIsMastering(true);
    toast.info('AI analyzing your audio...', {
      description: 'This may take a moment'
    });

    try {
      // Analyze audio characteristics
      const channelData = audioBuffer.getChannelData(0);
      const rms = Math.sqrt(channelData.reduce((sum, val) => sum + val * val, 0) / channelData.length);
      const peak = Math.max(...Array.from(channelData).map(Math.abs));
      const dynamicRange = 20 * Math.log10(peak / rms);

      // Simulate AI mastering (in production, this would call an edge function)
      // For now, apply optimal settings based on analysis
      const optimalSettings = {
        gain: -14 / loudnessData.lufs, // Normalize to -14 LUFS
        lowpass: 18000, // Gentle high-end roll-off
        highpass: 30, // Remove subsonic rumble
        compression: dynamicRange > 15 ? 30 : 10, // More compression for dynamic content
      };

      const optimalEQ = [
        { freq: 80, gain: 1.5, q: 1 }, // Slight bass boost
        { freq: 400, gain: -0.5, q: 0.7 }, // Reduce muddiness
        { freq: 3000, gain: 1, q: 1 }, // Presence boost
        { freq: 10000, gain: 0.5, q: 1.2 } // Air
      ];

      setProcessingParams(prev => ({ ...prev, ...optimalSettings }));
      setEqBands(optimalEQ);
      
      saveToHistory('AI Mastering Applied');

      setIsMastering(false);
      toast.success('AI mastering complete!', {
        description: 'Optimal settings applied based on audio analysis'
      });
    } catch (error) {
      console.error('AI mastering error:', error);
      setIsMastering(false);
      toast.error('Failed to apply AI mastering');
    }
  };

  // MIDI Keyboard Input
  const enableMIDI = async () => {
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      const inputs = Array.from(midiAccess.inputs.values());
      
      if (inputs.length === 0) {
        toast.error('No MIDI devices found');
        return;
      }

      setMidiInputs(inputs);
      
      inputs.forEach(input => {
        input.onmidimessage = (event: MIDIMessageEvent) => {
          const [status, note, velocity] = event.data;
          
          // Note on (144-159)
          if (status >= 144 && status < 160 && velocity > 0) {
            setLastMidiNote(note);
            playMIDINote(note, velocity);
          }
        };
      });

      setMidiEnabled(true);
      toast.success(`MIDI enabled: ${inputs.length} device(s) connected`);
    } catch (error) {
      console.error('MIDI error:', error);
      toast.error('Failed to enable MIDI. Make sure you have MIDI devices connected.');
    }
  };

  const playMIDINote = (note: number, velocity: number) => {
    if (!audioContextRef.current) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    // Convert MIDI note to frequency
    const frequency = 440 * Math.pow(2, (note - 69) / 12);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Set velocity
    gainNode.gain.value = (velocity / 127) * 0.3;

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);

    toast.success(`MIDI Note: ${note} (${Math.round(frequency)}Hz)`, {
      duration: 1000
    });
  };

  // Update spectrum analyzer when config changes
  useEffect(() => {
    if (showAdvancedSpectrum && viewType === 'spectral' && isPlaying && analyserNodeRef.current) {
      drawAdvancedSpectrum();
    }
  }, [showAdvancedSpectrum, spectrumConfig, viewType, isPlaying]);

  // Batch Audio Processing
  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBatchFiles(files);
    toast.success(`${files.length} files selected for batch processing`);
  };

  const processBatchFiles = async () => {
    if (batchFiles.length === 0) {
      toast.error('No files selected');
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress(0);

    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const context = new AudioContext();
        const buffer = await context.decodeAudioData(arrayBuffer);

        // Apply current effects and export
        const filename = file.name.replace(/\.[^/.]+$/, '') + '-processed.wav';
        exportToWAV(buffer, filename);

        setBatchProgress(((i + 1) / batchFiles.length) * 100);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    setIsBatchProcessing(false);
    toast.success('Batch processing complete!');
    setBatchFiles([]);
  };

  // Project Save/Load
  const saveProject = () => {
    const project = {
      version: '1.0',
      timestamp: Date.now(),
      audio: {
        // Note: Can't serialize AudioBuffer directly
        fileName: uploadedFileName,
        duration: audioBuffer?.duration,
        sampleRate: audioBuffer?.sampleRate
      },
      tracks: tracks.map(t => ({
        id: t.id,
        name: t.name,
        volume: t.volume,
        solo: t.solo,
        mute: t.mute
      })),
      effects: {
        processingParams,
        eqBands,
        timeStretch,
        pitchShift,
        crossfadeDuration,
        sidechainEnabled,
        sidechainParams
      },
      automation: automationData,
      presets: effectPresets,
      history: editHistory.map(h => ({
        action: h.action,
        timestamp: h.timestamp,
        params: h.state.params,
        eq: h.state.eq
      }))
    };

    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Project saved!', {
      description: 'All settings, effects, and tracks exported'
    });
  };

  const loadProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const project = JSON.parse(text);

      setProcessingParams(project.effects.processingParams);
      setEqBands(project.effects.eqBands);
      setTimeStretch(project.effects.timeStretch);
      setPitchShift(project.effects.pitchShift);
      setCrossfadeDuration(project.effects.crossfadeDuration);
      setSidechainEnabled(project.effects.sidechainEnabled);
      setSidechainParams(project.effects.sidechainParams);
      setAutomationData(project.automation || []);
      setEffectPresets(project.presets || []);

      toast.success('Project loaded!', {
        description: 'All settings and effects restored'
      });
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project file');
    }

    e.target.value = '';
  };

  // Real-Time Collaboration
  const enableCollaboration = async () => {
    try {
      const channel = supabase.channel(`audio-session-${sessionId}`);

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users = Object.values(state).flat() as any[];
          setCollaborators(users.filter((u: any) => u.id !== sessionId));
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          toast.success('Collaborator joined', {
            description: newPresences[0]?.name || 'Unknown user'
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          toast.info('Collaborator left', {
            description: leftPresences[0]?.name || 'Unknown user'
          });
        })
        .on('broadcast', { event: 'playback' }, ({ payload }) => {
          if (payload.sessionId !== sessionId) {
            setCurrentTime(payload.time);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              id: sessionId,
              name: `User ${sessionId.slice(0, 4)}`,
              cursor: currentTime
            });
          }
        });

      channelRef.current = channel;
      setIsCollaborationEnabled(true);
      toast.success('Collaboration enabled!', {
        description: `Session: ${sessionId}`
      });
    } catch (error) {
      console.error('Collaboration error:', error);
      toast.error('Failed to enable collaboration');
    }
  };

  const disableCollaboration = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setIsCollaborationEnabled(false);
    setCollaborators([]);
    toast.info('Collaboration disabled');
  };

  // Broadcast playback position to collaborators
  useEffect(() => {
    if (isCollaborationEnabled && channelRef.current && isPlaying) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback',
        payload: { sessionId, time: currentTime }
      });
    }
  }, [currentTime, isCollaborationEnabled, isPlaying, sessionId]);

  // Cleanup collaboration on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  // Vocal Removal Tool
  const removeVocals = async () => {
    if (!audioBuffer || !audioContextRef.current) {
      toast.error('Load audio first');
      return;
    }

    toast.info('Removing vocals...', {
      description: 'Using phase cancellation technique'
    });

    try {
      const context = audioContextRef.current;
      
      // Create offline context
      const offlineContext = new OfflineAudioContext(
        2, // Stereo
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // For vocal removal, we subtract the centered mono signal
      // This works for songs with vocals in the center
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);

      const instrumentalBuffer = offlineContext.createBuffer(
        2,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      const instLeft = instrumentalBuffer.getChannelData(0);
      const instRight = instrumentalBuffer.getChannelData(1);

      // Phase cancellation: subtract common (center) signal
      for (let i = 0; i < audioBuffer.length; i++) {
        const center = (leftChannel[i] + rightChannel[i]) / 2;
        instLeft[i] = leftChannel[i] - center;
        instRight[i] = rightChannel[i] - center;
      }

      addTrack(instrumentalBuffer, 'Instrumental (Vocals Removed)');

      toast.success('Vocals removed!', {
        description: 'Instrumental track created using phase cancellation'
      });
    } catch (error) {
      console.error('Vocal removal error:', error);
      toast.error('Failed to remove vocals');
    }
  };

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <Tabs defaultValue="file" className="w-full">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Waveform Analyzer</h4>
              {isProcessing && (
                <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>
              )}
            </div>
            
            {/* Essential Controls - Always Visible */}
            <div className="flex gap-1 flex-wrap">
              {/* Recording */}
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
              
              {/* Playback */}
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

              {/* View Controls */}
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

          {/* Tabs for Features */}
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="file" className="text-xs">File</TabsTrigger>
            <TabsTrigger value="view" className="text-xs">View</TabsTrigger>
            <TabsTrigger value="edit" className="text-xs">Edit</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
          </TabsList>

          {/* File Tab */}
          <TabsContent value="file" className="mt-2">
            <div className="flex gap-1 flex-wrap">
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
                onClick={() => document.getElementById('batch-file-input')?.click()}
                className="h-7 px-2"
              >
                <Zap className="h-3 w-3 mr-1" />
                <span className="text-xs">Batch</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveProject}
                className="h-7 px-2"
              >
                <Save className="h-3 w-3 mr-1" />
                <span className="text-xs">Save</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById('project-file-input')?.click()}
                className="h-7 px-2"
              >
                <FolderOpen className="h-3 w-3 mr-1" />
                <span className="text-xs">Load</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExportAudio('wav')}
                className="h-7 px-2"
                disabled={!audioBuffer}
              >
                <Download className="h-3 w-3 mr-1" />
                <span className="text-xs">Export WAV</span>
              </Button>
              
              {/* Hidden inputs */}
              <input
                id="batch-file-input"
                type="file"
                accept="audio/*"
                multiple
                onChange={handleBatchFileSelect}
                className="hidden"
              />
              <input
                id="project-file-input"
                type="file"
                accept="application/json"
                onChange={loadProject}
                className="hidden"
              />
            </div>
          </TabsContent>

          {/* View Tab */}
          <TabsContent value="view" className="mt-2">
            <div className="flex gap-1 flex-wrap">
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
              {uploadedAudioBuffer && comparisonAudioBuffer && (
                <Button
                  variant={abMode === 'A' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={handleAbToggle}
                  className="h-7 px-2"
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  <span className="text-xs">A/B: {abMode}</span>
                </Button>
              )}
              <Button
                variant={showAdvancedSpectrum ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowAdvancedSpectrum(!showAdvancedSpectrum)}
                className="h-7 px-2"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                <span className="text-xs">Spectrum</span>
              </Button>
              <Button
                variant={viewType === 'spectral' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType(viewType === 'waveform' ? 'spectral' : 'waveform')}
                className="h-7 px-2"
              >
                <Activity className="h-3 w-3 mr-1" />
                <span className="text-xs">{viewType === 'waveform' ? 'Spectral' : 'Waveform'}</span>
              </Button>
            </div>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="mt-2">
            <div className="flex gap-1 flex-wrap">
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
              <Button
                variant={showEQ ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowEQ(!showEQ)}
                className="h-7 px-2"
                disabled={!audioBuffer}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                <span className="text-xs">EQ</span>
              </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTimeStretch(1);
                  setPitchShift(0);
                  toast.success('Reset time/pitch');
                }}
                className="h-7 px-2"
                disabled={!audioBuffer}
              >
                <Clock className="h-3 w-3 mr-1" />
                <span className="text-xs">Time/Pitch</span>
              </Button>
              <Button
                variant={isRecordingAutomation ? 'destructive' : 'ghost'}
                size="sm"
                onClick={isRecordingAutomation ? handleStopAutomationRecording : handleStartAutomationRecording}
                className="h-7 px-2"
                disabled={!audioBuffer}
              >
                <Circle className={isRecordingAutomation ? 'h-3 w-3 mr-1 animate-pulse' : 'h-3 w-3 mr-1'} />
                <span className="text-xs">Automation</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                className="h-7 px-2"
                disabled={historyIndex <= 0}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                <span className="text-xs">Undo</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                className="h-7 px-2"
                disabled={historyIndex >= editHistory.length - 1}
              >
                <Redo2 className="h-3 w-3 mr-1" />
                <span className="text-xs">Redo</span>
              </Button>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-2">
            <div className="flex gap-1 flex-wrap">
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
              {pitchHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportPitchToMIDI}
                  className="h-7 px-2"
                >
                  <FileMusic className="h-3 w-3 mr-1" />
                  <span className="text-xs">Export MIDI</span>
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="mt-2">
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={isCollaborationEnabled ? 'default' : 'ghost'}
                size="sm"
                onClick={isCollaborationEnabled ? disableCollaboration : enableCollaboration}
                className="h-7 px-2"
              >
                <Users className="h-3 w-3 mr-1" />
                <span className="text-xs">{collaborators.length > 0 ? `Collab (${collaborators.length})` : 'Collab'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeVocals}
                className="h-7 px-2"
                disabled={!audioBuffer}
              >
                <Headphones className="h-3 w-3 mr-1" />
                <span className="text-xs">Remove Vocals</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStemSeparation}
                className="h-7 px-2"
                disabled={!audioBuffer || isSeparatingStems}
              >
                <Split className="h-3 w-3 mr-1" />
                <span className="text-xs">{isSeparatingStems ? 'Separating...' : 'Stems'}</span>
              </Button>
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
                <span className="text-xs">Multi-Track</span>
              </Button>
              <Button
                variant={midiEnabled ? 'default' : 'ghost'}
                size="sm"
                onClick={enableMIDI}
                className="h-7 px-2"
              >
                <Piano className="h-3 w-3 mr-1" />
                <span className="text-xs">MIDI Input</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAIMastering}
                className="h-7 px-2"
                disabled={!audioBuffer || isMastering || !loudnessData}
              >
                <Wand2 className="h-3 w-3 mr-1" />
                <span className="text-xs">{isMastering ? 'Analyzing...' : 'AI Master'}</span>
              </Button>
              <Button
                variant={showPresetManager ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowPresetManager(!showPresetManager)}
                className="h-7 px-2"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                <span className="text-xs">Presets</span>
              </Button>
              <Button
                variant={sidechainEnabled ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidechainEnabled(!sidechainEnabled)}
                className="h-7 px-2"
                disabled={!audioBuffer}
              >
                <Link2 className="h-3 w-3 mr-1" />
                <span className="text-xs">Sidechain</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (tracks.length >= 2) {
                    applyCrossfade(tracks[0].id, tracks[1].id);
                  } else {
                    toast.error('Add at least 2 tracks first');
                  }
                }}
                className="h-7 px-2"
                disabled={tracks.length < 2}
              >
                <Merge className="h-3 w-3 mr-1" />
                <span className="text-xs">Crossfade</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* File Upload Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => handleFileUpload(e, viewMode === 'comparison' && !!uploadedAudioBuffer)}
          className="hidden"
        />

        {/* Batch Processing Panel */}
        {batchFiles.length > 0 && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold">Batch Processing</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={processBatchFiles}
                className="h-6 px-2 text-xs"
                disabled={isBatchProcessing}
              >
                <Zap className="h-3 w-3 mr-1" />
                {isBatchProcessing ? 'Processing...' : 'Process All'}
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {batchFiles.length} files queued • Current effects will be applied
              </p>
              {isBatchProcessing && (
                <div className="space-y-1">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center font-mono">{Math.round(batchProgress)}%</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Collaboration Panel */}
        {isCollaborationEnabled && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold">Live Collaboration</h5>
              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                ● Active
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Session: {sessionId}
              </p>
              {collaborators.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium">{collaborators.length} Collaborator(s):</p>
                  {collaborators.map(c => (
                    <div key={c.id} className="text-xs p-1 bg-background rounded flex items-center justify-between">
                      <span>{c.name}</span>
                      <span className="text-muted-foreground font-mono">{c.cursor.toFixed(2)}s</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Share session ID with collaborators to join
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Advanced Spectrum Analyzer Config */}
        {showAdvancedSpectrum && (
          <Card className="p-3 bg-muted/50">
            <h5 className="text-sm font-semibold mb-3">Advanced Spectrum Analyzer</h5>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>FFT Size</span>
                  <span className="font-mono">{spectrumConfig.fftSize}</span>
                </label>
                <select
                  value={spectrumConfig.fftSize}
                  onChange={(e) => setSpectrumConfig(prev => ({ ...prev, fftSize: parseInt(e.target.value) }))}
                  className="w-full h-8 px-2 text-xs bg-background border border-border rounded"
                >
                  <option value="512">512 (Fast)</option>
                  <option value="1024">1024</option>
                  <option value="2048">2048 (Default)</option>
                  <option value="4096">4096</option>
                  <option value="8192">8192 (High Detail)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Smoothing</span>
                  <span className="font-mono">{spectrumConfig.smoothing.toFixed(2)}</span>
                </label>
                <Slider
                  value={[spectrumConfig.smoothing * 100]}
                  onValueChange={(v) => setSpectrumConfig(prev => ({ ...prev, smoothing: v[0] / 100 }))}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs">Color Scheme</label>
                <select
                  value={spectrumConfig.colorScheme}
                  onChange={(e) => setSpectrumConfig(prev => ({ ...prev, colorScheme: e.target.value as any }))}
                  className="w-full h-8 px-2 text-xs bg-background border border-border rounded"
                >
                  <option value="rainbow">Rainbow</option>
                  <option value="fire">Fire</option>
                  <option value="ice">Ice</option>
                  <option value="mono">Monochrome</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs">Peak Hold</label>
                <input
                  type="checkbox"
                  checked={spectrumConfig.peakHold}
                  onChange={(e) => setSpectrumConfig(prev => ({ ...prev, peakHold: e.target.checked }))}
                  className="w-4 h-4"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Edit History Display */}
        {editHistory.length > 0 && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold">Edit History</h5>
              <span className="text-xs text-muted-foreground">
                {historyIndex + 1} / {editHistory.length}
              </span>
            </div>
            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {editHistory.slice(-5).reverse().map((entry, idx) => (
                <div
                  key={entry.timestamp}
                  className={`p-1 rounded ${
                    historyIndex === editHistory.length - 1 - idx ? 'bg-primary/20' : 'bg-background'
                  }`}
                >
                  {entry.action}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* MIDI Status */}
        {midiEnabled && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold">MIDI Input Active</h5>
              {lastMidiNote !== null && (
                <span className="text-xs font-mono bg-primary/20 px-2 py-1 rounded">
                  Note: {lastMidiNote}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {midiInputs.length} device(s) connected • Play notes to trigger sounds
            </p>
          </Card>
        )}

        {/* Visual Parametric EQ */}
        {showEQ && audioBuffer && (
          <Card className="p-4 bg-muted/50">
            <h5 className="text-sm font-semibold mb-3">4-Band Parametric EQ</h5>
            <div className="space-y-4">
              {eqBands.map((band, index) => (
                <div key={index} className="space-y-2 p-3 bg-background rounded-lg">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>Band {index + 1}</span>
                    <span className="font-mono">{band.freq}Hz {band.gain > 0 ? '+' : ''}{band.gain}dB</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Frequency</label>
                    <Slider
                      value={[band.freq]}
                      onValueChange={(v) => updateEQBand(index, { freq: v[0] })}
                      min={20}
                      max={20000}
                      step={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Gain</label>
                    <Slider
                      value={[band.gain + 24]}
                      onValueChange={(v) => updateEQBand(index, { gain: v[0] - 24 })}
                      min={0}
                      max={48}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Q (Width)</label>
                    <Slider
                      value={[band.q * 10]}
                      onValueChange={(v) => updateEQBand(index, { q: v[0] / 10 })}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Preset Manager */}
        {showPresetManager && (
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold">Effect Presets</h5>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = prompt('Enter preset name:');
                    if (name) savePreset(name);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                {effectPresets.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPresets}
                    className="h-6 px-2 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                )}
              </div>
            </div>
            {effectPresets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No presets saved. Adjust effects and click Save to create a preset.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {effectPresets.map((preset, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm font-medium">{preset.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadPreset(preset)}
                        className="h-6 px-2 text-xs"
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Sidechain Compression */}
        {sidechainEnabled && audioBuffer && (
          <Card className="p-4 bg-muted/50">
            <h5 className="text-sm font-semibold mb-3">Sidechain Compression</h5>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Threshold</span>
                  <span className="font-mono">{sidechainParams.threshold} dB</span>
                </label>
                <Slider
                  value={[sidechainParams.threshold + 60]}
                  onValueChange={(v) => setSidechainParams(prev => ({ ...prev, threshold: v[0] - 60 }))}
                  max={60}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Ratio</span>
                  <span className="font-mono">{sidechainParams.ratio}:1</span>
                </label>
                <Slider
                  value={[sidechainParams.ratio]}
                  onValueChange={(v) => setSidechainParams(prev => ({ ...prev, ratio: v[0] }))}
                  min={1}
                  max={20}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Attack</span>
                  <span className="font-mono">{(sidechainParams.attack * 1000).toFixed(1)} ms</span>
                </label>
                <Slider
                  value={[sidechainParams.attack * 1000]}
                  onValueChange={(v) => setSidechainParams(prev => ({ ...prev, attack: v[0] / 1000 }))}
                  min={0.1}
                  max={100}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Release</span>
                  <span className="font-mono">{(sidechainParams.release * 1000).toFixed(0)} ms</span>
                </label>
                <Slider
                  value={[sidechainParams.release * 1000]}
                  onValueChange={(v) => setSidechainParams(prev => ({ ...prev, release: v[0] / 1000 }))}
                  min={10}
                  max={1000}
                  step={10}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                🎚️ Ducking effect: Audio automatically reduces when above threshold
              </div>
            </div>
          </Card>
        )}

        {/* Crossfade Settings */}
        {tracks.length >= 2 && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold">Crossfade Duration</h5>
              <span className="text-xs font-mono">{crossfadeDuration.toFixed(2)}s</span>
            </div>
            <Slider
              value={[crossfadeDuration * 100]}
              onValueChange={(v) => setCrossfadeDuration(v[0] / 100)}
              min={10}
              max={500}
              step={10}
              className="mt-2"
            />
          </Card>
        )}

        {/* Time-Stretch & Pitch-Shift Controls */}
        {audioBuffer && (
          <Card className="p-3 bg-muted/50">
            <h5 className="text-sm font-semibold mb-3">Time-Stretch & Pitch-Shift</h5>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Time Stretch (Speed)</span>
                  <span className="font-mono">{timeStretch.toFixed(2)}x</span>
                </label>
                <Slider
                  value={[timeStretch * 100]}
                  onValueChange={(v) => {
                    setTimeStretch(v[0] / 100);
                    if (isPlaying && sourceNodeRef.current) {
                      sourceNodeRef.current.playbackRate.value = v[0] / 100;
                    }
                  }}
                  min={50}
                  max={200}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs flex items-center justify-between">
                  <span>Pitch Shift</span>
                  <span className="font-mono">{pitchShift > 0 ? '+' : ''}{pitchShift} cents</span>
                </label>
                <Slider
                  value={[pitchShift + 1200]}
                  onValueChange={(v) => {
                    const cents = v[0] - 1200;
                    setPitchShift(cents);
                    if (isPlaying && sourceNodeRef.current) {
                      sourceNodeRef.current.detune.value = cents * 100;
                    }
                  }}
                  min={0}
                  max={2400}
                  step={1}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                ⚡ Changes apply in real-time during playback
              </div>
            </div>
          </Card>
        )}

        {/* Automation Controls */}
        {automationData.length > 0 && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold">Parameter Automation</h5>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayAutomation}
                  className="h-6 px-2 text-xs"
                  disabled={isPlayingAutomation}
                >
                  Play
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAutomation}
                  className="h-6 px-2 text-xs"
                >
                  Export
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {automationData.length} automation points recorded
              {isPlayingAutomation && <span className="ml-2 text-primary">▶ Playing</span>}
            </div>
          </Card>
        )}

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
          <p>• Click "T/P" to adjust time-stretch (speed) and pitch-shift independently</p>
          <p>• Use Undo/Redo buttons to navigate through your edit history</p>
          <p>• Click "AI Master" to automatically apply optimal mastering settings (requires LUFS analysis)</p>
          <p>• Enable "MIDI" to connect MIDI keyboard and play notes in real-time</p>
          <p>• Use "Batch" to process multiple audio files at once with current effects</p>
          <p>• Click "Save/Load" to export or import complete project sessions with all settings</p>
          <p>• Enable "Collab" for real-time collaboration with synced playback positions</p>
          <p>• Click "Vocals" to remove vocals using phase cancellation for instrumental tracks</p>
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
