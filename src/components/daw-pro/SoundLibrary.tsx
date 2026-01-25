/**
 * SoundLibrary - Enhanced sound browser with visual polish
 * Categorized samples, waveform previews, and tag-based filtering
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import {
  Search, Play, Pause, Heart, Plus, Download, Filter,
  Music, Drum, Piano, Mic2, Waves, Radio, Volume2,
  Star, Clock, Folder, ChevronRight, Sparkles, Zap
} from 'lucide-react';

interface SoundItem {
  id: string;
  name: string;
  category: 'drums' | 'bass' | 'synth' | 'vocals' | 'fx' | 'loops';
  subcategory: string;
  bpm?: number;
  key?: string;
  tags: string[];
  duration: number;
  favorite?: boolean;
  isNew?: boolean;
}

interface WaveformDisplayProps {
  isPlaying: boolean;
  className?: string;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ isPlaying, className }) => {
  const bars = 24;
  return (
    <div className={cn("flex items-center gap-[2px] h-8", className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const height = Math.random() * 60 + 20;
        return (
          <motion.div
            key={i}
            className={cn(
              "w-[2px] rounded-full",
              isPlaying ? "bg-primary" : "bg-muted-foreground/30"
            )}
            initial={{ height: `${height}%` }}
            animate={isPlaying ? {
              height: [`${height}%`, `${Math.random() * 80 + 20}%`, `${height}%`],
            } : { height: `${height}%` }}
            transition={{
              duration: 0.4,
              repeat: isPlaying ? Infinity : 0,
              delay: i * 0.02,
            }}
          />
        );
      })}
    </div>
  );
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  drums: <Drum className="h-4 w-4" />,
  bass: <Waves className="h-4 w-4" />,
  synth: <Piano className="h-4 w-4" />,
  vocals: <Mic2 className="h-4 w-4" />,
  fx: <Sparkles className="h-4 w-4" />,
  loops: <Radio className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  drums: 'hsl(var(--secondary))',
  bass: 'hsl(var(--primary))',
  synth: 'hsl(270 75% 65%)',
  vocals: 'hsl(320 80% 60%)',
  fx: 'hsl(160 80% 45%)',
  loops: 'hsl(199 89% 48%)',
};

const SOUND_LIBRARY: SoundItem[] = [
  // Drums
  { id: 'kick-808-deep', name: 'Kick 808 Deep', category: 'drums', subcategory: 'Kicks', tags: ['808', 'deep', 'sub'], duration: 0.8, isNew: true },
  { id: 'kick-log-classic', name: 'Kick Log Classic', category: 'drums', subcategory: 'Kicks', tags: ['log', 'amapiano', 'punchy'], duration: 0.6 },
  { id: 'kick-punchy', name: 'Kick Punchy', category: 'drums', subcategory: 'Kicks', tags: ['punchy', 'tight'], duration: 0.5 },
  { id: 'snare-rim', name: 'Snare Rim Shot', category: 'drums', subcategory: 'Snares', tags: ['rim', 'tight', 'crack'], duration: 0.3 },
  { id: 'clap-thick', name: 'Clap Thick', category: 'drums', subcategory: 'Claps', tags: ['clap', 'layered', 'fat'], duration: 0.4 },
  { id: 'hihat-closed', name: 'Hi-Hat Closed', category: 'drums', subcategory: 'Hi-Hats', tags: ['closed', 'tight'], duration: 0.1 },
  { id: 'hihat-open', name: 'Hi-Hat Open', category: 'drums', subcategory: 'Hi-Hats', tags: ['open', 'sizzle'], duration: 0.5 },
  { id: 'shaker-16', name: 'Shaker 16th', category: 'drums', subcategory: 'Percussion', tags: ['shaker', 'groove'], duration: 0.2 },
  { id: 'conga-slap', name: 'Conga Slap', category: 'drums', subcategory: 'Percussion', tags: ['conga', 'afro'], duration: 0.3 },
  
  // Bass
  { id: 'bass-log-deep', name: 'Log Bass Deep', category: 'bass', subcategory: 'Log Drums', tags: ['log', 'deep', 'sub', 'amapiano'], duration: 1.2, isNew: true },
  { id: 'bass-808-sub', name: '808 Sub Bass', category: 'bass', subcategory: '808', tags: ['808', 'sub', 'long'], duration: 2.0 },
  { id: 'bass-synth-growl', name: 'Synth Bass Growl', category: 'bass', subcategory: 'Synth', tags: ['synth', 'growl', 'aggressive'], duration: 1.0 },
  { id: 'bass-reese', name: 'Reese Bass', category: 'bass', subcategory: 'Synth', tags: ['reese', 'detuned', 'dark'], duration: 1.5 },
  
  // Synths
  { id: 'pad-lush', name: 'Lush Pad', category: 'synth', subcategory: 'Pads', tags: ['pad', 'lush', 'warm'], duration: 4.0, key: 'Cm' },
  { id: 'pad-ethereal', name: 'Ethereal Pad', category: 'synth', subcategory: 'Pads', tags: ['pad', 'ethereal', 'airy'], duration: 4.0, key: 'Am', isNew: true },
  { id: 'lead-pluck', name: 'Pluck Lead', category: 'synth', subcategory: 'Leads', tags: ['pluck', 'bright', 'melodic'], duration: 0.5, key: 'Fm' },
  { id: 'chord-stab', name: 'Chord Stab', category: 'synth', subcategory: 'Stabs', tags: ['stab', 'chord', 'house'], duration: 0.8, key: 'Gm' },
  { id: 'keys-rhodes', name: 'Rhodes Keys', category: 'synth', subcategory: 'Keys', tags: ['rhodes', 'electric', 'soulful'], duration: 2.0, key: 'Dm' },
  
  // Vocals
  { id: 'vox-chop-1', name: 'Vocal Chop "Hey"', category: 'vocals', subcategory: 'Chops', tags: ['chop', 'hey', 'shout'], duration: 0.5 },
  { id: 'vox-phrase-1', name: 'Vocal Phrase Soul', category: 'vocals', subcategory: 'Phrases', tags: ['phrase', 'soul', 'melodic'], duration: 2.0, key: 'Cm' },
  { id: 'vox-adlib', name: 'Ad-lib "Yeah"', category: 'vocals', subcategory: 'Ad-libs', tags: ['adlib', 'yeah', 'energy'], duration: 0.8 },
  
  // FX
  { id: 'fx-riser-white', name: 'White Noise Riser', category: 'fx', subcategory: 'Risers', tags: ['riser', 'white', 'build'], duration: 4.0, isNew: true },
  { id: 'fx-impact', name: 'Impact Hit', category: 'fx', subcategory: 'Impacts', tags: ['impact', 'hit', 'drop'], duration: 1.5 },
  { id: 'fx-sweep-down', name: 'Sweep Down', category: 'fx', subcategory: 'Sweeps', tags: ['sweep', 'down', 'filter'], duration: 2.0 },
  
  // Loops
  { id: 'loop-drum-113', name: 'Drum Loop 113 BPM', category: 'loops', subcategory: 'Drums', tags: ['loop', 'drums', 'groove'], duration: 4.0, bpm: 113 },
  { id: 'loop-perc-tribal', name: 'Percussion Tribal', category: 'loops', subcategory: 'Percussion', tags: ['loop', 'perc', 'tribal', 'afro'], duration: 4.0, bpm: 115 },
  { id: 'loop-keys-soulful', name: 'Keys Loop Soulful', category: 'loops', subcategory: 'Melodic', tags: ['loop', 'keys', 'soulful'], duration: 8.0, bpm: 112, key: 'Fm' },
];

const POPULAR_TAGS = ['amapiano', 'log', 'deep', '808', 'groove', 'soulful', 'afro', 'punchy'];

interface SoundLibraryProps {
  onSelectSound?: (sound: SoundItem) => void;
  onAddToProject?: (sound: SoundItem) => void;
}

export const SoundLibrary: React.FC<SoundLibraryProps> = ({
  onSelectSound,
  onAddToProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const synthRef = useRef<Tone.ToneAudioNode | null>(null);

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const filteredSounds = SOUND_LIBRARY.filter(sound => {
    const matchesSearch = searchQuery === '' || 
      sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.tags.some(t => t.includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || sound.category === selectedCategory;
    const matchesTags = selectedTags.size === 0 || 
      Array.from(selectedTags).some(tag => sound.tags.includes(tag));
    return matchesSearch && matchesCategory && matchesTags;
  });

  const groupedSounds = filteredSounds.reduce((acc, sound) => {
    const key = sound.subcategory;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sound);
    return acc;
  }, {} as Record<string, SoundItem[]>);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const playSound = useCallback(async (sound: SoundItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await Tone.start();
    
    if (playingId === sound.id) {
      synthRef.current?.dispose();
      setPlayingId(null);
      return;
    }

    synthRef.current?.dispose();
    setPlayingId(sound.id);

    // Generate sound based on category
    let synth: Tone.ToneAudioNode;
    
    if (sound.category === 'drums') {
      if (sound.subcategory === 'Kicks') {
        synth = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 4,
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
        }).toDestination();
        (synth as Tone.MembraneSynth).triggerAttackRelease('C1', '8n');
      } else if (sound.subcategory === 'Snares' || sound.subcategory === 'Claps') {
        synth = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
        }).toDestination();
        (synth as Tone.NoiseSynth).triggerAttackRelease('16n');
      } else {
        synth = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5
        }).toDestination();
        (synth as Tone.MetalSynth).volume.value = -12;
        (synth as Tone.MetalSynth).triggerAttackRelease('C6', '32n');
      }
    } else if (sound.category === 'bass') {
      const monoSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 100, octaves: 3 }
      }).toDestination();
      monoSynth.triggerAttackRelease('C2', '4n');
      synth = monoSynth;
    } else if (sound.category === 'synth') {
      const polySynth = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 1 }
      }).toDestination();
      polySynth.volume.value = -6;
      polySynth.triggerAttackRelease(['C3', 'E3', 'G3'], '2n');
      synth = polySynth;
    } else {
      const fmSynth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }
      }).toDestination();
      fmSynth.triggerAttackRelease('C4', '4n');
      synth = fmSynth;
    }

    synthRef.current = synth;

    setTimeout(() => {
      if (playingId === sound.id) {
        synthRef.current?.dispose();
        setPlayingId(null);
      }
    }, sound.duration * 1000 + 200);
  }, [playingId]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-card to-card/80 border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Music className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Sound Library</h3>
            <p className="text-[10px] text-muted-foreground">{SOUND_LIBRARY.length} sounds</p>
          </div>
          <Button
            variant={showFilters ? 'default' : 'ghost'}
            size="sm"
            className="h-7"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/50"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {/* Category Pills */}
              <div className="flex gap-1 flex-wrap">
                {Object.keys(CATEGORY_ICONS).map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "h-6 text-[10px] gap-1",
                      selectedCategory === cat && "text-primary-foreground"
                    )}
                    style={selectedCategory === cat ? { 
                      backgroundColor: CATEGORY_COLORS[cat] 
                    } : undefined}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    {CATEGORY_ICONS[cat]}
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Tags */}
              <div className="flex gap-1 flex-wrap">
                {POPULAR_TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.has(tag) ? 'default' : 'outline'}
                    className="text-[9px] cursor-pointer hover:bg-primary/20"
                    onClick={() => toggleTag(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Access Tabs */}
      <div className="flex gap-1 p-2 border-b border-border">
        <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]">
          <Star className="h-3 w-3 mr-1 text-primary" /> Favorites
        </Button>
        <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]">
          <Clock className="h-3 w-3 mr-1" /> Recent
        </Button>
        <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]">
          <Zap className="h-3 w-3 mr-1 text-accent" /> New
        </Button>
      </div>

      {/* Sound List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {Object.entries(groupedSounds).map(([subcategory, sounds]) => (
            <div key={subcategory}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <Folder className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {subcategory}
                </span>
                <span className="text-[9px] text-muted-foreground/60">({sounds.length})</span>
              </div>
              
              <div className="space-y-1">
                {sounds.map((sound) => {
                  const isPlaying = playingId === sound.id;
                  const isFavorite = favorites.has(sound.id);
                  
                  return (
                    <motion.div
                      key={sound.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "group p-2 rounded-lg border cursor-pointer transition-all duration-200",
                        "hover:border-primary/50 hover:shadow-md hover:shadow-primary/5",
                        isPlaying 
                          ? "bg-primary/10 border-primary/50" 
                          : "bg-card/50 border-border/50"
                      )}
                      onClick={() => onSelectSound?.(sound)}
                    >
                      <div className="flex items-center gap-2">
                        {/* Play Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7 rounded-full shrink-0",
                            isPlaying && "bg-primary text-primary-foreground"
                          )}
                          onClick={(e) => playSound(sound, e)}
                        >
                          {isPlaying ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5 ml-0.5" />
                          )}
                        </Button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">{sound.name}</span>
                            {sound.isNew && (
                              <Badge className="h-4 px-1 text-[8px] bg-accent text-accent-foreground">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {sound.key && (
                              <span className="text-[9px] text-muted-foreground">{sound.key}</span>
                            )}
                            {sound.bpm && (
                              <span className="text-[9px] text-muted-foreground">{sound.bpm} BPM</span>
                            )}
                            <span className="text-[9px] text-muted-foreground">{sound.duration.toFixed(1)}s</span>
                          </div>
                        </div>

                        {/* Waveform Preview */}
                        <div className="hidden sm:block w-16">
                          <WaveformDisplay isPlaying={isPlaying} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => toggleFavorite(sound.id, e)}
                          >
                            <Heart className={cn(
                              "h-3 w-3",
                              isFavorite && "fill-destructive text-destructive"
                            )} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToProject?.(sound);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {sound.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag}
                            className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredSounds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No sounds found</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
