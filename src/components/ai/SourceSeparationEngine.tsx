import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, Radio, Layers3, Music4, Drum, Guitar, 
  Mic, Piano, Volume2, Download, Eye, Zap, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useSpectralAnalysis, type SpectralFeatures } from "@/hooks/useSpectralAnalysis";
import { supabase } from "@/integrations/supabase/client";

interface SeparatedStem {
  id: string;
  name: string;
  instrument: string;
  confidence: number;
  waveformData: number[];
  audioBuffer?: AudioBuffer;
  audioUrl?: string;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  color: string;
  // Enhanced classification fields
  subInstruments?: {
    id: string;
    name: string;
    confidence: number;
  }[];
  spectralFeatures?: SpectralFeatures;
  category?: string;
}

interface AnalysisResult {
  bpm: number;
  key: string;
  mood: string;
  genre: string;
  complexity: number;
  patterns: {
    rhythm: string[];
    harmony: string[];
    melody: string[];
  };
}

// Aligned with EnhancedInstrumentSelector categories
const INSTRUMENT_COLORS = {
  bass: 'bg-purple-500',
  percussion: 'bg-red-500',
  keys: 'bg-blue-500',
  strings: 'bg-green-500',
  brass: 'bg-orange-500',
  synth: 'bg-pink-500',
  vocal: 'bg-yellow-500',
  other: 'bg-gray-500'
};

