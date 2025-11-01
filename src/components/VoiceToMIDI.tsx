import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Square, Settings, Music2, Plus, Play, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useRealtimeFeatureExtraction } from '@/hooks/useRealtimeFeatureExtraction';

interface MIDINote {
  note: number;
  velocity: number;
  timestamp: number;
  duration?: number;
}

interface ChordPreset {
  name: string;
  intervals: number[];
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

const VoiceToMIDI = () => {
  // High-Speed WASM Integration
  const wasmExtractor = useRealtimeFeatureExtraction();
  
  // Auto-initialize WASM engine for pitch detection
  useEffect(() => {
    if (!wasmExtractor.isInitialized) {
      wasmExtractor.initialize();
    }
  }, []);
  
  // Audio processing state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('');
  
  // Use ref for recording state to avoid closure issues
  const isRecordingRef = useRef(false);
  
  // MIDI state
  const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedMIDI, setRecordedMIDI] = useState<MIDINote[]>([]);
  
  // Configuration state
  const [pitchSensitivity, setPitchSensitivity] = useState([70]);
  const [latencyCompensation, setLatencyCompensation] = useState([5]);
  const [chordMode, setChordMode] = useState(false);
  const [selectedChord, setSelectedChord] = useState<string>('major');
  const [keyLockEnabled, setKeyLockEnabled] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [selectedScale, setSelectedScale] = useState<string>('major');
  const [voiceMode, setVoiceMode] = useState<'pitch' | 'beatbox' | 'control'>('pitch');
  
