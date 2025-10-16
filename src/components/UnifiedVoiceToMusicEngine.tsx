import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, Square, Play, Settings, Music2, Plus, Download, Upload, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedVoiceToMusicEngineProps {
  onTrackGenerated?: (audioUrl: string, metadata: any) => void;
  initialAudio?: string;
}

interface MIDINote {
  note: number;
  velocity: number;
  timestamp: number;
  duration?: number;
}

interface BeatboxTrigger {
  id: string;
  sound: string;
  midiNote: number;
  trained: boolean;
  category?: string;
}

interface InstrumentPreset {
  name: string;
  category: string;
  midiNote: number;
  color: string;
}

export const UnifiedVoiceToMusicEngine = ({ onTrackGenerated, initialAudio }: UnifiedVoiceToMusicEngineProps) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Enhanced audio processing state
  const [audioLevel, setAudioLevel] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [recordedMIDI, setRecordedMIDI] = useState<MIDINote[]>([]);
  
  // Musical configuration
  const [selectedMode, setSelectedMode] = useState<'melody' | 'instruction' | 'beatbox'>('melody');
  const [pitchSensitivity, setPitchSensitivity] = useState([70]);
  const [keyLockEnabled, setKeyLockEnabled] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [selectedScale, setSelectedScale] = useState<string>('major');
  const [chordMode, setChordMode] = useState(false);
  const [selectedChord, setSelectedChord] = useState<string>('major');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedTrack, setGeneratedTrack] = useState<any>(null);
  
  // Beatbox triggers
  const [beatboxTriggers, setBeatboxTriggers] = useState<BeatboxTrigger[]>([
    { id: '1', sound: '808 Kick', midiNote: 36, trained: false, category: '808' },
    { id: '2', sound: '808 Snare', midiNote: 38, trained: false, category: '808' },
    { id: '3', sound: 'Log Drum', midiNote: 60, trained: false, category: 'Amapiano' },
    { id: '4', sound: 'Amapiano Bass', midiNote: 48, trained: false, category: 'Amapiano' },
  ]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const audioContextPlaybackRef = useRef<AudioContext | null>(null);
  
  // Musical constants
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const scales: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic_minor: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
  };
  
  const chordPresets: Record<string, { name: string; intervals: number[] }> = {
    major: { name: 'Major', intervals: [0, 4, 7] },
    minor: { name: 'Minor', intervals: [0, 3, 7] },
    dominant7: { name: 'Dom7', intervals: [0, 4, 7, 10] },
  };
  
  // Instrument library
  const instrumentLibrary: InstrumentPreset[] = [
    { name: '808 Kick', category: '808 Drums', midiNote: 36, color: 'from-red-500 to-orange-500' },
    { name: '808 Snare', category: '808 Drums', midiNote: 38, color: 'from-orange-500 to-yellow-500' },
    { name: '808 Hi-Hat', category: '808 Drums', midiNote: 42, color: 'from-yellow-500 to-green-500' },
    { name: 'Log Drum', category: 'Amapiano', midiNote: 60, color: 'from-emerald-500 to-teal-500' },
    { name: 'Amapiano Bass', category: 'Amapiano', midiNote: 48, color: 'from-purple-500 to-pink-500' },
    { name: 'Piano Stab', category: 'Private School', midiNote: 64, color: 'from-violet-500 to-purple-500' },
  ];
  
  // Utility functions
  const frequencyToMidi = (frequency: number): number => {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  };
  
  const midiToNoteName = (midi: number): string => {
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}${octave}`;
  };
  
  const quantizeToScale = (midiNote: number): number => {
    if (!keyLockEnabled) return midiNote;
    
    const keyOffset = noteNames.indexOf(selectedKey);
    const scaleIntervals = scales[selectedScale] || scales.major;
    const noteInOctave = midiNote % 12;
    const octave = Math.floor(midiNote / 12);
    
    let closestNote = noteInOctave;
    let minDistance = 12;
    
    for (const interval of scaleIntervals) {
      const scaleNote = (keyOffset + interval) % 12;
      const distance = Math.abs(noteInOctave - scaleNote);
      if (distance < minDistance) {
        minDistance = distance;
        closestNote = scaleNote;
      }
    }
    
    return octave * 12 + closestNote;
  };
  
  const generateChord = (rootNote: number): number[] => {
    const preset = chordPresets[selectedChord];
    if (!preset) return [rootNote];
    return preset.intervals.map(interval => rootNote + interval);
  };
  
  // Pitch detection using autocorrelation
  const detectPitch = useCallback((dataArray: Float32Array, sampleRate: number): number | null => {
    let maxCorrelation = 0;
    let maxLag = 0;
    const minLag = Math.floor(sampleRate / 1000);
    const maxLagLimit = Math.floor(sampleRate / 50);
    
    for (let lag = minLag; lag < maxLagLimit; lag++) {
      let correlation = 0;
      for (let i = 0; i < dataArray.length - lag; i++) {
        correlation += dataArray[i] * dataArray[i + lag];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        maxLag = lag;
      }
    }
    
    if (maxCorrelation < 0.001) return null;
    
    const frequency = sampleRate / maxLag;
    return frequency > 50 && frequency < 1000 ? frequency : null;
  }, []);
  
  // Audio processing loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const dataArray = new Float32Array(analyserRef.current.fftSize);
    const frequencyArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    analyserRef.current.getFloatTimeDomainData(dataArray);
    analyserRef.current.getByteFrequencyData(frequencyArray);
    
    // Calculate audio level (RMS)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    setAudioLevel(Math.min(rms * 200, 100));
    
    // Pitch detection for melody mode
    if (selectedMode === 'melody' && rms > 0.001) {
      const pitch = detectPitch(dataArray, audioContextRef.current.sampleRate);
      
      if (pitch) {
        setDetectedPitch(pitch);
        let midiNote = frequencyToMidi(pitch);
        midiNote = quantizeToScale(midiNote);
        setDetectedNote(midiToNoteName(midiNote));
        
        // Generate MIDI notes
        const notes = chordMode ? generateChord(midiNote) : [midiNote];
        const timestamp = Date.now();
        
        const newMidiNotes: MIDINote[] = notes.map(note => ({
          note,
          velocity: Math.max(20, Math.floor(rms * 500)),
          timestamp,
          duration: 100,
        }));
        
        // Record if recording
        if (isRecordingRef.current) {
          setRecordedMIDI(prev => [...prev, ...newMidiNotes]);
        }
      } else {
        setDetectedPitch(null);
        setDetectedNote('');
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [selectedMode, chordMode, selectedChord, keyLockEnabled, detectPitch, quantizeToScale]);
  
  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      
      // Setup MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      
      // Setup audio analysis
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
        source.connect(analyserRef.current);
      }
      
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedMIDI([]);
      processAudio();
      
      const modeMessages = {
        melody: "🎵 Hum or sing a melody - real-time pitch detection active!",
        instruction: "🗣️ Describe the music you want in detail",
        beatbox: "🥁 Beatbox or trigger sounds"
      };
      
      toast.success(modeMessages[selectedMode]);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setAudioLevel(0);
    setDetectedPitch(null);
    setDetectedNote('');
    
    toast.success(`Recording stopped. Captured ${recordedMIDI.length} MIDI notes`);
  };
  
  // Process and generate music
  const generateMusic = async () => {
    if (!audioBlob && recordedMIDI.length === 0) {
      toast.error('No recording to process');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Convert audio blob to base64 via DataURL to ensure correct padding
      let base64Audio = '';
      if (audioBlob) {
        base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const result = reader.result as string;
              const base64 = (result.split(',')[1] || '').replace(/\s/g, '');
              const pad = base64.length % 4;
              resolve(pad ? base64 + '='.repeat(4 - pad) : base64);
            } catch (e) {
              reject(e);
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(audioBlob);
        });
      }
      
      // Call neural music generation
      const result = await supabase.functions.invoke('neural-music-generation', {
        body: {
          type: 'voice_to_music',
          audioData: base64Audio,
          midiData: recordedMIDI,
          mode: selectedMode,
          customInstructions: customInstructions || undefined,
          musicalSettings: {
            key: selectedKey,
            scale: selectedScale,
            chordMode,
            selectedChord
          },
          outputFormat: 'full_track_with_stems',
          amapiano_style: 'adaptive'
        }
      });
      
      const { data, error } = result as { data: any; error?: any };
      
      if (error) {
        const status = (error as any)?.status;
        const rawMsg = (error as any)?.message || '';
        let friendly = rawMsg;
        if (status === 402 || /insufficient_quota|Payment Required/i.test(rawMsg)) {
          friendly = 'Transcription credits exhausted. Please add funds to your AI usage and try again.';
        } else if (status === 429 || /rate limit/i.test(rawMsg)) {
          friendly = 'Rate limit exceeded. Please wait a moment and try again.';
        }
        throw new Error(friendly || 'Edge function error');
      }
      
      if (data) {
        // Set generated track for display
        setGeneratedTrack({
          title: data.title || `${selectedMode} Generation ${new Date().toLocaleTimeString()}`,
          description: data.description || `Generated using ${selectedMode} mode`,
          audioUrl: data.audioUrl,
          stems: data.stems || [],
          metadata: data.metadata || {}
        });
        
        // Call callback if provided
        if (onTrackGenerated) {
          onTrackGenerated(data.audioUrl, {
            bpm: data.metadata?.bpm || 118,
            key: data.metadata?.key || selectedKey,
            genre: 'Amapiano',
            midiNotes: recordedMIDI.length
          });
        }
      }
      
      toast.success('🎵 Music generated successfully!');
      
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(`Failed to generate music: ${(error as any)?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Export MIDI
  const exportMIDI = () => {
    if (recordedMIDI.length === 0) {
      toast.error('No MIDI data to export');
      return;
    }
    
    try {
      const midiData = createMIDIFile(recordedMIDI);
      const blob = new Blob([midiData.buffer as ArrayBuffer], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-to-midi-${Date.now()}.mid`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('MIDI file downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export MIDI');
    }
  };
  
  // Import to DAW
  const importToDAW = () => {
    if (recordedMIDI.length === 0) {
      toast.error('No MIDI data to import');
      return;
    }
    
    try {
      localStorage.setItem('pendingMIDIImport', JSON.stringify({
        notes: recordedMIDI,
        name: `Voice Recording ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now()
      }));
      
      toast.success('🎹 Opening DAW...');
      setTimeout(() => {
        window.location.href = '/daw';
      }, 500);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import to DAW');
    }
  };
  
  // Create MIDI file
  const createMIDIFile = (notes: MIDINote[]): Uint8Array => {
    const header = [
      0x4d, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x00,
      0x00, 0x01,
      0x00, 0x60,
    ];
    
    const trackEvents: number[] = [];
    let lastTime = 0;
    
    const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedNotes.forEach((note, idx) => {
      const deltaTime = idx === 0 ? 0 : Math.max(0, note.timestamp - lastTime);
      const deltaTicks = Math.floor(deltaTime / 10);
      
      trackEvents.push(...encodeVariableLength(deltaTicks));
      trackEvents.push(0x90, note.note, note.velocity);
      
      const duration = note.duration || 200;
      const durationTicks = Math.floor(duration / 10);
      trackEvents.push(...encodeVariableLength(durationTicks));
      trackEvents.push(0x80, note.note, 0);
      
      lastTime = note.timestamp;
    });
    
    trackEvents.push(0x00, 0xff, 0x2f, 0x00);
    
    const trackHeader = [
      0x4d, 0x54, 0x72, 0x6b,
      ...intToBytes(trackEvents.length, 4),
    ];
    
    return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
  };
  
  const encodeVariableLength = (value: number): number[] => {
    const bytes: number[] = [];
    bytes.push(value & 0x7f);
    
    let v = value >> 7;
    while (v > 0) {
      bytes.unshift((v & 0x7f) | 0x80);
      v >>= 7;
    }
    
    return bytes;
  };
  
  const intToBytes = (value: number, numBytes: number): number[] => {
    const bytes: number[] = [];
    for (let i = numBytes - 1; i >= 0; i--) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  };
  
  // Play trigger sound
  const playTrigger = (trigger: BeatboxTrigger) => {
    setActiveTrigger(trigger.id);
    
    if (!audioContextPlaybackRef.current) {
      audioContextPlaybackRef.current = new AudioContext();
    }
    
    const audioCtx = audioContextPlaybackRef.current;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    if (trigger.category === '808') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(trigger.midiNote * 8, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    } else {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440 * Math.pow(2, (trigger.midiNote - 69) / 12), audioCtx.currentTime);
    }
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
    
    if (isRecordingRef.current) {
      const note: MIDINote = {
        note: trigger.midiNote,
        velocity: 110,
        timestamp: Date.now(),
        duration: 200,
      };
      setRecordedMIDI(prev => [...prev, note]);
    }
    
    setTimeout(() => setActiveTrigger(null), 300);
  };
  
  const addTrigger = (instrument: InstrumentPreset) => {
    const newTrigger: BeatboxTrigger = {
      id: Date.now().toString(),
      sound: instrument.name,
      midiNote: instrument.midiNote,
      trained: false,
      category: instrument.category,
    };
    
    setBeatboxTriggers(prev => [...prev, newTrigger]);
    setShowInstrumentModal(false);
    toast.success(`Added: ${instrument.name}`);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };
  
  return (
    <Card className="bg-gradient-to-br from-background via-primary/5 to-background border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Unified Voice-to-Music Engine</CardTitle>
              <p className="text-xs text-muted-foreground">Advanced AI-Powered Music Creation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={isRecording ? 'border-red-500 text-red-500 animate-pulse' : 'border-green-500 text-green-500'}>
              {isRecording ? 'RECORDING' : 'READY'}
            </Badge>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mode Tabs */}
        <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as any)}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="melody">Melody</TabsTrigger>
            <TabsTrigger value="instruction">Instruction</TabsTrigger>
            <TabsTrigger value="beatbox">Beatbox</TabsTrigger>
          </TabsList>
          
          {/* Melody Tab */}
          <TabsContent value="melody" className="space-y-4">
            {/* Pitch Visualization */}
            <div className="relative aspect-square max-w-sm mx-auto bg-gradient-to-br from-background to-primary/10 rounded-2xl border-2 border-primary/30 p-8">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {detectedNote || '---'}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {detectedPitch ? `${detectedPitch.toFixed(1)} Hz` : 'No signal'}
                </div>
                {isRecording && (
                  <Badge variant="outline" className="mt-4 border-red-500 text-red-500 animate-pulse">
                    ● REC {recordedMIDI.length} notes
                  </Badge>
                )}
              </div>
              
              {/* Circular note positions */}
              <div className="absolute inset-0">
                {noteNames.map((note, idx) => {
                  const angle = (idx / 12) * 2 * Math.PI - Math.PI / 2;
                  const radius = 45;
                  const x = 50 + radius * Math.cos(angle);
                  const y = 50 + radius * Math.sin(angle);
                  const isActive = detectedNote.startsWith(note);
                  
                  return (
                    <div
                      key={note}
                      className={`absolute w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-br from-primary to-accent border-white scale-110 shadow-lg shadow-primary/50' 
                          : 'bg-background/50 border-primary/30 text-muted-foreground'
                      }`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <span className={`text-sm font-bold ${isActive ? 'text-white' : ''}`}>
                        {note}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Audio Level Meter */}
            <div className="space-y-2 bg-gradient-to-br from-background to-primary/5 p-4 rounded-xl border border-primary/20">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Mic className={`w-5 h-5 ${audioLevel > 10 ? 'text-green-500 animate-pulse' : ''}`} />
                  Live Input Level
                </span>
                <span className={`text-lg font-bold ${
                  audioLevel > 50 ? 'text-green-500' : 
                  audioLevel > 20 ? 'text-yellow-500' : 
                  'text-muted-foreground'
                }`}>
                  {audioLevel.toFixed(0)}%
                </span>
              </div>
              
              <div className="flex gap-1 h-12 items-end">
                {Array.from({ length: 20 }).map((_, i) => {
                  const barThreshold = (i + 1) * 5;
                  const isActive = audioLevel >= barThreshold;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all duration-100 ${
                        isActive 
                          ? i < 14 ? 'bg-green-500' : i < 18 ? 'bg-yellow-500' : 'bg-red-500'
                          : 'bg-muted'
                      }`}
                      style={{
                        height: `${Math.min(100, (i + 1) * 5)}%`,
                        opacity: isActive ? 1 : 0.3,
                      }}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Musical Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noteNames.map(note => (
                      <SelectItem key={note} value={note}>{note}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Scale</label>
                <Select value={selectedScale} onValueChange={setSelectedScale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="pentatonic_minor">Pent Min</SelectItem>
                    <SelectItem value="blues">Blues</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Chord Mode</label>
              <Select value={selectedChord} onValueChange={setSelectedChord}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(chordPresets).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>{preset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          {/* Instruction Tab */}
          <TabsContent value="instruction" className="space-y-4">
            <Textarea
              placeholder="Describe the music you want: e.g., 'Create an upbeat amapiano track with piano chords, log drums, and a deep bass at 118 BPM in F# minor'"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[150px]"
            />
          </TabsContent>
          
          {/* Beatbox Tab */}
          <TabsContent value="beatbox" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {beatboxTriggers.map((trigger) => (
                <button
                  key={trigger.id}
                  onClick={() => playTrigger(trigger)}
                  className={`aspect-square bg-gradient-to-br from-background to-primary/10 rounded-2xl border-2 transition-all p-4 ${
                    activeTrigger === trigger.id 
                      ? 'border-primary scale-95 shadow-lg shadow-primary/50' 
                      : 'border-primary/30 hover:border-primary/60'
                  }`}
                >
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <Play className="w-6 h-6 text-primary" />
                    <div className="text-sm font-bold">{trigger.sound}</div>
                    <div className="text-xs text-muted-foreground">{midiToNoteName(trigger.midiNote)}</div>
                  </div>
                </button>
              ))}
              
              <button
                onClick={() => setShowInstrumentModal(true)}
                className="aspect-square bg-gradient-to-br from-background to-primary/5 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all p-4"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                  <div className="text-sm font-medium text-muted-foreground">Add Trigger</div>
                </div>
              </button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} className="flex-1" size="lg">
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="flex-1" size="lg">
              <Square className="w-5 h-5 mr-2" />
              Stop ({formatTime(recordingDuration)})
            </Button>
          )}
        </div>
        
        {/* Action Buttons */}
        {audioBlob && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={generateMusic} disabled={isProcessing} variant="default">
              <Music2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Generating...' : 'Generate Music'}
            </Button>
            
            {recordedMIDI.length > 0 && (
              <>
                <Button onClick={exportMIDI} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export MIDI ({recordedMIDI.length})
                </Button>
                
                <Button onClick={importToDAW} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import to DAW
                </Button>
              </>
            )}
            
            <Button onClick={() => { setAudioBlob(null); setRecordedMIDI([]); setRecordingDuration(0); }} variant="ghost">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        )}
        
        {/* Generated Track Display */}
        {generatedTrack && (
          <div className="mt-6 p-6 border-2 border-primary/30 rounded-xl bg-gradient-to-br from-background to-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{generatedTrack.title}</h3>
                <p className="text-sm text-muted-foreground">{generatedTrack.description}</p>
              </div>
              <Badge variant="secondary" className="gap-2">
                <Music2 className="w-4 h-4" />
                Generated
              </Badge>
            </div>
            
            <audio 
              controls 
              className="w-full"
              src={generatedTrack.audioUrl}
            >
              Your browser does not support audio playback.
            </audio>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedTrack.audioUrl;
                  link.download = `${generatedTrack.title}.mp3`;
                  link.click();
                }}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Track
              </Button>
              
              {onTrackGenerated && (
                <Button
                  onClick={() => onTrackGenerated(generatedTrack.audioUrl, generatedTrack)}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add to DAW
                </Button>
              )}
              
              <Button
                onClick={() => setGeneratedTrack(null)}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
            
            {generatedTrack.stems && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-semibold">Stems</h4>
                <div className="grid grid-cols-2 gap-2">
                  {generatedTrack.stems.map((stem: any, idx: number) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = stem.url;
                        link.download = stem.name;
                        link.click();
                      }}
                    >
                      <Download className="w-3 h-3 mr-2" />
                      {stem.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Instrument Library Modal */}
      <Dialog open={showInstrumentModal} onOpenChange={setShowInstrumentModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Instrument Library</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 gap-3 p-4">
              {instrumentLibrary.map((instrument) => (
                <button
                  key={instrument.name}
                  onClick={() => addTrigger(instrument)}
                  className={`p-4 rounded-xl border-2 border-primary/30 hover:border-primary transition-all bg-gradient-to-br ${instrument.color}`}
                >
                  <div className="text-white text-center space-y-1">
                    <div className="font-bold">{instrument.name}</div>
                    <div className="text-xs opacity-80">{instrument.category}</div>
                    <div className="text-xs opacity-60">{midiToNoteName(instrument.midiNote)}</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UnifiedVoiceToMusicEngine;
