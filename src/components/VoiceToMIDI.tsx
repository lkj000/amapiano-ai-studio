import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Settings, Music2 } from 'lucide-react';
import { toast } from 'sonner';

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
}

const VoiceToMIDI = () => {
  // Audio processing state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('');
  
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
    { id: '1', sound: 'Kick', midiNote: 36, trained: false },
    { id: '2', sound: 'Snare', midiNote: 38, trained: false },
    { id: '3', sound: 'Hi-Hat', midiNote: 42, trained: false },
    { id: '4', sound: 'Clap', midiNote: 39, trained: false },
  ]);
  
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
    
    // Pitch detection (LOWERED threshold for better capture)
    if (voiceMode === 'pitch' && rms > 0.005) {
      const pitch = detectPitch(dataArray, audioContextRef.current.sampleRate);
      
      if (pitch) {
        setDetectedPitch(pitch);
        let midiNote = frequencyToMidi(pitch);
        
        // Apply key lock
        midiNote = quantizeToScale(midiNote);
        
        setDetectedNote(midiToNoteName(midiNote));
        
        // Generate MIDI notes
        const notes = chordMode ? generateChord(midiNote) : [midiNote];
        const timestamp = Date.now();
        
        const newMidiNotes: MIDINote[] = notes.map(note => ({
          note,
          velocity: Math.floor(rms * 127),
          timestamp,
        }));
        
        setMidiNotes(newMidiNotes);
        
        // Record if recording
        if (isRecording) {
          setRecordedMIDI(prev => [...prev, ...newMidiNotes]);
        }
      } else {
        setDetectedPitch(null);
        setDetectedNote('');
        setMidiNotes([]);
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [voiceMode, chordMode, selectedChord, isRecording, detectPitch, keyLockEnabled]);
  
  // Start recording
  const startRecording = async () => {
    const success = await initializeAudio();
    if (!success) return;
    
    setIsRecording(true);
    setRecordedMIDI([]);
    processAudio();
    toast.success('Voice-to-MIDI recording started');
  };
  
  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    
    // Capture the current count BEFORE cleanup
    const capturedCount = recordedMIDI.length;
    
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
    
    toast.success(`Recording stopped. Captured ${capturedCount} MIDI notes`);
  };
  
  // Export MIDI
  const exportMIDI = () => {
    if (recordedMIDI.length === 0) {
      toast.error('No MIDI data to export');
      return;
    }
    
    toast.success(`Exporting ${recordedMIDI.length} MIDI notes...`);
    // In a real implementation, this would create a MIDI file
    console.log('MIDI Export:', recordedMIDI);
  };
  
  // Clear recording
  const clearRecording = () => {
    setRecordedMIDI([]);
    toast.info('MIDI recording cleared');
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
          
          {/* Input Level Meter */}
          <div className="space-y-2 bg-slate-900/50 p-4 rounded-lg border border-purple-500/20">
            <div className="flex justify-between text-sm text-purple-300">
              <span className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Input Level
              </span>
              <span>{audioLevel.toFixed(0)}%</span>
            </div>
            <Progress 
              value={audioLevel} 
              className="h-2 bg-slate-800"
            />
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
          <div className="grid grid-cols-2 gap-4">
            {beatboxTriggers.map((trigger, idx) => {
              const progress = audioLevel;
              return (
                <button
                  key={trigger.id}
                  className="relative aspect-square bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all p-4 group overflow-hidden"
                >
                  {/* Circular progress ring */}
                  <div className="absolute inset-4 rounded-full border-4 border-purple-900/30 group-hover:border-purple-500/30 transition-colors" />
                  {isRecording && (
                    <div 
                      className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2">
                    <div className="text-2xl font-bold text-white">{trigger.sound}</div>
                    <div className="text-xs text-purple-300">{midiToNoteName(trigger.midiNote)}</div>
                    {trigger.trained && (
                      <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                        Trained
                      </Badge>
                    )}
                  </div>
                  
                  {/* Active pulse */}
                  {isRecording && audioLevel > 20 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full bg-slate-900/50 border-purple-500/30 hover:bg-purple-900/20"
          >
            + Add Trigger Pad
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
          <Button 
            onClick={startRecording} 
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Voice Control
          </Button>
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
        <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-4 rounded-lg border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-400">✓ MIDI Captured</div>
              <div className="text-xs text-green-300/70">
                {recordedMIDI.length} notes ready to export
              </div>
            </div>
            <Button 
              onClick={exportMIDI}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Export MIDI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceToMIDI;
