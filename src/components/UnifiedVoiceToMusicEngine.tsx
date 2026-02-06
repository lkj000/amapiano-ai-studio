/**
 * UnifiedVoiceToMusicEngine - Refactored
 * Core orchestrator composing extracted sub-modules:
 *   - musicTheory.ts (pitch/scale/chord utilities)
 *   - midiFileBuilder.ts (MIDI export)
 *   - PitchVisualizer (circular note display + level meter)
 *   - BeatboxPadGrid (trigger pads + instrument library)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Music2, Download, Upload, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import {
  NOTE_NAMES,
  SCALES,
  CHORD_PRESETS,
  frequencyToMidi,
  midiToNoteName,
  quantizeToScale,
  generateChord,
  detectPitch,
  formatTime,
} from '@/lib/audio/musicTheory';
import { type MIDINote, downloadMIDIFile } from '@/lib/midi/midiFileBuilder';
import { PitchVisualizer } from '@/components/voice-engine/PitchVisualizer';
import { BeatboxPadGrid } from '@/components/voice-engine/BeatboxPadGrid';

interface UnifiedVoiceToMusicEngineProps {
  onTrackGenerated?: (audioUrl: string, metadata: any) => void;
  initialAudio?: string;
}

export const UnifiedVoiceToMusicEngine = ({ onTrackGenerated, initialAudio }: UnifiedVoiceToMusicEngineProps) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Audio analysis state
  const [audioLevel, setAudioLevel] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState('');
  const [recordedMIDI, setRecordedMIDI] = useState<MIDINote[]>([]);

  // Musical config
  const [selectedMode, setSelectedMode] = useState<'melody' | 'instruction' | 'beatbox'>('melody');
  const [keyLockEnabled] = useState(false);
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedScale, setSelectedScale] = useState('major');
  const [chordMode] = useState(false);
  const [selectedChord, setSelectedChord] = useState('major');
  const [customInstructions, setCustomInstructions] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  const [generatedTrack, setGeneratedTrack] = useState<any>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 0.1), 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // Audio processing loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const dataArray = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
    const rms = Math.sqrt(sum / dataArray.length);
    setAudioLevel(Math.min(rms * 200, 100));

    if (selectedMode === 'melody' && rms > 0.001) {
      const pitch = detectPitch(dataArray, audioContextRef.current.sampleRate);
      if (pitch) {
        setDetectedPitch(pitch);
        let midiNote = frequencyToMidi(pitch);
        midiNote = quantizeToScale(midiNote, keyLockEnabled, selectedKey, selectedScale);
        setDetectedNote(midiToNoteName(midiNote));

        const notes = chordMode ? generateChord(midiNote, selectedChord) : [midiNote];
        const timestamp = Date.now();
        const newNotes: MIDINote[] = notes.map(n => ({
          note: n,
          velocity: Math.max(20, Math.floor(rms * 500)),
          timestamp,
          duration: 100,
        }));

        if (isRecordingRef.current) {
          setRecordedMIDI(prev => [...prev, ...newNotes]);
        }
      } else {
        setDetectedPitch(null);
        setDetectedNote('');
      }
    }

    animationFrameRef.current = requestAnimationFrame(processAudio);
  }, [selectedMode, chordMode, selectedChord, keyLockEnabled, selectedKey, selectedScale]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      mediaRecorderRef.current = recorder;
      recorder.start(100);

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

      const msgs = {
        melody: '🎵 Hum or sing — real-time pitch detection active!',
        instruction: '🗣️ Describe the music you want',
        beatbox: '🥁 Beatbox or trigger sounds',
      };
      toast.success(msgs[selectedMode]);
    } catch {
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setAudioLevel(0);
    setDetectedPitch(null);
    setDetectedNote('');
    toast.success(`Recording stopped. Captured ${recordedMIDI.length} MIDI notes`);
  };

  const generateMusic = async () => {
    if (!audioBlob && recordedMIDI.length === 0 && !textPrompt.trim()) {
      toast.error('No recording or text prompt to process');
      return;
    }
    setIsProcessing(true);
    toast.info(textPrompt.trim() ? '🎵 Generating from text…' : '🎵 Processing recording…');

    try {
      const body: any = {
        type: 'voice_to_music',
        mode: selectedMode,
        customInstructions: customInstructions || undefined,
        musicalSettings: { key: selectedKey, scale: selectedScale, chordMode, selectedChord },
        outputFormat: 'full_track_with_stems',
        amapiano_style: 'adaptive',
      };

      if (selectedMode === 'beatbox' || selectedMode === 'instruction' || textPrompt.trim()) {
        body.text = textPrompt.trim() || (selectedMode === 'beatbox'
          ? `Create an Amapiano beat with ${recordedMIDI.length} MIDI notes. Include 808 drums, log drums, and bass.`
          : 'Create an Amapiano track based on the vocal melody.');
        body.midiData = recordedMIDI;
      } else if (audioBlob) {
        const base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const b64 = (result.split(',')[1] || '').replace(/\s/g, '');
            const pad = b64.length % 4;
            resolve(pad ? b64 + '='.repeat(4 - pad) : b64);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(audioBlob);
        });
        body.audioData = base64Audio;
        body.midiData = recordedMIDI;
      } else {
        throw new Error('No audio or text input provided');
      }

      const { data, error } = await supabase.functions.invoke('neural-music-generation', { body });
      if (error) {
        const status = (error as any)?.status;
        const msg = (error as any)?.message || '';
        if (status === 402 || /insufficient_quota|Payment Required/i.test(msg))
          throw new Error('Transcription credits exhausted. Please add funds.');
        if (status === 429 || /rate limit/i.test(msg))
          throw new Error('Rate limit exceeded. Please wait.');
        throw new Error(msg || 'Edge function error');
      }

      if (data) {
        setGeneratedTrack({
          title: data.title || `${selectedMode} Generation ${new Date().toLocaleTimeString()}`,
          description: data.description || `Generated via ${selectedMode} mode`,
          audioUrl: data.audioUrl,
          stems: data.stems || [],
          metadata: data.metadata || {},
        });
        onTrackGenerated?.(data.audioUrl, {
          bpm: data.metadata?.bpm || 118,
          key: data.metadata?.key || selectedKey,
          genre: 'Amapiano',
          midiNotes: recordedMIDI.length,
        });
      }
      toast.success('🎵 Music generated successfully!');
    } catch (err: any) {
      console.error('Generation failed:', err);
      toast.error(`Failed to generate: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBeatboxMidiNote = useCallback((note: MIDINote) => {
    setRecordedMIDI(prev => [...prev, note]);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-background via-primary/5 to-background border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Unified Voice-to-Music Engine</CardTitle>
              <p className="text-xs text-muted-foreground">Advanced AI-Powered Music Creation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={isRecording ? 'border-destructive text-destructive animate-pulse' : 'border-green-500 text-green-500'}>
              {isRecording ? 'RECORDING' : 'READY'}
            </Badge>
            <Button variant="ghost" size="icon"><Settings className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={selectedMode} onValueChange={v => setSelectedMode(v as any)}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="melody">Melody</TabsTrigger>
            <TabsTrigger value="instruction">Instruction</TabsTrigger>
            <TabsTrigger value="beatbox">Beatbox</TabsTrigger>
          </TabsList>

          <TabsContent value="melody" className="space-y-4">
            <PitchVisualizer
              detectedNote={detectedNote}
              detectedPitch={detectedPitch}
              audioLevel={audioLevel}
              isRecording={isRecording}
              midiNoteCount={recordedMIDI.length}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <Select value={selectedKey} onValueChange={setSelectedKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTE_NAMES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scale</label>
                <Select value={selectedScale} onValueChange={setSelectedScale}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(SCALES).map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chord Mode</label>
              <Select value={selectedChord} onValueChange={setSelectedChord}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CHORD_PRESETS).map(([k, p]) => <SelectItem key={k} value={k}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="instruction" className="space-y-4">
            <div className="space-y-3 mb-4">
              <label className="text-sm font-medium">💬 Text Input (No Recording Required)</label>
              <Textarea
                placeholder="e.g., 'Upbeat amapiano with piano chords, log drums, deep bass at 118 BPM in F# minor'"
                value={textPrompt}
                onChange={e => setTextPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or record</span>
              </div>
            </div>
            <Textarea
              placeholder="Additional custom instructions (optional)"
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              className="min-h-[150px]"
            />
          </TabsContent>

          <TabsContent value="beatbox" className="space-y-4">
            <BeatboxPadGrid isRecording={isRecordingRef.current} onMidiNote={handleBeatboxMidiNote} />
          </TabsContent>
        </Tabs>

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} className="flex-1" size="lg">
              <Mic className="w-5 h-5 mr-2" />Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="flex-1" size="lg">
              <Square className="w-5 h-5 mr-2" />Stop ({formatTime(recordingDuration)})
            </Button>
          )}
        </div>

        {(audioBlob || textPrompt.trim()) && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={generateMusic} disabled={isProcessing}>
              <Music2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Generating…' : textPrompt.trim() ? 'Generate from Text' : 'Generate Music'}
            </Button>
            {recordedMIDI.length > 0 && (
              <>
                <Button onClick={() => downloadMIDIFile(recordedMIDI)} variant="outline">
                  <Download className="w-4 h-4 mr-2" />Export MIDI ({recordedMIDI.length})
                </Button>
                <Button onClick={() => {
                  localStorage.setItem('pendingMIDIImport', JSON.stringify({
                    notes: recordedMIDI,
                    name: `Voice Recording ${new Date().toLocaleTimeString()}`,
                    timestamp: Date.now(),
                  }));
                  toast.success('🎹 Opening DAW…');
                  setTimeout(() => { window.location.href = '/daw'; }, 500);
                }} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />Import to DAW
                </Button>
              </>
            )}
            <Button onClick={() => { setAudioBlob(null); setRecordedMIDI([]); setRecordingDuration(0); }} variant="ghost">
              <RefreshCw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        )}

        {/* Generated Track */}
        {generatedTrack && (
          <div className="mt-6 p-6 border-2 border-primary/30 rounded-xl bg-gradient-to-br from-background to-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{generatedTrack.title}</h3>
                <p className="text-sm text-muted-foreground">{generatedTrack.description}</p>
              </div>
              <Badge variant="secondary" className="gap-2"><Music2 className="w-4 h-4" />Generated</Badge>
            </div>
            <audio controls className="w-full" src={generatedTrack.audioUrl}>Your browser does not support audio.</audio>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => {
                const link = document.createElement('a');
                link.href = generatedTrack.audioUrl;
                link.download = `${generatedTrack.title}.mp3`;
                link.click();
              }}>
                <Download className="w-4 h-4 mr-2" />Download Track
              </Button>
              {onTrackGenerated && (
                <Button variant="outline" size="sm" onClick={() => onTrackGenerated(generatedTrack.audioUrl, generatedTrack)}>
                  <Upload className="w-4 h-4 mr-2" />Add to DAW
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setGeneratedTrack(null)}>
                <RefreshCw className="w-4 h-4 mr-2" />Clear
              </Button>
            </div>
            {generatedTrack.stems?.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-semibold">Stems</h4>
                <div className="grid grid-cols-2 gap-2">
                  {generatedTrack.stems.map((stem: any, idx: number) => (
                    <Button key={idx} variant="outline" size="sm" onClick={() => {
                      const link = document.createElement('a');
                      link.href = stem.url;
                      link.download = stem.name;
                      link.click();
                    }}>
                      <Download className="w-3 h-3 mr-2" />{stem.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedVoiceToMusicEngine;