  // Beatbox triggers
  const [beatboxTriggers, setBeatboxTriggers] = useState<BeatboxTrigger[]>([
    { id: '1', sound: '808 Kick', midiNote: 36, trained: false, category: '808' },
    { id: '2', sound: '808 Snare', midiNote: 38, trained: false, category: '808' },
    { id: '3', sound: '808 Hi-Hat', midiNote: 42, trained: false, category: '808' },
    { id: '4', sound: 'Log Drum', midiNote: 60, trained: false, category: 'Amapiano' },
    { id: '5', sound: 'Amapiano Bass', midiNote: 48, trained: false, category: 'Amapiano' },
    { id: '6', sound: 'Piano Stab', midiNote: 64, trained: false, category: 'Private School' },
  ]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  
  // Audio playback
  const audioContextPlaybackRef = useRef<AudioContext | null>(null);
  
  // Comprehensive instrument library
  const instrumentLibrary: InstrumentPreset[] = [
    // 808 Drums
    { name: '808 Kick', category: '808 Drums', midiNote: 36, color: 'from-red-500 to-orange-500' },
    { name: '808 Snare', category: '808 Drums', midiNote: 38, color: 'from-orange-500 to-yellow-500' },
    { name: '808 Hi-Hat Closed', category: '808 Drums', midiNote: 42, color: 'from-yellow-500 to-green-500' },
    { name: '808 Hi-Hat Open', category: '808 Drums', midiNote: 46, color: 'from-green-500 to-teal-500' },
    { name: '808 Clap', category: '808 Drums', midiNote: 39, color: 'from-teal-500 to-cyan-500' },
    { name: '808 Rim', category: '808 Drums', midiNote: 37, color: 'from-cyan-500 to-blue-500' },
    { name: '808 Tom Low', category: '808 Drums', midiNote: 45, color: 'from-blue-500 to-indigo-500' },
    { name: '808 Tom Mid', category: '808 Drums', midiNote: 47, color: 'from-indigo-500 to-purple-500' },
    { name: '808 Tom High', category: '808 Drums', midiNote: 50, color: 'from-purple-500 to-pink-500' },
    { name: '808 Cowbell', category: '808 Drums', midiNote: 56, color: 'from-pink-500 to-red-500' },
    { name: '808 Conga', category: '808 Drums', midiNote: 62, color: 'from-red-500 to-orange-500' },
    { name: '808 Crash', category: '808 Drums', midiNote: 49, color: 'from-orange-500 to-yellow-500' },
    
    // Amapiano Essentials
    { name: 'Log Drum', category: 'Amapiano', midiNote: 60, color: 'from-emerald-500 to-teal-500' },
    { name: 'Amapiano Kick', category: 'Amapiano', midiNote: 35, color: 'from-teal-500 to-cyan-500' },
    { name: 'Amapiano Snare', category: 'Amapiano', midiNote: 40, color: 'from-cyan-500 to-blue-500' },
    { name: 'Amapiano Clap', category: 'Amapiano', midiNote: 39, color: 'from-blue-500 to-indigo-500' },
    { name: 'Shaker', category: 'Amapiano', midiNote: 70, color: 'from-indigo-500 to-purple-500' },
    { name: 'Amapiano Bass', category: 'Amapiano', midiNote: 48, color: 'from-purple-500 to-pink-500' },
    { name: 'Amapiano Piano', category: 'Amapiano', midiNote: 64, color: 'from-pink-500 to-rose-500' },
    { name: 'Amapiano Synth', category: 'Amapiano', midiNote: 72, color: 'from-rose-500 to-red-500' },
    
    // Private School Amapiano
    { name: 'PS Piano Stab', category: 'Private School', midiNote: 64, color: 'from-violet-500 to-purple-500' },
    { name: 'PS Log Drum Deep', category: 'Private School', midiNote: 58, color: 'from-purple-500 to-fuchsia-500' },
    { name: 'PS 808 Sub', category: 'Private School', midiNote: 33, color: 'from-fuchsia-500 to-pink-500' },
    { name: 'PS Vocal Chop', category: 'Private School', midiNote: 65, color: 'from-pink-500 to-rose-500' },
    { name: 'PS Perc Loop', category: 'Private School', midiNote: 75, color: 'from-rose-500 to-red-500' },
    { name: 'PS Bass Wobble', category: 'Private School', midiNote: 36, color: 'from-red-500 to-orange-500' },
    { name: 'PS Sax', category: 'Private School', midiNote: 67, color: 'from-orange-500 to-amber-500' },
    { name: 'PS Strings', category: 'Private School', midiNote: 52, color: 'from-amber-500 to-yellow-500' },
    
    // Electronic Drums
    { name: 'Electro Kick', category: 'Electronic', midiNote: 36, color: 'from-cyan-500 to-blue-500' },
    { name: 'Electro Snare', category: 'Electronic', midiNote: 40, color: 'from-blue-500 to-indigo-500' },
    { name: 'Laser Zap', category: 'Electronic', midiNote: 80, color: 'from-indigo-500 to-purple-500' },
    { name: 'Synth Hit', category: 'Electronic', midiNote: 84, color: 'from-purple-500 to-pink-500' },
    
    // Traditional Percussion
    { name: 'Djembe', category: 'Percussion', midiNote: 62, color: 'from-amber-500 to-orange-500' },
    { name: 'Bongo High', category: 'Percussion', midiNote: 64, color: 'from-orange-500 to-red-500' },
    { name: 'Bongo Low', category: 'Percussion', midiNote: 61, color: 'from-red-500 to-pink-500' },
    { name: 'Tambourine', category: 'Percussion', midiNote: 54, color: 'from-pink-500 to-fuchsia-500' },
    { name: 'Triangle', category: 'Percussion', midiNote: 81, color: 'from-fuchsia-500 to-purple-500' },
    
    // Bass Sounds
    { name: 'Sub Bass', category: 'Bass', midiNote: 36, color: 'from-slate-700 to-slate-900' },
    { name: 'Funk Bass', category: 'Bass', midiNote: 38, color: 'from-slate-600 to-slate-800' },
    { name: 'Synth Bass', category: 'Bass', midiNote: 40, color: 'from-slate-500 to-slate-700' },
  ];
  
  // Vocal control parameters
  const [vowelControl, setVowelControl] = useState<'none' | 'filter' | 'delay' | 'reverb'>('none');
  const [volumeControl, setVolumeControl] = useState<'none' | 'volume' | 'pan' | 'modulation'>('none');
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pitchDetectorRef = useRef<any>(null);
  
  // Chord presets
  const chordPresets: Record<string, ChordPreset> = {
    major: { name: 'Major', intervals: [0, 4, 7] },
    minor: { name: 'Minor', intervals: [0, 3, 7] },
    dominant7: { name: 'Dom7', intervals: [0, 4, 7, 10] },
    major7: { name: 'Maj7', intervals: [0, 4, 7, 11] },
    minor7: { name: 'Min7', intervals: [0, 3, 7, 10] },
    sus2: { name: 'Sus2', intervals: [0, 2, 7] },
    sus4: { name: 'Sus4', intervals: [0, 5, 7] },
    diminished: { name: 'Dim', intervals: [0, 3, 6] },
    augmented: { name: 'Aug', intervals: [0, 4, 8] },
  };
  
  // Musical scales
  const scales: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
    pentatonic_major: [0, 2, 4, 7, 9],
    pentatonic_minor: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };
  