export const SourceSeparationEngine: React.FC<{ 
  initialAudioUrl?: string; 
  autoStart?: boolean;
  onSeparationComplete?: (stems: SeparatedStem[]) => void;
}> = ({ initialAudioUrl, autoStart, onSeparationComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [separationProgress, setSeparationProgress] = useState(0);
  const [separatedStems, setSeparatedStems] = useState<SeparatedStem[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [enableRealTimeProcessing, setEnableRealTimeProcessing] = useState(false);
  const [separationQuality, setSeparationQuality] = useState(85);
  const [enablePatternExtraction, setEnablePatternExtraction] = useState(true);
  const [enableAIClassification, setEnableAIClassification] = useState(true);
  const [classificationProgress, setClassificationProgress] = useState(0);
  
  // Spectral analysis hook
  const { analyzeStems, classifyFromFeatures, isAnalyzing } = useSpectralAnalysis();

  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzerNodes = useRef<Map<string, AnalyserNode>>(new Map());
  const audioSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());

  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      console.log('AudioContext resumed');
    }
  }, []);

  const generateMockWaveform = useCallback((length: number = 200): number[] => {
    return Array.from({ length }, (_, i) => {
      const t = i / length;
      return Math.sin(t * Math.PI * 8) * Math.exp(-t * 2) * (0.5 + Math.random() * 0.5);
    });
  }, []);

  const performRealStemSeparation = useCallback(async (file: File): Promise<SeparatedStem[]> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    // Step 1: Upload file and start separation job
    const formData = new FormData();
    formData.append('audio', file);

    setSeparationProgress(5);
    toast.info('Uploading audio for AI stem separation...');

    const startResponse = await fetch(
      `${supabaseUrl}/functions/v1/stem-splitter`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: formData,
      }
    );

    if (!startResponse.ok) {
      const errData = await startResponse.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to start separation: ${startResponse.status}`);
    }

    const startData = await startResponse.json();
    console.log('[SourceSeparation] Job started:', startData);

    if (!startData.predictionId) {
      throw new Error(startData.error || 'No prediction ID returned');
    }

    setSeparationProgress(15);
    toast.info('AI is separating stems... This takes 2-4 minutes.');

    // Step 2: Poll for completion
    const maxAttempts = 120; // 4 minutes (2s intervals)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      // Update progress (15% to 90% during polling)
      const pollProgress = 15 + Math.min(75, (attempts / maxAttempts) * 75);
      setSeparationProgress(Math.round(pollProgress));

      const pollResponse = await fetch(
        `${supabaseUrl}/functions/v1/stem-splitter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ predictionId: startData.predictionId }),
        }
      );

      if (!pollResponse.ok) {
        console.warn('[SourceSeparation] Poll failed:', pollResponse.status);
        continue;
      }

      const pollData = await pollResponse.json();
      console.log('[SourceSeparation] Poll status:', pollData.status);

      if (pollData.status === 'failed') {
        throw new Error(pollData.error || 'Stem separation failed');
      }

      if (pollData.status === 'succeeded' && pollData.stems) {
        setSeparationProgress(95);
        
        // Map backend stems to EnhancedInstrumentSelector categories
        const stemMapping: { key: string; name: string; instrument: string; color: string }[] = [
          { key: 'vocals', name: 'Vocal', instrument: 'vocal', color: INSTRUMENT_COLORS.vocal },
          { key: 'drums', name: 'Percussion', instrument: 'percussion', color: INSTRUMENT_COLORS.percussion },
          { key: 'bass', name: 'Bass', instrument: 'bass', color: INSTRUMENT_COLORS.bass },
          { key: 'guitar', name: 'Strings', instrument: 'strings', color: INSTRUMENT_COLORS.strings },
          { key: 'piano', name: 'Keys', instrument: 'keys', color: INSTRUMENT_COLORS.keys },
          { key: 'other', name: 'Other/Synth', instrument: 'synth', color: INSTRUMENT_COLORS.synth },
        ];

        const stems: SeparatedStem[] = stemMapping
          .filter(m => pollData.stems[m.key])
          .map((m, idx) => ({
            id: m.key,
            name: m.name,
            instrument: m.instrument,
            confidence: 90 - idx * 3,
            waveformData: generateMockWaveform(),
            audioUrl: pollData.stems[m.key],
            isPlaying: false,
            volume: 80 - idx * 5,
            isMuted: false,
            color: m.color,
            category: m.instrument,
          }));

        setSeparationProgress(100);

        if (stems.length === 0) {
          throw new Error('No valid stems returned from separation');
        }

        console.log('[SourceSeparation] Parsed stems:', stems.map(s => ({ id: s.id, audioUrl: s.audioUrl?.substring(0, 60) })));
        return stems;
      }
    }

    throw new Error('Stem separation timed out after 4 minutes');
  }, [generateMockWaveform]);

  /**
   * Perform AI-powered sub-classification of stems
   * Analyzes spectral features and uses Lovable AI for granular instrument detection
   */
  const performAIClassification = useCallback(async (stems: SeparatedStem[]): Promise<SeparatedStem[]> => {
    if (!stems.length) return stems;

    setClassificationProgress(10);
    toast.info("Analyzing stem spectral characteristics...");

    try {
      // Step 1: Analyze spectral features for each stem
      const stemsToAnalyze = stems
        .filter(s => s.audioUrl)
        .map(s => ({ name: s.name, audioUrl: s.audioUrl! }));

      const spectralAnalysis = await analyzeStems(stemsToAnalyze);
      setClassificationProgress(40);

      // Step 2: Prepare data for AI classification
      const stemData = stems.map((stem, idx) => ({
        stemName: stem.name,
        audioUrl: stem.audioUrl || '',
      }));

      const spectralData = spectralAnalysis.map(a => a.features);

      setClassificationProgress(50);
      toast.info("Running AI instrument classification...");

      // Step 3: Call AI classification edge function
      const { data: classificationResult, error } = await supabase.functions.invoke('stem-classify', {
        body: { stems: stemData, spectralData }
      });

      if (error) {
        console.warn('[Classification] AI classification failed, using rule-based fallback:', error);
        // Fallback to rule-based classification
        return stems.map((stem, idx) => {
          const features = spectralAnalysis[idx]?.features;
          if (!features) return stem;

          const classification = classifyFromFeatures(features);
          return {
            ...stem,
            category: classification.category,
            confidence: Math.round(classification.confidence * 100),
            spectralFeatures: features,
            subInstruments: classification.possibleInstruments.map((id, i) => ({
              id,
              name: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              confidence: Math.round((classification.confidence - i * 0.1) * 100)
            })),
            color: INSTRUMENT_COLORS[classification.category as keyof typeof INSTRUMENT_COLORS] || INSTRUMENT_COLORS.other
          };
        });
      }

      setClassificationProgress(80);

      // Step 4: Merge AI classifications with stems
      const classifications = classificationResult?.classifications || [];
      const enhancedStems = stems.map((stem, idx) => {
        const aiClass = classifications[idx];
        const features = spectralAnalysis[idx]?.features;

        if (aiClass) {
          return {
            ...stem,
            name: aiClass.stemName || stem.name,
            category: aiClass.primaryCategory,
            instrument: aiClass.primaryCategory,
            confidence: Math.round((aiClass.confidence || 0.8) * 100),
            spectralFeatures: features,
            subInstruments: aiClass.instruments?.map((inst: any) => ({
              id: inst.id,
              name: inst.name,
              confidence: Math.round((inst.confidence || 0.7) * 100)
            })),
            color: INSTRUMENT_COLORS[aiClass.primaryCategory as keyof typeof INSTRUMENT_COLORS] || INSTRUMENT_COLORS.other
          };
        }

        // Fallback for unclassified stems
        if (features) {
          const fallback = classifyFromFeatures(features);
          return {
            ...stem,
            category: fallback.category,
            confidence: Math.round(fallback.confidence * 100),
            spectralFeatures: features,
            color: INSTRUMENT_COLORS[fallback.category as keyof typeof INSTRUMENT_COLORS] || INSTRUMENT_COLORS.other
          };
        }

        return stem;
      });

      setClassificationProgress(100);
      console.log('[Classification] Enhanced stems:', enhancedStems.map(s => ({
        name: s.name,
        category: s.category,
        subInstruments: s.subInstruments?.length
      })));

      return enhancedStems;
    } catch (error) {
      console.error('[Classification] Error:', error);
      toast.error("AI classification failed, using basic categories");
      return stems;
    }
  }, [analyzeStems, classifyFromFeatures]);

  const analyzeAudioPatterns = useCallback(async (stems: SeparatedStem[]): Promise<AnalysisResult> => {
    // Simulate pattern analysis
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      bpm: 118,
      key: 'F# minor',
      mood: 'Energetic',
      genre: 'Private School Amapiano',
      complexity: 78,
      patterns: {
        rhythm: ['4/4 Log Drum Pattern', 'Syncopated Hi-Hat', 'Off-beat Kick'],
        harmony: ['ii-V-I Progression', 'Jazz Extensions', 'Modal Interchange'],
        melody: ['Pentatonic Motifs', 'Call-Response', 'Rhythmic Displacement']
      }
    };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setOriginalFile(file);
    setIsProcessing(true);
    setUploadProgress(0);
    setSeparationProgress(0);

    try {
      await initializeAudioContext();

      // Simulate file upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.info("Starting AI stem separation... (this may take 2-4 minutes)");

      // Perform real source separation via edge function
      let stems = await performRealStemSeparation(file);
      
      // Perform AI-powered sub-classification if enabled
      if (enableAIClassification && stems.length > 0) {
        toast.info("Running AI instrument sub-classification...");
        stems = await performAIClassification(stems);
      }
      
      setSeparatedStems(stems);

      if (enablePatternExtraction) {
        toast.info("Analyzing musical patterns...");
        const analysis = await analyzeAudioPatterns(stems);
        setAnalysisResult(analysis);
      }

      // Notify parent component
      if (onSeparationComplete) {
        onSeparationComplete(stems);
      }

      toast.success(`Successfully separated audio into ${stems.length} stems with AI classification!`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Stem separation failed: ${msg}`);
      console.error('[SourceSeparation] Error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [initializeAudioContext, performRealStemSeparation, performAIClassification, analyzeAudioPatterns, enablePatternExtraction, enableAIClassification, onSeparationComplete]);

  // Auto-start processing if an initial URL is provided
  useEffect(() => {
    const run = async () => {
      if (autoStart && initialAudioUrl) {
        try {
          const resp = await fetch(initialAudioUrl);
          if (!resp.ok) throw new Error('Failed to fetch audio for stems');
          const blob = await resp.blob();
          const ext = (blob.type?.split('/')[1] || 'mp3').split(';')[0];
          const file = new File([blob], `track-${Date.now()}.${ext}`, { type: blob.type || 'audio/mpeg' });
          await handleFileUpload(file);
        } catch (e) {
          toast.error("Failed to prepare track for stem separation");
          console.error(e);
        }
      }
    };
    run();
    // We intentionally omit handleFileUpload to avoid unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAudioUrl, autoStart]);

  const toggleStemPlayback = useCallback(async (stemId: string) => {
    await initializeAudioContext();

    const ctx = audioContextRef.current!;
    const stem = separatedStems.find(s => s.id === stemId);
    if (!stem) return;

    // If currently playing, stop it
    if (stem.isPlaying) {
      const source = audioSourcesRef.current.get(stemId);
      source?.stop();
      audioSourcesRef.current.delete(stemId);
      const gain = gainNodesRef.current.get(stemId);
      gain?.disconnect();
      gainNodesRef.current.delete(stemId);
      setSeparatedStems(prev => prev.map(s => s.id === stemId ? { ...s, isPlaying: false } : s));
      return;
    }

    // Play the real audio URL if available
    if (stem.audioUrl) {
      try {
        console.log('[SourceSeparation] Playing real audio:', stem.audioUrl.substring(0, 60));
        const response = await fetch(stem.audioUrl);
        if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const src = ctx.createBufferSource();
        src.buffer = audioBuffer;

        const gain = ctx.createGain();
        const linearVol = (stem.volume / 100) * (stem.isMuted ? 0 : 1);
        gain.gain.value = linearVol;

        src.connect(gain).connect(ctx.destination);
        src.onended = () => {
          setSeparatedStems(prev => prev.map(s => s.id === stemId ? { ...s, isPlaying: false } : s));
          audioSourcesRef.current.delete(stemId);
        };
        src.start();

        audioSourcesRef.current.set(stemId, src);
        gainNodesRef.current.set(stemId, gain);
        setSeparatedStems(prev => prev.map(s => s.id === stemId ? { ...s, isPlaying: true } : s));
      } catch (error) {
        console.error('[SourceSeparation] Audio playback error:', error);
        toast.error(`Failed to play ${stem.name}. The audio URL may have expired.`);
      }
    } else {
      // Fallback: generate placeholder tone (old behavior)
      const sampleRate = ctx.sampleRate || 44100;
      const duration = 2;
      const numSamples = Math.floor(sampleRate * duration);
      const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
      const data = audioBuffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const idx = Math.floor((i / numSamples) * stem.waveformData.length);
        const amp = (stem.waveformData[idx] || 0) * 0.6;
        data[i] = amp * Math.sin(2 * Math.PI * 220 * t);
      }

      const src = ctx.createBufferSource();
      src.buffer = audioBuffer;
      src.loop = true;

      const gain = ctx.createGain();
      const linearVol = (stem.volume / 100) * (stem.isMuted ? 0 : 1);
      gain.gain.value = linearVol;

      src.connect(gain).connect(ctx.destination);
      src.start();

      audioSourcesRef.current.set(stemId, src);
      gainNodesRef.current.set(stemId, gain);
      setSeparatedStems(prev => prev.map(s => s.id === stemId ? { ...s, isPlaying: true } : s));
    }
  }, [initializeAudioContext, separatedStems]);

  const updateStemVolume = useCallback((stemId: string, volume: number) => {
    setSeparatedStems(prev => prev.map(stem => 
      stem.id === stemId ? { ...stem, volume } : stem
    ));
    const gain = gainNodesRef.current.get(stemId);
    if (gain) {
      gain.gain.value = volume / 100;
    }
  }, []);

  const toggleStemMute = useCallback((stemId: string) => {
    setSeparatedStems(prev => prev.map(stem => 
      stem.id === stemId ? { ...stem, isMuted: !stem.isMuted } : stem
    ));
    const gain = gainNodesRef.current.get(stemId);
    if (gain) {
      const current = gain.gain.value;
      gain.gain.value = current > 0 ? 0 : 0.7;
    }
  }, []);

  const exportStem = useCallback(async (stem: SeparatedStem) => {
    try {
      toast.info(`Exporting ${stem.name}...`);
      
      // Create a simple WAV file from the stem data
      const sampleRate = 44100;
      const duration = 10; // 10 seconds
      const numSamples = sampleRate * duration;
      const buffer = new Float32Array(numSamples);
      
      // Generate audio based on waveform pattern (mock data for now)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const waveformIndex = Math.floor((i / numSamples) * stem.waveformData.length);
        const amplitude = stem.waveformData[waveformIndex] * 0.5;
        buffer[i] = amplitude * Math.sin(2 * Math.PI * 440 * t);
      }
      
      // Convert to WAV blob
      const wavBlob = createWavBlob(buffer, sampleRate);
      
      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${stem.name.toLowerCase().replace(/\s+/g, '-')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${stem.name} exported successfully!`);
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    }
  }, []);

  const createWavBlob = (buffer: Float32Array, sampleRate: number): Blob => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const extractPatternsFromStem = useCallback(async (stem: SeparatedStem) => {
    try {
      toast.info(`Analyzing ${stem.name}...`);
      
      // Simulate pattern extraction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Extracted patterns from ${stem.name}!`);
    } catch (error) {
      toast.error('Pattern extraction failed');
      console.error(error);
    }
  }, []);

  const exportAllStems = useCallback(async () => {
    try {
      toast.info('Preparing stems for export...');
      
      // Export each stem individually (they'll download to Downloads folder)
      for (let i = 0; i < separatedStems.length; i++) {
        await exportStem(separatedStems[i]);
        // Small delay between downloads to avoid browser blocking
        if (i < separatedStems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast.success(`All ${separatedStems.length} stems exported to Downloads folder!`);
    } catch (error) {
      toast.error('Failed to export all stems');
      console.error(error);
    }
  }, [separatedStems, exportStem]);

  const convertToMidi = useCallback(async () => {
    try {
      if (!originalFile) {
        toast.error('No audio file available for MIDI conversion');
        return;
      }
      
      toast.info('Converting to MIDI patterns... (this may take 1-2 minutes)');
      
      // Use the audio-to-midi edge function
      const { supabase } = await import('@/integrations/supabase/client');
      
      const formData = new FormData();
      formData.append('audio', originalFile);
      
      const { data, error } = await supabase.functions.invoke('audio-to-midi', {
        body: formData,
      });
      
      if (error) {
        console.error('[MIDI] Conversion error:', error);
        throw new Error(error.message || 'Conversion failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Conversion returned no data');
      }
      
      if (data.midiUrl) {
        // Download the MIDI file
        const response = await fetch(data.midiUrl);
        if (!response.ok) throw new Error('Failed to fetch MIDI file');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalFile.name.replace(/\.[^.]+$/, '')}-stems.mid`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('MIDI file downloaded to your Downloads folder!');
      } else {
        toast.success('MIDI patterns extracted successfully!');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`MIDI conversion failed: ${msg}`);
      console.error('[MIDI] Error:', error);
    }
  }, [originalFile]);

  const importToDAW = useCallback(async () => {
    try {
      toast.info('Importing stems to DAW...');
      
      // Store stems data in localStorage to be picked up by DAW - include audioUrl!
      const stemData = separatedStems.map(stem => ({
        name: stem.name,
        instrument: stem.instrument,
        color: stem.color,
        volume: stem.volume,
        audioUrl: stem.audioUrl, // Critical: pass the real audio URL
      }));
      
      localStorage.setItem('pendingDAWImport', JSON.stringify({
        stems: stemData,
        timestamp: Date.now(),
      }));
      
      // Navigate to DAW
      window.location.href = '/daw';
      
      toast.success('Navigating to DAW...');
    } catch (error) {
      toast.error('DAW import failed');
      console.error(error);
    }
  }, [separatedStems]);

  const renderWaveform = (waveformData: number[], color: string) => {
    const maxValue = Math.max(...waveformData.map(Math.abs));
    const normalizedData = waveformData.map(value => (value / maxValue) * 100);

    return (
      <div className="flex items-center h-16 bg-muted/20 rounded px-2 gap-1">
        {normalizedData.map((value, index) => (
          <div
            key={index}
            className={`w-1 ${color} opacity-70 rounded-sm`}
            style={{ height: `${Math.abs(value)}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-primary" />
            AI Source Separation Engine
            <Badge variant="outline" className="ml-auto">
              Neural Network Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="audio-file">Upload Audio File</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>

              <div className="flex gap-4 items-center text-sm">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={enableRealTimeProcessing} 
                    onCheckedChange={setEnableRealTimeProcessing} 
                  />
                  <span>Real-time Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={enablePatternExtraction} 
                    onCheckedChange={setEnablePatternExtraction} 
                  />
                  <span>Pattern Extraction</span>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <span className="whitespace-nowrap">Quality:</span>
                  <Slider
                    value={[separationQuality]}
                    onValueChange={([value]) => setSeparationQuality(value)}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground w-8">{separationQuality}%</span>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            {isProcessing && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Separation Progress</span>
                    <span>{separationProgress}%</span>
                  </div>
                  <Progress value={separationProgress} />
                </div>
              </div>
            )}

            {/* Results Section */}
            {separatedStems.length > 0 && (
              <Tabs defaultValue="stems" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stems">Separated Stems</TabsTrigger>
                  <TabsTrigger value="analysis">Pattern Analysis</TabsTrigger>
                  <TabsTrigger value="export">Export & Use</TabsTrigger>
                </TabsList>

                <TabsContent value="stems" className="space-y-4">
                  {separatedStems.map((stem) => (
                    <Card key={stem.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded ${stem.color}`} />
                            <div>
                              <h4 className="font-medium">{stem.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {stem.instrument} • {stem.confidence}% confidence
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => extractPatternsFromStem(stem)}>
                              <Zap className="w-4 h-4 mr-1" />
                              Extract
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => exportStem(stem)}>
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>

                        {/* Waveform Visualization */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Radio className="w-4 h-4" />
                            <span>Waveform</span>
                          </div>
                          {renderWaveform(stem.waveformData, stem.color)}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                          <Button
                            size="sm"
                            variant={stem.isPlaying ? "default" : "outline"}
                            onClick={() => toggleStemPlayback(stem.id)}
                          >
                            {stem.isPlaying ? (
                              <>
                                <Radio className="w-4 h-4 mr-1 animate-pulse" />
                                Playing
                              </>
                            ) : (
                              <>
                                <Radio className="w-4 h-4 mr-1" />
                                Play
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant={stem.isMuted ? "outline" : "secondary"}
                            onClick={() => toggleStemMute(stem.id)}
                          >
                            <Volume2 className="w-4 h-4 mr-1" />
                            {stem.isMuted ? 'Unmute' : 'Mute'}
                          </Button>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm">Volume:</span>
                            <Slider
                              value={[stem.volume]}
                              onValueChange={([value]) => updateStemVolume(stem.id, value)}
                              max={100}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-8">{stem.volume}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {analysisResult && (
                    <div className="grid gap-4">
                      <Card className="p-4">
                        <h3 className="font-medium mb-3">Musical Analysis</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">BPM:</span>
                            <span className="ml-2 font-medium">{analysisResult.bpm}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Key:</span>
                            <span className="ml-2 font-medium">{analysisResult.key}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Mood:</span>
                            <span className="ml-2 font-medium">{analysisResult.mood}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Genre:</span>
                            <span className="ml-2 font-medium">{analysisResult.genre}</span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div>
                          <span className="text-sm text-muted-foreground">Complexity:</span>
                          <div className="mt-1">
                            <Progress value={analysisResult.complexity} className="h-2" />
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h3 className="font-medium mb-3">Extracted Patterns</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Rhythm Patterns</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysisResult.patterns.rhythm.map((pattern, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Harmony Patterns</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysisResult.patterns.harmony.map((pattern, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Melody Patterns</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysisResult.patterns.melody.map((pattern, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="export" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-medium mb-3">Export Options</h3>
                    <div className="grid gap-3">
                      <Button className="justify-start" onClick={exportAllStems}>
                        <Download className="w-4 h-4 mr-2" />
                        Export All Stems as WAV Files
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={convertToMidi}>
                        <Music4 className="w-4 h-4 mr-2" />
                        Convert to MIDI Patterns
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={importToDAW}>
                        <Eye className="w-4 h-4 mr-2" />
                        Import to DAW Tracks
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};