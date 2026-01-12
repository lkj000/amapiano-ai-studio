/**
 * Sample Browser Component
 * LANDR-inspired sample discovery with Amapiano-focused categories
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Music, 
  Search, 
  Download, 
  Play,
  Pause,
  Heart,
  Filter,
  Clock,
  Disc3,
  Drum,
  Piano,
  Mic,
  Waves,
  Folder,
  Star,
  TrendingUp,
  Sparkles,
  Volume2
} from 'lucide-react';
import { toast } from 'sonner';

interface Sample {
  id: string;
  name: string;
  pack: string;
  category: string;
  type: 'loop' | 'oneshot' | 'midi';
  bpm?: number;
  key?: string;
  duration: number; // seconds
  isFavorite: boolean;
  isNew: boolean;
  downloadCount: number;
  tags: string[];
}

interface SamplePack {
  id: string;
  name: string;
  artist: string;
  sampleCount: number;
  imageUrl?: string;
  isTrending: boolean;
  isNew: boolean;
}

const MOCK_SAMPLES: Sample[] = [
  { id: '1', name: 'Pretoria Log Drum 01', pack: 'Log Drum Essentials', category: 'Log Drums', type: 'oneshot', bpm: 115, key: 'A', duration: 1.2, isFavorite: false, isNew: true, downloadCount: 12500, tags: ['log drum', 'pretoria', 'classic'] },
  { id: '2', name: 'Private School Piano Loop', pack: 'Private School Vol.1', category: 'Keys', type: 'loop', bpm: 112, key: 'C minor', duration: 8.0, isFavorite: true, isNew: false, downloadCount: 8900, tags: ['piano', 'private school', 'melodic'] },
  { id: '3', name: 'Bacardi Bass Hit', pack: 'Bacardi Toolkit', category: 'Bass', type: 'oneshot', bpm: 118, key: 'E', duration: 0.8, isFavorite: false, isNew: true, downloadCount: 6700, tags: ['bass', 'bacardi', 'punchy'] },
  { id: '4', name: 'Shaker Loop 115 BPM', pack: 'Percussion Paradise', category: 'Percussion', type: 'loop', bpm: 115, duration: 4.0, isFavorite: false, isNew: false, downloadCount: 15200, tags: ['shaker', 'percussion', 'groove'] },
  { id: '5', name: 'Amapiano Vocal Chop', pack: 'Vocal Shots', category: 'Vocals', type: 'oneshot', key: 'F', duration: 1.5, isFavorite: true, isNew: false, downloadCount: 9800, tags: ['vocal', 'chop', 'zulu'] },
  { id: '6', name: 'Deep House Pad Cm', pack: 'Atmospheric Pads', category: 'Synths', type: 'loop', bpm: 115, key: 'C minor', duration: 16.0, isFavorite: false, isNew: true, downloadCount: 4500, tags: ['pad', 'atmospheric', 'deep'] },
  { id: '7', name: 'Kick Drum Yanos', pack: 'Drum One-Shots', category: 'Drums', type: 'oneshot', duration: 0.4, isFavorite: false, isNew: false, downloadCount: 23400, tags: ['kick', 'drums', 'punchy'] },
  { id: '8', name: 'Log Drum Melody MIDI', pack: 'MIDI Collection', category: 'MIDI', type: 'midi', bpm: 115, key: 'A minor', duration: 8.0, isFavorite: true, isNew: true, downloadCount: 7800, tags: ['midi', 'log drum', 'melody'] },
  { id: '9', name: 'Sgubhu Clap Pattern', pack: 'Sgubhu Essentials', category: 'Percussion', type: 'loop', bpm: 120, duration: 4.0, isFavorite: false, isNew: false, downloadCount: 5600, tags: ['clap', 'sgubhu', 'pattern'] },
  { id: '10', name: 'Synth Stab Groove', pack: 'Synth Collection', category: 'Synths', type: 'oneshot', key: 'G', duration: 0.6, isFavorite: false, isNew: true, downloadCount: 3400, tags: ['synth', 'stab', 'groove'] },
];

const TRENDING_PACKS: SamplePack[] = [
  { id: '1', name: 'Log Drum Essentials', artist: 'Aura Sounds', sampleCount: 150, isTrending: true, isNew: false },
  { id: '2', name: 'Private School Vol.1', artist: 'SA Producers', sampleCount: 200, isTrending: true, isNew: true },
  { id: '3', name: 'Bacardi Toolkit', artist: 'Urban Beats', sampleCount: 120, isTrending: false, isNew: true },
  { id: '4', name: 'Amapiano Paradise', artist: 'Groove Masters', sampleCount: 180, isTrending: true, isNew: false },
];

const CATEGORIES = [
  { name: 'All', icon: Music },
  { name: 'Log Drums', icon: Disc3 },
  { name: 'Drums', icon: Drum },
  { name: 'Percussion', icon: Waves },
  { name: 'Bass', icon: Volume2 },
  { name: 'Keys', icon: Piano },
  { name: 'Synths', icon: Sparkles },
  { name: 'Vocals', icon: Mic },
  { name: 'MIDI', icon: Music },
];

const BPM_RANGES = ['All', '100-110', '110-115', '115-120', '120-130'];
const KEY_FILTERS = ['All', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];

export function SampleBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bpmRange, setBpmRange] = useState('All');
  const [keyFilter, setKeyFilter] = useState('All');
  const [samples, setSamples] = useState<Sample[]>(MOCK_SAMPLES);
  const [playingSample, setPlayingSample] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.pack.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || sample.category === selectedCategory;
    
    let matchesBpm = true;
    if (bpmRange !== 'All' && sample.bpm) {
      const [min, max] = bpmRange.split('-').map(Number);
      matchesBpm = sample.bpm >= min && sample.bpm <= max;
    }
    
    const matchesKey = keyFilter === 'All' || (sample.key && sample.key.startsWith(keyFilter));
    
    return matchesSearch && matchesCategory && matchesBpm && matchesKey;
  });

  const toggleFavorite = (id: string) => {
    setSamples(prev => prev.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
    toast.success('Updated favorites');
  };

  const handlePlay = (sample: Sample) => {
    if (playingSample === sample.id) {
      setPlayingSample(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setPlayingSample(sample.id);
      // In production, would play actual audio
      setTimeout(() => setPlayingSample(null), sample.duration * 1000);
    }
  };

  const handleDownload = (sample: Sample) => {
    toast.success(`Downloading ${sample.name}...`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}:${secs.toString().padStart(2, '0')}`;
    return `${secs.toFixed(1)}s`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = CATEGORIES.find(c => c.name === categoryName);
    return category ? category.icon : Music;
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Sample Browser</CardTitle>
              <CardDescription>
                Discover Amapiano samples, loops & one-shots
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Folder className="w-3 h-3" />
            {samples.length} Samples
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trending Packs */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            Trending Packs
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TRENDING_PACKS.map(pack => (
              <Card 
                key={pack.id} 
                className="min-w-[150px] bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{pack.name}</span>
                    {pack.isNew && (
                      <Badge className="text-xs bg-green-500/20 text-green-600 h-4">NEW</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{pack.artist}</p>
                  <p className="text-xs text-muted-foreground">{pack.sampleCount} samples</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className="gap-1 whitespace-nowrap"
              >
                <Icon className="w-3 h-3" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search samples..."
              className="pl-10"
            />
          </div>
          <Select value={bpmRange} onValueChange={setBpmRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="BPM" />
            </SelectTrigger>
            <SelectContent>
              {BPM_RANGES.map(range => (
                <SelectItem key={range} value={range}>{range === 'All' ? 'All BPM' : `${range} BPM`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={keyFilter} onValueChange={setKeyFilter}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              {KEY_FILTERS.map(key => (
                <SelectItem key={key} value={key}>{key === 'All' ? 'All Keys' : key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sample List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredSamples.map(sample => {
              const CategoryIcon = getCategoryIcon(sample.category);
              const isPlaying = playingSample === sample.id;
              
              return (
                <div 
                  key={sample.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isPlaying ? 'bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  {/* Play Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full"
                    onClick={() => handlePlay(sample)}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Waveform Placeholder */}
                  <div className="w-20 h-8 bg-muted rounded overflow-hidden flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-full py-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            isPlaying ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'
                          }`}
                          style={{ height: `${20 + Math.random() * 60}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{sample.name}</span>
                      {sample.isNew && (
                        <Badge className="text-xs bg-green-500/20 text-green-600 h-4">NEW</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{sample.pack}</span>
                      <span>•</span>
                      <Badge variant="outline" className="h-4 text-xs gap-1">
                        <CategoryIcon className="w-2 h-2" />
                        {sample.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    {sample.bpm && (
                      <span className="w-12 text-center">{sample.bpm} BPM</span>
                    )}
                    {sample.key && (
                      <span className="w-12 text-center">{sample.key}</span>
                    )}
                    <span className="w-10 text-center flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(sample.duration)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(sample.id)}
                    >
                      <Heart 
                        className={`w-4 h-4 ${sample.isFavorite ? 'text-red-500 fill-red-500' : ''}`} 
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(sample)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSamples.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No samples found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
