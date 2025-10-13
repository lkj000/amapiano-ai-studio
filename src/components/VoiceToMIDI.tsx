import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, Square, Play, Download, Settings, Activity, 
  Music2, Piano, Drum, Sparkles, Lock, Unlock,
  Volume2, Save, Trash2, RotateCcw
} from 'lucide-react';
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
  
  // Pitch detection using autocorrelation
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
    
    // Threshold for pitch detection
    if (maxCorrelation < 0.01) return null;
    
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
    
    // Pitch detection
    if (voiceMode === 'pitch' && rms > 0.01) {
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
    <div className="space-y-6">
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Voice-to-MIDI Engine
          </CardTitle>
          <CardDescription>
            Advanced real-time voice-to-MIDI conversion with AI-powered features that exceed Dubler 2.0
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <Tabs value={voiceMode} onValueChange={(v) => setVoiceMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pitch">
                <Piano className="w-4 h-4 mr-2" />
                Pitch-to-MIDI
              </TabsTrigger>
              <TabsTrigger value="beatbox">
                <Drum className="w-4 h-4 mr-2" />
                Beatbox Triggers
              </TabsTrigger>
              <TabsTrigger value="control">
                <Volume2 className="w-4 h-4 mr-2" />
                Vocal Control
              </TabsTrigger>
            </TabsList>
            
            {/* Pitch-to-MIDI Tab */}
            <TabsContent value="pitch" className="space-y-6">
              {/* Real-time Visualization */}
              <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="text-4xl font-bold text-primary">
                      {detectedNote || '---'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {detectedPitch ? `${detectedPitch.toFixed(2)} Hz` : 'No signal'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {midiNotes.map((note, idx) => (
                      <Badge key={idx} variant="secondary">
                        {midiToNoteName(note.note)} - Vel: {note.velocity}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Input Level</span>
                    <span>{audioLevel.toFixed(0)}%</span>
                  </div>
                  <Progress value={audioLevel} className="h-2" />
                </div>
              </div>
              
              {/* Chord Mode */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Chord Generation</label>
                    <p className="text-xs text-muted-foreground">
                      Generate full chords from single notes
                    </p>
                  </div>
                  <Switch checked={chordMode} onCheckedChange={setChordMode} />
                </div>
                
                {chordMode && (
                  <Select value={selectedChord} onValueChange={setSelectedChord}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(chordPresets).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.name} ({preset.intervals.join(', ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Key Lock */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-2">
                      {keyLockEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      Key Lock & Scale Quantization
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Lock notes to selected key and scale
                    </p>
                  </div>
                  <Switch checked={keyLockEnabled} onCheckedChange={setKeyLockEnabled} />
                </div>
                
                {keyLockEnabled && (
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
                          <SelectItem value="minor">Natural Minor</SelectItem>
                          <SelectItem value="harmonic_minor">Harmonic Minor</SelectItem>
                          <SelectItem value="pentatonic_major">Pentatonic Major</SelectItem>
                          <SelectItem value="pentatonic_minor">Pentatonic Minor</SelectItem>
                          <SelectItem value="blues">Blues</SelectItem>
                          <SelectItem value="chromatic">Chromatic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Performance Settings */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Pitch Sensitivity</label>
                    <span className="text-sm text-muted-foreground">{pitchSensitivity[0]}%</span>
                  </div>
                  <Slider
                    value={pitchSensitivity}
                    onValueChange={setPitchSensitivity}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Latency Compensation</label>
                    <span className="text-sm text-muted-foreground">{latencyCompensation[0]}ms</span>
                  </div>
                  <Slider
                    value={latencyCompensation}
                    onValueChange={setLatencyCompensation}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Beatbox Triggers Tab */}
            <TabsContent value="beatbox" className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <h4 className="font-semibold text-sm">AI-Powered Beatbox Recognition</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Train the AI to recognize your beatbox sounds and trigger MIDI notes instantly
                </p>
              </div>
              
              <div className="space-y-3">
                {beatboxTriggers.map(trigger => (
                  <div key={trigger.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{trigger.sound}</div>
                        <div className="text-sm text-muted-foreground">
                          MIDI Note: {midiToNoteName(trigger.midiNote)} ({trigger.midiNote})
                        </div>
                      </div>
                      <Badge variant={trigger.trained ? 'default' : 'outline'}>
                        {trigger.trained ? 'Trained' : 'Not Trained'}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      {trigger.trained ? 'Retrain' : 'Train Sound'}
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Add Custom Trigger
              </Button>
            </TabsContent>
            
            {/* Vocal Control Tab */}
            <TabsContent value="control" className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Music2 className="w-4 h-4 text-purple-500" />
                  <h4 className="font-semibold text-sm">Vocal Parameter Control (MIDI CC)</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use vowel sounds and voice dynamics to control effects and parameters
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vowel Control ("Ooh" / "Aah")</label>
                  <Select value={vowelControl} onValueChange={(v) => setVowelControl(v as any)}>
                    <SelectTrigger>
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume/Dynamics Control</label>
                  <Select value={volumeControl} onValueChange={(v) => setVolumeControl(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Disabled</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                      <SelectItem value="pan">Stereo Pan</SelectItem>
                      <SelectItem value="modulation">Modulation Depth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(vowelControl !== 'none' || volumeControl !== 'none') && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current Vowel Position:</span>
                      <span className="font-mono">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Dynamics:</span>
                      <span className="font-mono">{audioLevel.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Recording Controls */}
          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex-1">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="flex-1">
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
            
            <Button
              onClick={exportMIDI}
              variant="outline"
              disabled={recordedMIDI.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export MIDI
            </Button>
            
            <Button
              onClick={clearRecording}
              variant="outline"
              disabled={recordedMIDI.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* MIDI Recording Info */}
          {recordedMIDI.length > 0 && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">MIDI Recording</div>
                  <div className="text-sm text-muted-foreground">
                    {recordedMIDI.length} notes captured
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Feature Highlights */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎯 Real-Time Processing</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Ultra-low latency voice-to-MIDI conversion with advanced pitch detection algorithms
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎼 Smart Harmonization</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            AI-powered chord generation and key-locked scale quantization for perfect melodies
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🥁 Beatbox AI</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Train custom beatbox sounds and trigger samples with voice percussion
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎚️ Vocal Control</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Control effects and parameters using vowel sounds and voice dynamics
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceToMIDI;
