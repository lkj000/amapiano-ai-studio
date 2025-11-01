import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { SmartTemplateCard, SmartTemplate } from './SmartTemplateCard';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define all Smart Templates
const smartTemplates: SmartTemplate[] = [
  {
    id: 'amapianorizer',
    name: 'Amapianorizer',
    description: 'All-in-one multi-effect that instantly gives any sound the characteristic groove, pump, and low-end of Amapiano',
    genre: 'Amapiano',
    tags: ['Percussive', 'Rhythmic', 'Bass', 'Groove'],
    icon: '🪘',
    gradient: 'bg-gradient-to-br from-orange-500 to-pink-600',
    defaultParams: {
      swing: { value: 62, min: 50, max: 75, unit: '%', label: 'Swing Amount' },
      pumpIntensity: { value: 70, min: 0, max: 100, unit: '%', label: 'Pump Intensity' },
      bassBoost: { value: 6, min: 0, max: 12, unit: 'dB', label: 'Sub Bass Boost' },
      gatePattern: { value: 16, min: 8, max: 32, unit: 'steps', label: 'Gate Pattern Steps' },
      reverbSize: { value: 40, min: 0, max: 100, unit: '%', label: 'Space Size' },
    },
    signalChain: ['HPF 30Hz', 'Sub EQ +6dB', 'Pump Comp 4:1', 'Rhythmic Gate', 'Swing Delay', 'Space Reverb'],
    prompt: 'Create an Amapianorizer - an all-in-one multi-effect designed to instantly give any sound the characteristic groove, pump, and low-end of Amapiano music. Include: Sub bass enhancement with parametric EQ boosting 40-80Hz, Pumping sidechain-style compressor with adjustable intensity (default 70%), Rhythmic gate with swing timing (default 62% swing), Stereo delay with swing modulation, Ambient reverb for space, High-pass filter at 30Hz to clean up sub. Signal chain order: HPF → Sub EQ → Compressor → Gate → Delay → Reverb. All parameters should be musically calibrated for instant Amapiano vibes.',
  },
  {
    id: 'chillifier',
    name: 'Chillifier',
    description: 'Lo-fi warmth processor with tape hiss, vinyl crackle, gentle filtering, and analog character',
    genre: 'Lo-fi / Chillhop',
    tags: ['Ambient', 'Vintage', 'Warm', 'Nostalgic'],
    icon: '🎧',
    gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    defaultParams: {
      tapeHiss: { value: 15, min: 0, max: 50, unit: '%', label: 'Tape Hiss Amount' },
      vinylCrackle: { value: 20, min: 0, max: 50, unit: '%', label: 'Vinyl Crackle' },
      lowpass: { value: 8000, min: 2000, max: 16000, unit: 'Hz', label: 'Low-Pass Filter' },
      warmth: { value: 60, min: 0, max: 100, unit: '%', label: 'Analog Warmth' },
      wobble: { value: 0.3, min: 0, max: 1, unit: 'Hz', label: 'Wow & Flutter' },
    },
    signalChain: ['Tape Saturation', 'Low-Pass 8kHz', 'Vinyl Noise', 'Wow/Flutter LFO', 'Soft Limiter'],
    prompt: 'Create a Chillifier - a lo-fi warmth processor that adds nostalgic analog character. Include: Tape hiss generator (pink noise at -40dB), Vinyl crackle/pop samples triggered randomly, Low-pass filter (2-16kHz) with gentle slope, Tape saturation (soft clipping with harmonic enhancement), Wow & flutter (0.3Hz LFO modulating pitch ±5 cents), Slow-attack compressor for gentle dynamics, High shelf cut at 12kHz for vintage darkness. Perfect for creating chillhop, lo-fi beats, and nostalgic vibes.',
  },
  {
    id: 'log-drum-designer',
    name: 'Log Drum Designer',
    description: 'Complete log drum synthesizer with pitch envelope, tonal control, and signature Amapiano punch',
    genre: 'Amapiano',
    tags: ['Percussive', 'Synthesis', 'Tonal', 'Rhythmic'],
    icon: '🥁',
    gradient: 'bg-gradient-to-br from-red-500 to-orange-600',
    defaultParams: {
      pitchDecay: { value: 200, min: 50, max: 500, unit: 'ms', label: 'Pitch Decay Time' },
      pitchAmount: { value: 36, min: 12, max: 60, unit: 'semi', label: 'Pitch Drop Amount' },
      tone: { value: 800, min: 200, max: 3000, unit: 'Hz', label: 'Tonal Center' },
      click: { value: 50, min: 0, max: 100, unit: '%', label: 'Attack Click' },
      body: { value: 70, min: 0, max: 100, unit: '%', label: 'Body Resonance' },
    },
    signalChain: ['Noise Burst', 'Pitch Envelope', 'Body Resonator', 'Transient Designer', 'Saturation'],
    prompt: 'Create a Log Drum Designer - a complete synthesizer for Amapiano log drum sounds. Include: Sine oscillator with exponential pitch envelope (start 3x base frequency, decay to base in 200ms), Noise burst generator for attack transient (5ms duration), Bandpass resonator for body (Q=10, tunable 200-3000Hz), Transient designer to enhance attack, Soft saturation for analog warmth, ADSR envelope (fast attack, medium decay, no sustain, short release), Velocity-sensitive dynamics. This should create authentic log drum tones from soft melodic hits to aggressive percussive strikes.',
  },
  {
    id: 'vocal-fx-suite',
    name: 'Vocal FX Suite',
    description: 'Professional vocal processor with reverb, delay, pitch correction, formant shifting, and de-esser',
    genre: 'Universal',
    tags: ['Vocal', 'Creative', 'Polish', 'Production'],
    icon: '🎤',
    gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    defaultParams: {
      reverbSize: { value: 2.5, min: 0.5, max: 5, unit: 's', label: 'Reverb Decay' },
      delayTime: { value: 375, min: 100, max: 1000, unit: 'ms', label: 'Delay Time' },
      pitchCorrection: { value: 50, min: 0, max: 100, unit: '%', label: 'Auto-Tune Amount' },
      formantShift: { value: 0, min: -12, max: 12, unit: 'semi', label: 'Formant Shift' },
      deEss: { value: 8000, min: 4000, max: 12000, unit: 'Hz', label: 'De-Esser Freq' },
    },
    signalChain: ['De-Esser', 'Pitch Correct', 'Formant Shift', 'EQ', 'Delay', 'Reverb'],
    prompt: 'Create a Vocal FX Suite - a complete vocal processing chain. Include: De-esser (dynamic high-shelf cut at 8kHz when sibilance detected), Pitch correction with adjustable speed (auto-tune style), Formant shifter (±12 semitones without affecting pitch), Parametric EQ (presence boost at 3kHz, warmth at 200Hz), Stereo delay (tempo-synced or free), Plate reverb with pre-delay, High-pass filter at 80Hz, Gentle compression (3:1 ratio, medium attack/release). Create professional, polished vocal sound suitable for any genre.',
  },
  {
    id: 'afroswing-enhancer',
    name: 'AfroSwing Enhancer',
    description: 'Bouncy rhythm processor with syncopated gating, swing modulation, and stereo animation',
    genre: 'Afrobeat / Afroswing',
    tags: ['Rhythmic', 'Groove', 'Stereo', 'Bounce'],
    icon: '🌍',
    gradient: 'bg-gradient-to-br from-green-500 to-yellow-600',
    defaultParams: {
      swing: { value: 66, min: 50, max: 75, unit: '%', label: 'Swing Amount' },
      bounce: { value: 75, min: 0, max: 100, unit: '%', label: 'Bounce Intensity' },
      stereoWidth: { value: 80, min: 0, max: 150, unit: '%', label: 'Stereo Width' },
      gatePattern: { value: 12, min: 8, max: 32, unit: 'steps', label: 'Gate Pattern' },
      delay: { value: 250, min: 100, max: 500, unit: 'ms', label: 'Stereo Delay' },
    },
    signalChain: ['Bouncy EQ', 'Syncopated Gate', 'Swing Mod', 'Stereo Delay', 'Width Enhancer'],
    prompt: 'Create an AfroSwing Enhancer - a rhythm processor for Afrobeat and Afroswing grooves. Include: Bouncy EQ (boost at 100Hz and 3kHz in rhythm), Syncopated gate with swing timing (66% default), LFO-modulated delay for movement, Stereo width enhancer (mid/side processing), Micro-pitch modulation for shimmer, Rhythmic filter sweeps, Percussive transient enhancement. Should add infectious bounce and movement to drums, bass, and melodic elements.',
  },
  {
    id: 'deep-house-pump',
    name: 'Deep House Pump',
    description: 'Sidechain-style pumping with sub enhancement, filtered delay, and spacious reverb',
    genre: 'Deep House',
    tags: ['Bass', 'Rhythmic', 'Pump', 'Spacious'],
    icon: '🏠',
    gradient: 'bg-gradient-to-br from-indigo-600 to-purple-700',
    defaultParams: {
      pumpSpeed: { value: 8, min: 4, max: 16, unit: 'bars', label: 'Pump Rate' },
      pumpDepth: { value: 80, min: 0, max: 100, unit: '%', label: 'Pump Depth' },
      subBoost: { value: 5, min: 0, max: 10, unit: 'dB', label: 'Sub Boost' },
      filterCutoff: { value: 400, min: 200, max: 2000, unit: 'Hz', label: 'Filter Cutoff' },
      reverbDecay: { value: 4, min: 1, max: 8, unit: 's', label: 'Reverb Decay' },
    },
    signalChain: ['Sub EQ', 'Pumping Comp', 'LP Filter', 'Filtered Delay', 'Deep Reverb'],
    prompt: 'Create a Deep House Pump effect - a sidechain-style processor for deep house grooves. Include: Auto-ducking compressor synced to tempo (4/4 pump), Sub bass enhancer (40-80Hz boost), Low-pass filter with envelope follower, Filtered delay (delay send through LP filter), Deep reverb with long decay, Stereo imaging for width, Gentle saturation for warmth. Perfect for creating that characteristic deep house pump and groove on bass, pads, and chords.',
  },
  {
    id: 'percussion-polisher',
    name: 'Percussion Polisher',
    description: 'Drum enhancement suite with transient shaping, stereo spread, EQ sculpting, and saturation',
    genre: 'Universal',
    tags: ['Percussive', 'Transients', 'Stereo', 'Polish'],
    icon: '✨',
    gradient: 'bg-gradient-to-br from-yellow-500 to-red-600',
    defaultParams: {
      attackBoost: { value: 6, min: -12, max: 12, unit: 'dB', label: 'Attack Boost' },
      sustainControl: { value: -3, min: -12, max: 6, unit: 'dB', label: 'Sustain Control' },
      stereoWidth: { value: 60, min: 0, max: 150, unit: '%', label: 'Stereo Width' },
      presence: { value: 4, min: 0, max: 10, unit: 'dB', label: 'Presence Boost' },
      saturation: { value: 30, min: 0, max: 100, unit: '%', label: 'Saturation' },
    },
    signalChain: ['Transient Designer', 'Presence EQ', 'Stereo Spread', 'Saturation', 'Limiter'],
    prompt: 'Create a Percussion Polisher - an enhancement suite for drums and percussion. Include: Transient designer (independent attack/sustain control), Presence EQ (boost 2-5kHz for clarity), Stereo width enhancement (frequency-dependent), Parallel saturation for thickness, Dynamic EQ to tame resonances, Micro-shift stereo effect, Gentle limiting to prevent clipping. Should make drums punchier, clearer, and more present in the mix without sounding over-processed.',
  },
  {
    id: 'ambient-space-maker',
    name: 'Ambient Space Maker',
    description: 'Ethereal atmosphere creator with shimmer, long reverb, stereo widening, and octave textures',
    genre: 'Ambient',
    tags: ['Ambient', 'Spacious', 'Ethereal', 'Texture'],
    icon: '🌌',
    gradient: 'bg-gradient-to-br from-cyan-500 to-blue-700',
    defaultParams: {
      reverbDecay: { value: 8, min: 2, max: 20, unit: 's', label: 'Reverb Decay' },
      shimmer: { value: 50, min: 0, max: 100, unit: '%', label: 'Shimmer Amount' },
      width: { value: 120, min: 0, max: 200, unit: '%', label: 'Stereo Width' },
      octaveUp: { value: 30, min: 0, max: 100, unit: '%', label: 'Octave Texture' },
      lowShelf: { value: -3, min: -12, max: 6, unit: 'dB', label: 'Low Shelf' },
    },
    signalChain: ['Octave Up', 'Shimmer Reverb', 'Stereo Width', 'Low Shelf EQ', 'Soft Limiter'],
    prompt: 'Create an Ambient Space Maker - an atmospheric processor for pads, textures, and soundscapes. Include: Ultra-long reverb (up to 20s decay), Shimmer effect (pitch-shifted reverb +1 octave), Stereo width enhancer (up to 200%), Octave-up pitch shifter mixed in parallel, Low-shelf EQ cut for clarity, Slow modulation (LFO on reverb size/pitch), Soft saturation for analog warmth, Gentle compression to glue it together. Perfect for creating vast, ethereal spaces and cinematic textures.',
  },
  {
    id: 'bass-booster',
    name: 'Bass Booster',
    description: 'Complete bass enhancement with sub generation, harmonic exciter, compression, and filtering',
    genre: 'Universal',
    tags: ['Bass', 'Sub', 'Enhancement', 'Power'],
    icon: '🔊',
    gradient: 'bg-gradient-to-br from-red-600 to-purple-700',
    defaultParams: {
      subGain: { value: 8, min: 0, max: 15, unit: 'dB', label: 'Sub Boost' },
      harmonics: { value: 40, min: 0, max: 100, unit: '%', label: 'Harmonic Exciter' },
      compress: { value: 4, min: 1, max: 10, unit: ':1', label: 'Compression Ratio' },
      tightness: { value: 60, min: 0, max: 100, unit: '%', label: 'Tightness' },
      filterFreq: { value: 120, min: 40, max: 250, unit: 'Hz', label: 'High-Pass Filter' },
    },
    signalChain: ['HPF', 'Sub Synth', 'Harmonic Exciter', 'Compressor', 'Sub EQ', 'Limiter'],
    prompt: 'Create a Bass Booster - a complete bass enhancement suite. Include: High-pass filter (40-250Hz) to clean mud, Sub harmonic synthesizer (generates -1 octave), Harmonic exciter for upper harmonics (adds 2nd/3rd harmonics), Multiband compressor (separate sub/mid bands), Parametric EQ (boost 40-80Hz, cut 200-300Hz), Transient designer for tightness, Soft clipping for power, Limiter to prevent clipping. Should make bass powerful, clear, and present without muddiness.',
  },
  {
    id: 'experimental-fx-lab',
    name: 'Experimental FX Lab',
    description: 'Randomized creative effects with glitch, granular, spectral processing, and controlled chaos',
    genre: 'Experimental',
    tags: ['Creative', 'Glitch', 'Experimental', 'Random'],
    icon: '🔬',
    gradient: 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700',
    defaultParams: {
      chaos: { value: 50, min: 0, max: 100, unit: '%', label: 'Chaos Amount' },
      glitchDensity: { value: 30, min: 0, max: 100, unit: '%', label: 'Glitch Density' },
      grainSize: { value: 50, min: 10, max: 500, unit: 'ms', label: 'Grain Size' },
      spectralShift: { value: 0, min: -24, max: 24, unit: 'semi', label: 'Spectral Shift' },
      feedback: { value: 40, min: 0, max: 95, unit: '%', label: 'Feedback' },
    },
    signalChain: ['Buffer Manipulator', 'Granular Engine', 'Spectral Processor', 'Glitch Generator', 'Feedback Loop'],
    prompt: 'Create an Experimental FX Lab - a creative chaos generator. Include: Buffer manipulator (stutter, reverse, freeze), Granular synthesis engine (variable grain size/density), Spectral pitch shifter (frequency domain manipulation), Glitch generator (random cuts, repeats, bit reduction), Ring modulator with LFO, Sample rate reducer, Resonant filters with random modulation, Feedback loop with filtering, Randomization engine (controlled chaos parameter). Perfect for sound design, creative transitions, and experimental production.',
  },
  {
    id: 'mastering-lite',
    name: 'Mastering Lite',
    description: 'Gentle mastering chain with EQ, multiband compression, stereo imaging, and limiting',
    genre: 'Universal',
    tags: ['Mastering', 'Polish', 'Loudness', 'Professional'],
    icon: '🎚️',
    gradient: 'bg-gradient-to-br from-gray-600 to-gray-900',
    defaultParams: {
      lowShelf: { value: 1, min: -3, max: 6, unit: 'dB', label: 'Low Shelf' },
      highShelf: { value: 1.5, min: -3, max: 6, unit: 'dB', label: 'Air Boost' },
      mbCompression: { value: 50, min: 0, max: 100, unit: '%', label: 'MB Compression' },
      stereoWidth: { value: 105, min: 80, max: 120, unit: '%', label: 'Stereo Width' },
      ceiling: { value: -0.3, min: -3, max: 0, unit: 'dB', label: 'Limiter Ceiling' },
    },
    signalChain: ['Linear Phase EQ', 'Multiband Comp', 'Stereo Imager', 'Exciter', 'True Peak Limiter'],
    prompt: 'Create a Mastering Lite processor - a gentle mastering chain for final polish. Include: Linear-phase EQ (low shelf at 60Hz, high shelf at 12kHz), Multiband compressor (3 bands with gentle ratios), Stereo width control (separate low/mid/high), Harmonic exciter for presence, True peak limiter (-0.3dB ceiling), Dither for bit depth reduction, Mid-side processing option, LUFS metering. Should add subtle polish and competitive loudness without over-compression or harshness.',
  },
];

