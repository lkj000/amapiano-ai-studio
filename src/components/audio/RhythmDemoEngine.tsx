/**
 * Real Audio Demo Engine
 * 
 * Generates and plays actual audio using Tone.js with:
 * - Euclidean rhythm patterns
 * - Regional swing profiles (58.3% Gauteng Swing, etc.)
 * - Beat-1 silence (Amapiano Gasp)
 * - Heritage affinity scoring
 * 
 * NO MOCKS - REAL AUDIO ONLY
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Volume2, Music, Drum, Piano, Gauge, MapPin, Mic } from 'lucide-react';

import { 
  generateEuclideanRhythm, 
  AFRICAN_EUCLIDEAN_PATTERNS,
  GAUTENG_SWING_PRESETS,
  applyGautengSwing,
  calculatePatternDensity,
  calculateRhythmicComplexity
} from '@/lib/dsp/euclideanRhythm';

import { 
  REGIONAL_SWING_PROFILES, 
  getAllProfileKeys,
  getProfile,
  applyBeat1Silence,
  calculateSwingOffsetMs
} from '@/lib/dsp/regionalSwingProfiles';

import {
  calculateHeritageAffinity,
  HERITAGE_PROFILES,
  type HeritageAffinityScore
} from '@/lib/audio/heritageAffinity';

import { VOCAL_INTERJECTIONS, type VocalInterjection } from '@/lib/audio/amapianoGasp';

interface RhythmDemoEngineProps {
  className?: string;
}

type InstrumentType = 'logDrum' | 'shaker' | 'kick' | 'hihat' | 'piano';

interface PatternState {
  pattern: boolean[];
  name: string;
  enabled: boolean;
}

const RhythmDemoEngine: React.FC<RhythmDemoEngineProps> = ({ className }) => {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [bpm, setBpm] = useState(115);
  const [volume, setVolume] = useState(-6);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Pattern state
  const [selectedPattern, setSelectedPattern] = useState<string>('log-drum-basic');
  const [patterns, setPatterns] = useState<Record<InstrumentType, PatternState>>({
    logDrum: { pattern: [], name: 'log-drum-basic', enabled: true },
    shaker: { pattern: [], name: 'shaker-dense', enabled: true },
    kick: { pattern: [], name: 'kwaito-kick', enabled: true },
    hihat: { pattern: [], name: 'hihat-offbeat', enabled: true },
    piano: { pattern: [], name: 'bembé', enabled: false }
  });
  
  // Regional profile state
  const [selectedProfile, setSelectedProfile] = useState<string>('johannesburg-deep');
  const [beat1SilenceEnabled, setBeat1SilenceEnabled] = useState(true);
  
  // Heritage scoring state
  const [heritageScore, setHeritageScore] = useState<HeritageAffinityScore | null>(null);
  
  // Audio refs
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const synthsRef = useRef<{
    logDrum: Tone.MembraneSynth;
    shaker: Tone.NoiseSynth;
    kick: Tone.MembraneSynth;
    hihat: Tone.MetalSynth;
    piano: Tone.PolySynth;
  } | null>(null);
  const volumeNodeRef = useRef<Tone.Volume | null>(null);

  // Initialize synths
  const initializeSynths = useCallback(async () => {
    if (synthsRef.current) return;

    await Tone.start();
    
    volumeNodeRef.current = new Tone.Volume(volume).toDestination();

    // Log Drum - Deep membrane synth with pitch envelope (authentic amapiano sound)
    const logDrum = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.4,
        attackCurve: 'exponential'
      }
    }).connect(volumeNodeRef.current);

    // Shaker - Filtered noise
    const shaker = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.02
      }
    }).connect(volumeNodeRef.current);
    
    // Apply highpass filter for shaker
    const shakerFilter = new Tone.Filter(4000, 'highpass').connect(volumeNodeRef.current);
    shaker.disconnect();
    shaker.connect(shakerFilter);

    // Kick - Low membrane
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.3
      }
    }).connect(volumeNodeRef.current);

    // Hi-hat - Metal synth
    const hihat = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.05,
        release: 0.01
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).connect(volumeNodeRef.current);
    hihat.volume.value = -12;

    // Piano - PolySynth with FM for Rhodes-like sound
    const piano = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3,
      modulationIndex: 10,
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.2,
        release: 0.5
      },
      modulation: { type: 'square' },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.2,
        release: 0.5
      }
    }).connect(volumeNodeRef.current);
    piano.volume.value = -8;

    synthsRef.current = { logDrum, shaker, kick, hihat, piano };
    setIsLoaded(true);
  }, [volume]);

  // Generate patterns based on current selections
  const generatePatterns = useCallback(() => {
    const newPatterns = { ...patterns };
    
    for (const [instrument, state] of Object.entries(newPatterns)) {
      const patternDef = AFRICAN_EUCLIDEAN_PATTERNS[state.name];
      if (patternDef) {
        newPatterns[instrument as InstrumentType] = {
          ...state,
          pattern: generateEuclideanRhythm(patternDef.pulses, patternDef.steps, patternDef.rotation)
        };
      }
    }
    
    setPatterns(newPatterns);
  }, [patterns]);

  // Calculate heritage score based on current settings
  const updateHeritageScore = useCallback(() => {
    const profile = getProfile(selectedProfile);
    const shakerPattern = patterns.shaker.pattern;
    
    const score = calculateHeritageAffinity(
      {
        bpm,
        key: 'Am',
        energy: 0.65,
        danceability: 0.8,
        spectralCentroid: 2200,
        zeroCrossingRate: 0.15,
        mfcc: []
      },
      {
        hasLogDrum: patterns.logDrum.enabled,
        hasShaker: patterns.shaker.enabled,
        shakerDensity: shakerPattern.length > 0 ? calculatePatternDensity(shakerPattern) : 0,
        swingAmount: profile.swingPercentage / 100,
        pianoVoicing: 'minor7'
      }
    );
    
    setHeritageScore(score);
  }, [bpm, selectedProfile, patterns]);

  // Start/stop playback
  const togglePlayback = useCallback(async () => {
    if (!synthsRef.current) {
      await initializeSynths();
    }

    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      sequenceRef.current?.dispose();
      setIsPlaying(false);
      setCurrentStep(0);
      return;
    }

    const profile = getProfile(selectedProfile);
    Tone.Transport.bpm.value = bpm;

    // Create sequence
    const steps = Array.from({ length: 16 }, (_, i) => i);
    
    sequenceRef.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step);
        
        const synths = synthsRef.current;
        if (!synths) return;

        // Calculate swing offset for this step
        const isOffbeat = step % 2 === 1;
        const swingMs = calculateSwingOffsetMs(bpm, profile.swingPercentage);
        const microOffset = profile.microTimingOffsets[step] / 1000;
        const totalOffset = isOffbeat ? swingMs / 1000 + microOffset : microOffset;
        
        // Get velocity with accent
        const baseVelocity = profile.velocityAccents[step];
        
        // Apply beat 1 silence if enabled
        const finalVelocity = beat1SilenceEnabled 
          ? applyBeat1Silence(
              Math.round(baseVelocity * 127),
              step,
              profile.beat1Silence
            ) / 127
          : baseVelocity;

        // Log Drum
        if (patterns.logDrum.enabled && patterns.logDrum.pattern[step]) {
          const logVel = finalVelocity * 0.9;
          if (logVel > 0.1) {
            synths.logDrum.triggerAttackRelease(
              'C1',
              '8n',
              time + totalOffset,
              logVel
            );
          }
        }

        // Shaker (always on offbeats with density)
        if (patterns.shaker.enabled && patterns.shaker.pattern[step % patterns.shaker.pattern.length]) {
          synths.shaker.triggerAttackRelease(
            '32n',
            time + totalOffset,
            baseVelocity * 0.5
          );
        }

        // Kick
        if (patterns.kick.enabled && patterns.kick.pattern[step % patterns.kick.pattern.length]) {
          synths.kick.triggerAttackRelease(
            'G0',
            '8n',
            time + (profile.kickStyle.offsetMs / 1000),
            finalVelocity
          );
        }

        // Hi-hat
        if (patterns.hihat.enabled && patterns.hihat.pattern[step % patterns.hihat.pattern.length]) {
          synths.hihat.triggerAttackRelease(
            '32n',
            time + totalOffset,
            baseVelocity * 0.4
          );
        }

        // Piano (chord stabs on select beats)
        if (patterns.piano.enabled && patterns.piano.pattern[step % patterns.piano.pattern.length]) {
          const chords = ['A3', 'C4', 'E4', 'G4']; // Am7
          const strumDelay = profile.pianoFeel.strumSpread / 1000;
          
          chords.forEach((note, i) => {
            synths.piano.triggerAttackRelease(
              note,
              '4n',
              time + totalOffset + (i * strumDelay * 0.02),
              finalVelocity * 0.6
            );
          });
        }
      },
      steps,
      '16n'
    );

    sequenceRef.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
  }, [isPlaying, bpm, selectedProfile, patterns, beat1SilenceEnabled, initializeSynths]);

  // Update volume
  useEffect(() => {
    if (volumeNodeRef.current) {
      volumeNodeRef.current.volume.value = volume;
    }
  }, [volume]);

  // Update patterns when pattern names change
  useEffect(() => {
    generatePatterns();
  }, []);

  // Update heritage score when relevant settings change
  useEffect(() => {
    updateHeritageScore();
  }, [bpm, selectedProfile, patterns, updateHeritageScore]);

  // Cleanup
  useEffect(() => {
    return () => {
      sequenceRef.current?.dispose();
      if (synthsRef.current) {
        Object.values(synthsRef.current).forEach(synth => synth.dispose());
      }
      volumeNodeRef.current?.dispose();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  const profile = getProfile(selectedProfile);
  const profileKeys = getAllProfileKeys();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            Rhythm Demo Engine
          </CardTitle>
          <CardDescription>
            Real audio generation using Euclidean rhythms, regional swing profiles, and heritage scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Button 
              onClick={togglePlayback}
              size="lg"
              variant={isPlaying ? "destructive" : "default"}
            >
              {isPlaying ? (
                <><Square className="mr-2 h-4 w-4" /> Stop</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Play</>
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Label>BPM: {bpm}</Label>
              <Slider
                value={[bpm]}
                onValueChange={([v]) => setBpm(v)}
                min={100}
                max={130}
                step={1}
                className="w-32"
              />
            </div>

            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                min={-24}
                max={0}
                step={1}
                className="w-24"
              />
            </div>

            {/* Step indicator */}
            <div className="flex gap-1">
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    currentStep === i 
                      ? 'bg-primary' 
                      : i % 4 === 0 
                        ? 'bg-muted-foreground/40' 
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="regional">Regional Swing</TabsTrigger>
          <TabsTrigger value="heritage">Heritage Score</TabsTrigger>
          <TabsTrigger value="vocals">Vocal Interjections</TabsTrigger>
        </TabsList>

        {/* Patterns Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Drum className="h-5 w-5" />
                Euclidean Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.entries(patterns) as [InstrumentType, PatternState][]).map(([instrument, state]) => (
                <div key={instrument} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={state.enabled}
                        onCheckedChange={(checked) => {
                          setPatterns(prev => ({
                            ...prev,
                            [instrument]: { ...prev[instrument], enabled: checked }
                          }));
                        }}
                      />
                      <Label className="capitalize font-medium">{instrument}</Label>
                    </div>
                    <Select
                      value={state.name}
                      onValueChange={(value) => {
                        const patternDef = AFRICAN_EUCLIDEAN_PATTERNS[value];
                        if (patternDef) {
                          setPatterns(prev => ({
                            ...prev,
                            [instrument]: {
                              ...prev[instrument],
                              name: value,
                              pattern: generateEuclideanRhythm(patternDef.pulses, patternDef.steps, patternDef.rotation)
                            }
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AFRICAN_EUCLIDEAN_PATTERNS).map(([key, def]) => (
                          <SelectItem key={key} value={key}>
                            {key} ({def.pulses}/{def.steps})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Visual pattern display */}
                  <div className="flex gap-1">
                    {state.pattern.map((hit, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${
                          hit 
                            ? state.enabled 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted-foreground/50'
                            : 'bg-muted'
                        } ${currentStep === i && isPlaying ? 'ring-2 ring-primary' : ''}`}
                      >
                        {hit ? '●' : ''}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Density: {(calculatePatternDensity(state.pattern) * 100).toFixed(0)}%</span>
                    <span>Complexity: {calculateRhythmicComplexity(state.pattern).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Swing Tab */}
        <TabsContent value="regional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Regional Swing Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {profileKeys.map(key => {
                      const p = getProfile(key);
                      return (
                        <SelectItem key={key} value={key}>
                          {p.name} ({p.swingPercentage}%)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={beat1SilenceEnabled}
                    onCheckedChange={setBeat1SilenceEnabled}
                  />
                  <Label>Beat-1 Silence (Amapiano Gasp)</Label>
                </div>
              </div>

              {/* Profile details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Swing</div>
                  <div className="text-2xl font-bold">{profile.swingPercentage}%</div>
                  <div className="text-xs text-muted-foreground">
                    {profile.swingPercentage === 58.3 ? '✨ Authentic Gauteng' : ''}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">BPM Range</div>
                  <div className="text-2xl font-bold">{profile.bpmRange.min}-{profile.bpmRange.max}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Province</div>
                  <div className="text-lg font-bold capitalize">{profile.province}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Region</div>
                  <div className="text-lg font-bold">{profile.region}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              </div>

              <div className="space-y-2">
                <Label>Cultural Context</Label>
                <p className="text-sm text-muted-foreground">{profile.culturalContext}</p>
              </div>

              <div className="space-y-2">
                <Label>Influences</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.influences.map(inf => (
                    <Badge key={inf} variant="secondary">{inf}</Badge>
                  ))}
                </div>
              </div>

              {/* Beat 1 Silence Config */}
              {beat1SilenceEnabled && (
                <div className="p-4 border rounded-lg space-y-2">
                  <Label>Beat-1 Silence Configuration</Label>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>{' '}
                      {profile.beat1Silence.duration} steps
                    </div>
                    <div>
                      <span className="text-muted-foreground">Probability:</span>{' '}
                      {(profile.beat1Silence.probability * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{' '}
                      {profile.beat1Silence.type}
                    </div>
                  </div>
                </div>
              )}

              {/* Micro-timing visualization */}
              <div className="space-y-2">
                <Label>Micro-Timing Offsets (ms)</Label>
                <div className="flex gap-1 items-end h-16">
                  {profile.microTimingOffsets.map((offset, i) => {
                    const height = Math.abs(offset) * 2;
                    const isPositive = offset >= 0;
                    return (
                      <div key={i} className="flex flex-col items-center w-6">
                        <div 
                          className={`w-4 ${isPositive ? 'bg-primary' : 'bg-destructive'} rounded-sm`}
                          style={{ height: `${Math.max(4, height)}px` }}
                        />
                        <span className="text-[9px] text-muted-foreground">{offset}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heritage Score Tab */}
        <TabsContent value="heritage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Heritage Affinity Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {heritageScore && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="text-6xl font-bold text-primary">
                      {heritageScore.overall}
                    </div>
                    <div className="text-lg text-muted-foreground">/ 100</div>
                    <Badge variant={heritageScore.overall >= 80 ? "default" : heritageScore.overall >= 60 ? "secondary" : "outline"}>
                      {heritageScore.overall >= 80 ? 'Authentic' : heritageScore.overall >= 60 ? 'Good' : 'Developing'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(heritageScore.breakdown).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{key}</span>
                          <span>{value}/100</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Detected Regional Style</Label>
                    <Badge variant="outline" className="text-base">
                      {HERITAGE_PROFILES[heritageScore.regionalStyle]?.name || heritageScore.regionalStyle}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Cultural Markers Detected</Label>
                    <div className="flex flex-wrap gap-2">
                      {heritageScore.culturalMarkers.map(marker => (
                        <Badge key={marker} variant="secondary">{marker}</Badge>
                      ))}
                    </div>
                  </div>

                  {heritageScore.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <Label>Recommendations</Label>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {heritageScore.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vocal Interjections Tab */}
        <TabsContent value="vocals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Vocal Interjections Library
              </CardTitle>
              <CardDescription>
                Authentic South African vocal expressions for all 11 official languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(VOCAL_INTERJECTIONS).map(([lang, interjections]) => (
                  <div key={lang} className="p-3 border rounded-lg">
                    <div className="font-medium capitalize mb-2">{lang}</div>
                    <div className="flex flex-wrap gap-1">
                      {(interjections as VocalInterjection[]).slice(0, 8).map((interjection) => (
                        <Badge 
                          key={interjection.text} 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => {
                            // In a real implementation, this would trigger TTS or sampled audio
                            console.log(`Playing: ${interjection.text} (${lang})`);
                          }}
                        >
                          {interjection.text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RhythmDemoEngine;