  // Note names
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Frequency to MIDI note conversion
  const frequencyToMidi = (frequency: number): number => {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  };
  
  // MIDI to note name
  const midiToNoteName = (midi: number): string => {
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}${octave}`;
  };
  
  // Quantize to scale
  const quantizeToScale = (midiNote: number): number => {
    if (!keyLockEnabled) return midiNote;
    
    const keyOffset = noteNames.indexOf(selectedKey);
    const scaleIntervals = scales[selectedScale] || scales.major;
    
    // Get the note within the octave
    const noteInOctave = midiNote % 12;
    const octave = Math.floor(midiNote / 12);
    
    // Find closest scale degree
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
  
  // Generate chord from root note
  const generateChord = (rootNote: number): number[] => {
    const preset = chordPresets[selectedChord];
    if (!preset) return [rootNote];
    
    return preset.intervals.map(interval => rootNote + interval);
  };
  
  // Initialize audio processing
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      
      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      toast.error('Failed to access microphone');
      return false;
    }
  };
  
  // Pitch detection using autocorrelation (IMPROVED SENSITIVITY)
  const detectPitch = useCallback((dataArray: Float32Array, sampleRate: number): number | null => {
    // Autocorrelation algorithm
    let maxCorrelation = 0;
    let maxLag = 0;
    const minLag = Math.floor(sampleRate / 1000); // ~1000 Hz max
    const maxLagLimit = Math.floor(sampleRate / 50); // ~50 Hz min
    
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
    
    // LOWERED threshold for better sensitivity
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
    
    // Calculate audio level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    setAudioLevel(Math.min(rms * 200, 100));
    
    // Debug: Log audio level when recording
    if (isRecordingRef.current && rms > 0.001) {
      console.log('🎤 Audio RMS:', rms.toFixed(4), '| Threshold: 0.001');
    }
    
    // Pitch detection (LOWERED threshold for better capture)
    if (voiceMode === 'pitch' && rms > 0.001) {
      const pitch = detectPitch(dataArray, audioContextRef.current.sampleRate);
      
      if (pitch) {
        console.log('🎵 Pitch detected:', pitch.toFixed(2), 'Hz');
        
        setDetectedPitch(pitch);
        let midiNote = frequencyToMidi(pitch);
        
        // Apply key lock
        midiNote = quantizeToScale(midiNote);
        
        setDetectedNote(midiToNoteName(midiNote));
        
        console.log('🎹 MIDI Note:', midiNote, midiToNoteName(midiNote));
        
        // Generate MIDI notes
        const notes = chordMode ? generateChord(midiNote) : [midiNote];
        const timestamp = Date.now();
        
        const newMidiNotes: MIDINote[] = notes.map(note => ({
          note,
          velocity: Math.max(20, Math.floor(rms * 500)), // Boost velocity
          timestamp,
          duration: 100,
        }));
        
        setMidiNotes(newMidiNotes);
        
        // Record if recording (use ref for immediate state)
        if (isRecordingRef.current) {
          console.log('✅ Recording MIDI notes:', newMidiNotes.length, 'notes');
          setRecordedMIDI(prev => {
            const updated = [...prev, ...newMidiNotes];
            console.log('📝 Total recorded:', updated.length);
            return updated;
          });
        }
      } else {
        setDetectedPitch(null);
        setDetectedNote('');
        setMidiNotes([]);
      }
    } else if (isRecordingRef.current && rms <= 0.001) {
      console.log('⚠️ Audio too quiet - RMS:', rms.toFixed(4), '| Need > 0.001');
    }
    
    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [voiceMode, chordMode, selectedChord, isRecording, detectPitch, keyLockEnabled, quantizeToScale, midiToNoteName]);
  
  // Start recording
  const startRecording = async () => {
    console.log('🎙️ Starting recording...');
    const success = await initializeAudio();
    if (!success) {
      console.error('❌ Failed to initialize audio');
      return;
    }
    
    console.log('✅ Audio initialized successfully');
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordedMIDI([]);
    processAudio();
    toast.success('Voice-to-MIDI recording started');
  };
  
  // Stop recording
  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    
    isRecordingRef.current = false;
    setIsRecording(false);
    
    // Use a ref to capture the actual count from the latest state
    setTimeout(() => {
      console.log('🎯 Final MIDI count:', recordedMIDI.length);
      console.log('📋 MIDI notes:', recordedMIDI);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      setAudioLevel(0);
      setDetectedPitch(null);
      setDetectedNote('');
      setMidiNotes([]);
      
      toast.success(`Recording stopped. Captured ${recordedMIDI.length} MIDI notes`);
    }, 100);
  };
  
  // Test MIDI capture
  const testMIDICapture = () => {
    const testNote: MIDINote = {
      note: 60, // Middle C
      velocity: 100,
      timestamp: Date.now(),
      duration: 500,
    };
    
    setRecordedMIDI(prev => {
      const updated = [...prev, testNote];
      toast.success(`Test note added! Total: ${updated.length} notes`);
      console.log('🧪 Test MIDI note added:', testNote, '| Total:', updated.length);
      return updated;
    });
  };
  
  // Export MIDI as downloadable file
  const exportMIDI = () => {
    if (recordedMIDI.length === 0) {
      toast.error('No MIDI data to export');
      return;
    }
    
    try {
      // Create a simple MIDI file structure
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
  
  // Import directly to DAW
  const importToDAW = () => {
    if (recordedMIDI.length === 0) {
      toast.error('No MIDI data to import');
      return;
    }
    
    try {
      // Save MIDI data to localStorage for DAW to pick up
      localStorage.setItem('pendingMIDIImport', JSON.stringify({
        notes: recordedMIDI,
        name: `Voice Recording ${new Date().toLocaleTimeString()}`,
        timestamp: Date.now()
      }));
      
      toast.success('🎹 Opening DAW...');
      
      // Navigate to DAW
      setTimeout(() => {
        window.location.href = '/daw';
      }, 500);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import to DAW');
    }
  };
  
  // Helper function to create MIDI file structure
  // Create MIDI file buffer
  const createMIDIFile = (notes: MIDINote[]): Uint8Array => {
    // Simple MIDI file format (Type 0, single track)
    const header = [
      0x4d, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x00, // Format type 0
      0x00, 0x01, // Number of tracks
      0x00, 0x60, // Ticks per quarter note (96)
    ];
    
    // Track data
    const trackEvents: number[] = [];
    let lastTime = 0;
    
    // Sort notes by timestamp
    const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedNotes.forEach((note, idx) => {
      const deltaTime = idx === 0 ? 0 : Math.max(0, note.timestamp - lastTime);
      const deltaTicks = Math.floor(deltaTime / 10); // Convert ms to ticks
      
      // Note on event
      trackEvents.push(...encodeVariableLength(deltaTicks));
      trackEvents.push(0x90, note.note, note.velocity); // Note on
      
      // Note off event
      const duration = note.duration || 200;
      const durationTicks = Math.floor(duration / 10);
      trackEvents.push(...encodeVariableLength(durationTicks));
      trackEvents.push(0x80, note.note, 0); // Note off
      
      lastTime = note.timestamp;
    });
    
    // End of track
    trackEvents.push(0x00, 0xff, 0x2f, 0x00);
    
    // Track header
    const trackHeader = [
      0x4d, 0x54, 0x72, 0x6b, // "MTrk"
      ...intToBytes(trackEvents.length, 4), // Track length
    ];
    
    return new Uint8Array([...header, ...trackHeader, ...trackEvents]);
  };
  
  // Helper: Encode variable length value
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
  
  // Helper: Convert integer to bytes
  const intToBytes = (value: number, numBytes: number): number[] => {
    const bytes: number[] = [];
    for (let i = numBytes - 1; i >= 0; i--) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  };
  
  // Clear recording
  const clearRecording = () => {
    setRecordedMIDI([]);
    toast.info('MIDI recording cleared');
  };
  
  // Play trigger sound
  const playTrigger = (trigger: BeatboxTrigger) => {
    setActiveTrigger(trigger.id);
    
    // Create audio context if needed
    if (!audioContextPlaybackRef.current) {
      audioContextPlaybackRef.current = new AudioContext();
    }
    
    const audioCtx = audioContextPlaybackRef.current;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Different waveforms for different sounds
    if (trigger.category === '808') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(trigger.midiNote * 8, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    } else if (trigger.category === 'Amapiano' || trigger.category === 'Private School') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440 * Math.pow(2, (trigger.midiNote - 69) / 12), audioCtx.currentTime);
    } else {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(trigger.midiNote * 10, audioCtx.currentTime);
    }
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
    
    // If recording, capture this trigger as a MIDI note
    if (isRecordingRef.current) {
      const timestamp = Date.now();
      const note: MIDINote = {
        note: trigger.midiNote,
        velocity: 110,
        timestamp,
        duration: 200,
      };
      setRecordedMIDI(prev => {
        const updated = [...prev, note];
        console.log('🥁 Recorded trigger MIDI note:', note, '| Total:', updated.length);
        return updated;
      });
    }
    
    toast.success(`Triggered: ${trigger.sound}`);
    
    setTimeout(() => setActiveTrigger(null), 300);
  };
  
  // Add new trigger
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
  
  // Remove trigger
  const removeTrigger = (id: string) => {
    setBeatboxTriggers(prev => prev.filter(t => t.id !== id));
    toast.info('Trigger removed');
  };
  
  // Train trigger
  const trainTrigger = (id: string) => {
    setBeatboxTriggers(prev => 
      prev.map(t => t.id === id ? { ...t, trained: !t.trained } : t)
    );
    const trigger = beatboxTriggers.find(t => t.id === id);
    toast.success(trigger?.trained ? `Untrained: ${trigger.sound}` : `Trained: ${trigger?.sound}`);
  };
  
  return (
    <div className="space-y-4 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6 rounded-xl border border-purple-500/20">
      {/* Dubler-style Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Voice-to-MIDI</h2>
            <p className="text-xs text-purple-300">Advanced AI Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            {isRecording ? 'RECORDING' : 'READY'}
          </Badge>
          <Button variant="ghost" size="icon" className="text-purple-300 hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Dubler-style Tabs */}
      <Tabs value={voiceMode} onValueChange={(v) => setVoiceMode(v as any)}>
        <TabsList className="w-full bg-slate-900/50 border border-purple-500/20 grid grid-cols-3">
          <TabsTrigger 
            value="pitch" 
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            Play
          </TabsTrigger>
          <TabsTrigger 
            value="beatbox"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            Triggers
          </TabsTrigger>
          <TabsTrigger 
            value="control"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            Control
          </TabsTrigger>
        </TabsList>
            
        {/* Play Tab - Dubler-style circular pitch visualization */}
        <TabsContent value="pitch" className="space-y-6 mt-6">
          {/* Pitch Visualization Circle */}
          <div className="relative aspect-square max-w-md mx-auto bg-gradient-to-br from-slate-900/50 to-purple-900/20 rounded-2xl border border-purple-500/30 p-8">
            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {detectedNote || '---'}
              </div>
              <div className="text-sm text-purple-300 mt-2">
                {detectedPitch ? `${detectedPitch.toFixed(1)} Hz` : 'No signal'}
              </div>
              {isRecording && (
                <Badge variant="outline" className="mt-4 border-red-500/50 text-red-400 animate-pulse">
                  ● REC {recordedMIDI.length} notes
                </Badge>
              )}
            </div>
            
            {/* Circular note positions (Dubler-style) */}
            <div className="absolute inset-0">
              {noteNames.map((note, idx) => {
                const angle = (idx / 12) * 2 * Math.PI - Math.PI / 2;
                const radius = 45; // percentage
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);
                const isActive = detectedNote.startsWith(note);
                
                return (
                  <div
                    key={note}
                    className={`absolute w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-white scale-110 shadow-lg shadow-purple-500/50' 
                        : 'bg-slate-800/50 border-purple-500/30 text-purple-300'
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
          