interface SmartTemplatesSectionProps {
  onGenerateFromTemplate: (template: SmartTemplate, customParams?: Record<string, number>) => void;
  isGenerating: boolean;
  userPrompt?: string; // For AI-powered suggestions
}

export const SmartTemplatesSection: React.FC<SmartTemplatesSectionProps> = ({
  onGenerateFromTemplate,
  isGenerating,
  userPrompt = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Extract unique genres and tags
  const genres = ['All', ...Array.from(new Set(smartTemplates.map(t => t.genre)))];
  const tags = ['All', ...Array.from(new Set(smartTemplates.flatMap(t => t.tags)))];

  // AI-powered template suggestions based on user prompt
  const suggestedTemplates = useMemo(() => {
    if (!userPrompt.trim()) return [];
    
    const keywords = userPrompt.toLowerCase().split(' ');
    const scored = smartTemplates.map(template => {
      let score = 0;
      const searchText = `${template.name} ${template.description} ${template.genre} ${template.tags.join(' ')}`.toLowerCase();
      
      keywords.forEach(keyword => {
        if (searchText.includes(keyword)) score += 1;
      });
      
      return { template, score };
    });
    
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.template.id);
  }, [userPrompt]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return smartTemplates.filter(template => {
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGenre = selectedGenre === 'All' || template.genre === selectedGenre;
      const matchesTag = selectedTag === 'All' || template.tags.includes(selectedTag);
      
      return matchesSearch && matchesGenre && matchesTag;
    });
  }, [searchQuery, selectedGenre, selectedTag]);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Smart Templates</CardTitle>
            <CardDescription>
              One-click plugin generators with proven musical recipes and genre-specific DSP chains
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Suggestions */}
        {suggestedTemplates.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm">AI Suggestions Based on Your Prompt</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestedTemplates.map(templateId => {
                  const template = smartTemplates.find(t => t.id === templateId);
                  return template ? (
                    <Badge 
                      key={template.id}
                      variant="default"
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => {
                        const element = document.getElementById(`template-${template.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      {template.icon} {template.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-3 h-3" />
                Genre
              </div>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <Badge
                    key={genre}
                    variant={selectedGenre === genre ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-3 h-3" />
                Function
              </div>
              <ScrollArea className="h-20">
                <div className="flex flex-wrap gap-2 pr-4">
                  {tags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map(template => (
            <div key={template.id} id={`template-${template.id}`}>
              <SmartTemplateCard
                template={template}
                onGenerate={onGenerateFromTemplate}
                isGenerating={isGenerating}
              />
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No templates found matching your criteria.</p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
                setSelectedTag('All');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Community Note */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium mb-2">🎵 Coming Soon: Community Templates</p>
              <p>Share your Smart Templates with the community and discover templates made by other producers!</p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
