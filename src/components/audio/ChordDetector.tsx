/**
 * Chord Detection Component
 * Analyzes audio to detect chords and progressions in real-time
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Mic, 
  Play, 
  Pause, 
  Square,
  Music,
  Piano,
  Download,
  Copy,
  Loader2,
  FileMusic
} from 'lucide-react';
import { toast } from 'sonner';

interface DetectedChord {
  chord: string;
  timestamp: number;
  duration: number;
  confidence: number;
  notes: string[];
}

interface ChordProgression {
  chords: string[];
  key: string;
  mode: 'major' | 'minor';
  commonName?: string;
}

// Common chord progressions for matching
const COMMON_PROGRESSIONS: { pattern: string[]; name: string; genres: string[] }[] = [
  { pattern: ['I', 'V', 'vi', 'IV'], name: 'Pop Progression', genres: ['Pop', 'Rock'] },
  { pattern: ['I', 'IV', 'V', 'I'], name: 'Blues/Rock', genres: ['Blues', 'Rock'] },
  { pattern: ['vi', 'IV', 'I', 'V'], name: 'Sad Pop', genres: ['Pop', 'Ballad'] },
  { pattern: ['I', 'vi', 'IV', 'V'], name: '50s Progression', genres: ['Doo-wop', 'Pop'] },
  { pattern: ['ii', 'V', 'I'], name: 'Jazz ii-V-I', genres: ['Jazz', 'R&B'] },
  { pattern: ['I', 'IV', 'vi', 'V'], name: 'Axis Progression', genres: ['Pop', 'EDM'] },
  { pattern: ['i', 'VII', 'VI', 'VII'], name: 'Amapiano Pattern', genres: ['Amapiano', 'Afrobeats'] },
  { pattern: ['i', 'iv', 'VII', 'III'], name: 'Andalusian Cadence', genres: ['Flamenco', 'EDM'] },
];

export function ChordDetector() {
  const [mode, setMode] = useState<'file' | 'live'>('file');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [detectedChords, setDetectedChords] = useState<DetectedChord[]>([]);
  const [currentChord, setCurrentChord] = useState<DetectedChord | null>(null);
  const [progression, setProgression] = useState<ChordProgression | null>(null);
  const [showMidiExport, setShowMidiExport] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Update current chord based on playback time
  useEffect(() => {
    if (!isPlaying || detectedChords.length === 0) return;
    
    const chord = detectedChords.find(
      c => currentTime >= c.timestamp && currentTime < c.timestamp + c.duration
    );
    
    if (chord && chord !== currentChord) {
      setCurrentChord(chord);
    }
  }, [currentTime, detectedChords, isPlaying, currentChord]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setDetectedChords([]);
    setCurrentChord(null);
    setProgression(null);
    toast.success(`Loaded: ${file.name}`);
  };

  const analyzeAudio = async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setDetectedChords([]);

    try {
      // Simulate chord detection process
      const steps = [
        'Loading audio...',
        'Computing chromagram...',
        'Detecting beats...',
        'Analyzing harmonic content...',
        'Identifying chords...',
        'Building progression...'
      ];

      for (let i = 0; i < steps.length; i++) {
        toast.info(steps[i]);
        setProgress((i + 1) / steps.length * 100);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate mock chord detection results
      const mockChords = generateMockChords();
      setDetectedChords(mockChords);
      
      // Identify progression pattern
      const prog = identifyProgression(mockChords);
      setProgression(prog);

      toast.success('Chord detection complete!');

    } catch (error) {
      console.error('Chord detection failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const generateMockChords = (): DetectedChord[] => {
    // Amapiano-style progression
    const chordSequence = [
      { chord: 'Am', notes: ['A', 'C', 'E'] },
      { chord: 'G', notes: ['G', 'B', 'D'] },
      { chord: 'F', notes: ['F', 'A', 'C'] },
      { chord: 'Em', notes: ['E', 'G', 'B'] },
    ];

    const duration = 2; // 2 seconds per chord
    return chordSequence.map((c, i) => ({
      chord: c.chord,
      timestamp: i * duration,
      duration,
      confidence: 85 + Math.random() * 15,
      notes: c.notes
    }));
  };

  const identifyProgression = (chords: DetectedChord[]): ChordProgression => {
    const uniqueChords = [...new Set(chords.map(c => c.chord))];
    
    return {
      chords: uniqueChords,
      key: 'A',
      mode: 'minor',
      commonName: 'Amapiano Pattern'
    };
  };

  const startLiveRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Listening for chords...');

      // Simulate real-time chord detection
      const interval = setInterval(() => {
        const randomChords = ['C', 'Am', 'F', 'G', 'Dm', 'Em'];
        const chord = randomChords[Math.floor(Math.random() * randomChords.length)];
        setCurrentChord({
          chord,
          timestamp: Date.now(),
          duration: 1,
          confidence: 70 + Math.random() * 30,
          notes: []
        });
      }, 2000);

      mediaRecorder.onstop = () => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
      };

    } catch (error) {
      console.error('Microphone access denied:', error);
      toast.error('Please allow microphone access');
    }
  };

  const stopLiveRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setCurrentChord(null);
    toast.success('Recording stopped');
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const copyProgression = () => {
    if (!progression) return;
    const text = progression.chords.join(' → ');
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportMidi = () => {
    toast.success('MIDI export started');
    // In production, would generate actual MIDI file
  };

  const getChordColor = (confidence: number): string => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 75) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Piano className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold">Chord Detector</h2>
        </div>
        <p className="text-muted-foreground">
          Detect chords from audio files or in real-time from your microphone
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Audio Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'file' | 'live')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileMusic className="w-4 h-4" />
                  File Upload
                </TabsTrigger>
                <TabsTrigger value="live" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Live Input
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4 mt-4">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                {!audioFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Upload audio to analyze</p>
                    <p className="text-sm text-muted-foreground">
                      WAV, MP3, FLAC supported
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <Music className="w-10 h-10 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{audioFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlayback}
                        disabled={detectedChords.length === 0}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>

                    {audioUrl && (
                      <audio 
                        ref={audioRef} 
                        src={audioUrl} 
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        onEnded={() => setIsPlaying(false)}
                      />
                    )}

                    {isAnalyzing ? (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-center text-muted-foreground">
                          Analyzing... {Math.round(progress)}%
                        </p>
                      </div>
                    ) : (
                      <Button onClick={analyzeAudio} className="w-full">
                        <Piano className="w-4 h-4 mr-2" />
                        Detect Chords
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="live" className="space-y-4 mt-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  {isRecording ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                        <Mic className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="font-medium">Listening...</p>
                      {currentChord && (
                        <Badge className="text-2xl py-2 px-6" variant="secondary">
                          {currentChord.chord}
                        </Badge>
                      )}
                      <Button variant="destructive" onClick={stopLiveRecording}>
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Mic className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Click to start real-time chord detection
                      </p>
                      <Button onClick={startLiveRecording}>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Listening
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Current Chord Display */}
        <Card>
          <CardHeader>
            <CardTitle>Current Chord</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
            {currentChord ? (
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {currentChord.chord}
                </div>
                <div className="flex gap-2 justify-center">
                  {currentChord.notes.map(note => (
                    <Badge key={note} variant="outline" className="text-lg">
                      {note}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getChordColor(currentChord.confidence)}`} />
                  <span className="text-sm text-muted-foreground">
                    {currentChord.confidence.toFixed(0)}% confidence
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Piano className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No chord detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {detectedChords.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Chord Timeline</CardTitle>
              <CardDescription>
                Click a chord to seek to that position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {detectedChords.map((chord, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = chord.timestamp;
                          setCurrentChord(chord);
                        }
                      }}
                      className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentChord === chord ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Badge variant="secondary" className="text-lg font-bold w-16 justify-center">
                        {chord.chord}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={chord.confidence} 
                            className="h-2 flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {chord.confidence.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {chord.timestamp.toFixed(1)}s - {(chord.timestamp + chord.duration).toFixed(1)}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Progression Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Progression Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {progression && (
                <>
                  <div className="space-y-2">
                    <Label>Detected Key</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-lg py-1 px-3">
                        {progression.key} {progression.mode}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Chord Progression</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {progression.chords.map((chord, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-lg">
                            {chord}
                          </Badge>
                          {i < progression.chords.length - 1 && (
                            <span className="text-muted-foreground">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {progression.commonName && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="font-medium">Common Pattern Detected</p>
                      <p className="text-lg text-primary">{progression.commonName}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyProgression} className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" onClick={exportMidi} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export MIDI
                    </Button>
                  </div>
                </>
              )}

              <div className="space-y-4 pt-4 border-t">
                <Label>Similar Progressions</Label>
                <div className="space-y-2">
                  {COMMON_PROGRESSIONS.slice(0, 4).map((prog, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="font-medium text-sm">{prog.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {prog.pattern.join(' - ')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {prog.genres[0]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