          {/* Live Input Level Meter - Enhanced */}
          <div className="space-y-3 bg-gradient-to-br from-slate-900/80 to-purple-900/20 p-6 rounded-xl border-2 border-purple-500/30">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-purple-300 font-medium">
                <Mic className={`w-5 h-5 ${audioLevel > 10 ? 'text-green-400 animate-pulse' : ''}`} />
                Live Input Level
              </span>
              <span className={`text-lg font-bold ${
                audioLevel > 50 ? 'text-green-400' : 
                audioLevel > 20 ? 'text-yellow-400' : 
                'text-purple-300'
              }`}>
                {audioLevel.toFixed(0)}%
              </span>
            </div>
            
            {/* Visual meter bars */}
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
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: `${Math.min(100, (i + 1) * 5)}%`,
                      opacity: isActive ? 1 : 0.3,
                    }}
                  />
                );
              })}
            </div>
            
            {/* Status indicator */}
            <div className="text-xs text-center">
              {audioLevel < 5 && (
                <span className="text-red-400">⚠️ Too quiet - speak louder or adjust mic</span>
              )}
              {audioLevel >= 5 && audioLevel < 20 && (
                <span className="text-yellow-400">📊 Low signal - increase volume</span>
              )}
              {audioLevel >= 20 && audioLevel < 80 && (
                <span className="text-green-400">✓ Good signal level</span>
              )}
              {audioLevel >= 80 && (
                <span className="text-orange-400">⚡ Very loud - may clip</span>
              )}
            </div>
          </div>
              
          {/* Settings Grid - Dubler style */}
          <div className="grid grid-cols-2 gap-4">
            {/* Key/Scale Selection */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20 space-y-3">
              <label className="text-sm font-medium text-purple-300">Key / Scale</label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger className="bg-slate-800 border-purple-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noteNames.map(note => (
                      <SelectItem key={note} value={note}>{note}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedScale} onValueChange={setSelectedScale}>
                  <SelectTrigger className="bg-slate-800 border-purple-500/30">
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

            {/* Chord Mode */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20 space-y-3">
              <label className="text-sm font-medium text-purple-300">Chords</label>
              <Select value={selectedChord} onValueChange={setSelectedChord}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(chordPresets).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>{preset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sensitivity Slider */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20 space-y-3">
            <div className="flex justify-between text-sm text-purple-300">
              <span>Sensitivity</span>
              <span>{pitchSensitivity[0]}%</span>
            </div>
            <Slider
              value={pitchSensitivity}
              onValueChange={setPitchSensitivity}
              min={10}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-purple-500"
            />
          </div>
        </TabsContent>
            
        {/* Triggers Tab - Dubler-style trigger pads */}
        <TabsContent value="beatbox" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {beatboxTriggers.map((trigger) => {
              const isActive = activeTrigger === trigger.id;
              return (
                <div
                  key={trigger.id}
                  className="relative aspect-square"
                >
                  <button
                    onClick={() => playTrigger(trigger)}
                    className={`w-full h-full bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl border transition-all p-4 group overflow-hidden ${
                      isActive 
                        ? 'border-purple-500 scale-95 shadow-lg shadow-purple-500/50' 
                        : 'border-purple-500/30 hover:border-purple-500/60'
                    }`}
                  >
                    {/* Circular progress ring */}
                    <div className="absolute inset-4 rounded-full border-4 border-purple-900/30 group-hover:border-purple-500/30 transition-colors" />
                    {isRecording && audioLevel > 20 && (
                      <div 
                        className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"
                        style={{ animationDuration: '2s' }}
                      />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2">
                      <Play className="w-6 h-6 text-purple-400" />
                      <div className="text-sm font-bold text-white text-center">{trigger.sound}</div>
                      <div className="text-xs text-purple-300">{midiToNoteName(trigger.midiNote)}</div>
                      {trigger.trained && (
                        <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                          Trained
                        </Badge>
                      )}
                      {trigger.category && (
                        <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                          {trigger.category}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Active pulse */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-2xl animate-pulse" />
                    )}
                  </button>
                  
                  {/* Trigger controls */}
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full bg-slate-900 border border-purple-500/30 hover:border-green-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        trainTrigger(trigger.id);
                      }}
                    >
                      <span className="text-xs">{trigger.trained ? '✓' : 'T'}</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full bg-slate-900 border border-purple-500/30 hover:border-red-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrigger(trigger.id);
                      }}
                    >
                      <span className="text-xs">×</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Button 
            onClick={() => setShowInstrumentModal(true)}
            variant="outline" 
            className="w-full bg-slate-900/50 border-purple-500/30 hover:bg-purple-900/20 hover:border-purple-500/60"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Trigger Pad
          </Button>
        </TabsContent>
            
        {/* Control Tab - Dubler-style parameter controls */}
        <TabsContent value="control" className="space-y-6 mt-6">
          <div className="space-y-4">
            {/* Vowel Control */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20 space-y-3">
              <label className="text-sm font-medium text-purple-300">Vowel Control (Ooh/Aah)</label>
              <Select value={vowelControl} onValueChange={(v) => setVowelControl(v as any)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Disabled</SelectItem>
                  <SelectItem value="filter">Filter Cutoff</SelectItem>
                  <SelectItem value="delay">Delay Amount</SelectItem>
                  <SelectItem value="reverb">Reverb Mix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamics Control */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20 space-y-3">
              <label className="text-sm font-medium text-purple-300">Dynamics Control</label>
              <Select value={volumeControl} onValueChange={(v) => setVolumeControl(v as any)}>
                <SelectTrigger className="bg-slate-800 border-purple-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Disabled</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="pan">Stereo Pan</SelectItem>
                  <SelectItem value="modulation">Modulation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live Values Display */}
            {(vowelControl !== 'none' || volumeControl !== 'none') && (
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 rounded-lg border border-purple-500/30">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-300">Vowel Position</span>
                    <span className="text-2xl font-bold text-white">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-300">Dynamics Level</span>
                    <span className="text-2xl font-bold text-white">{audioLevel.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Main Control Bar - Dubler style */}
      <div className="flex gap-3 pt-4 border-t border-purple-500/20">
        {!isRecording ? (
          <>
            <Button 
              onClick={startRecording} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Control
            </Button>
            <Button
              onClick={testMIDICapture}
              variant="outline"
              className="bg-slate-900/50 border-green-500/50 hover:bg-green-900/20 hover:border-green-500 text-green-400"
              title="Add a test MIDI note to verify capture is working"
            >
              Test
            </Button>
          </>
        ) : (
          <Button 
            onClick={stopRecording} 
            variant="destructive" 
            className="flex-1 bg-red-600 hover:bg-red-700 py-6 font-semibold"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        )}
        
        <Button
          onClick={clearRecording}
          variant="outline"
          disabled={recordedMIDI.length === 0}
          className="bg-slate-900/50 border-purple-500/30 hover:bg-purple-900/20"
        >
          Clear
        </Button>
      </div>

      {/* Status Bar */}
      {recordedMIDI.length > 0 && (
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4 rounded-lg border-2 border-green-500/40 shadow-lg shadow-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-400">✓ MIDI Captured Successfully</div>
              <div className="text-xs text-green-300/70">
                {recordedMIDI.length} notes • Ready to use in DAW
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={importToDAW}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold"
              >
                🎹 Import to DAW
              </Button>
              <Button 
                onClick={exportMIDI}
                size="sm"
                variant="outline"
                className="font-semibold"
              >
                📥 Download
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instrument Library Modal */}
      <Dialog open={showInstrumentModal} onOpenChange={setShowInstrumentModal}>
        <DialogContent className="max-w-4xl bg-slate-950 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Add Trigger Pad - Unlimited Instruments</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            {/* Group by category */}
            {['808 Drums', 'Amapiano', 'Private School', 'Electronic', 'Percussion', 'Bass'].map(category => {
              const instruments = instrumentLibrary.filter(i => i.category === category);
              if (instruments.length === 0) return null;
              
              return (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <Music2 className="w-5 h-5" />
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {instruments.map((instrument) => (
                      <button
                        key={instrument.name}
                        onClick={() => addTrigger(instrument)}
                        className={`p-4 rounded-lg border border-purple-500/30 hover:border-purple-500/60 transition-all bg-gradient-to-br ${instrument.color} bg-opacity-10 group`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-sm font-bold text-white group-hover:scale-110 transition-transform">
                            {instrument.name}
                          </div>
                          <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                            {midiToNoteName(instrument.midiNote)}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceToMIDI;
