import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Play, Square, Download, Upload, Music, BookOpen, 
  Piano, Drum, Heart, Share2, Filter, Star, Award, Clock,
  Volume2, Eye, ChevronRight, X, Lightbulb, GraduationCap,
  Users, MapPin, Calendar, TrendingUp, Zap, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Pattern {
  id: string;
  name: string;
  type: 'chord_progression' | 'drum_pattern' | 'bass_line' | 'melody' | 'rhythm';
  category: 'classic' | 'private_school' | 'vocal' | 'deep' | 'fusion';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  bpm: number;
  keySignature: string;
  timeSignature: string;
  
  // Musical Data
  midiData: any;
  chordSymbols?: string[];
  romanNumerals?: string[];
  scaleInfo?: {
    scale: string;
    modes: string[];
    intervals: string[];
  };
  
  // Educational Content
  culturalContext: {
    origin: string;
    artists: string[];
    era: string;
    significance: string;
  };
  
  theory: {
    analysis: string;
    techniques: string[];
    learningPoints: string[];
  };
  
  // Metadata
  downloads: number;
  rating: number;
  tags: string[];
  creator: string;
  isOfficial: boolean;
  featured: boolean;
  dateAdded: string;
}

interface AdvancedPatternLibraryProps {
  onAddPatternToProject: (pattern: Pattern) => void;
  onClose: () => void;
  className?: string;
}

// Comprehensive Amapiano Pattern Database
const SAMPLE_PATTERNS: Pattern[] = [
  {
    id: 'classic_fm7_progression',
    name: 'Classic F#m Progression (Kabza Style)',
    type: 'chord_progression',
    category: 'classic',
    difficulty: 'intermediate',
    bpm: 118,
    keySignature: 'F#m',
    timeSignature: '4/4',
    midiData: null,
    chordSymbols: ['F#m', 'C#m', 'D', 'A', 'Bm', 'F#m', 'C#', 'F#m'],
    romanNumerals: ['i', 'v', 'bVI', 'bIII', 'iv', 'i', 'V', 'i'],
    scaleInfo: {
      scale: 'F# Natural Minor',
      modes: ['Dorian', 'Aeolian'],
      intervals: ['R', 'm2', 'M3', 'P4', 'P5', 'm6', 'm7']
    },
    culturalContext: {
      origin: 'Johannesburg Townships',
      artists: ['Kabza De Small', 'DJ Maphorisa'],
      era: '2018-2020 Golden Era',
      significance: 'Foundational progression that defined the classic amapiano sound'
    },
    theory: {
      analysis: 'Uses the natural minor scale with gospel-influenced voice leading. The bVI-bIII movement creates the signature emotional lift.',
      techniques: ['Voice Leading', 'Gospel Harmony', 'Modal Interchange'],
      learningPoints: ['Circle of fifths movement', 'Minor key harmonic rhythm', 'African harmonic concepts']
    },
    downloads: 15420,
    rating: 4.8,
    tags: ['classic', 'kabza', 'emotional', 'gospel', 'foundational'],
    creator: 'Amapiano Masters',
    isOfficial: true,
    featured: true,
    dateAdded: '2023-01-15'
  },
  {
    id: 'kelvin_momo_jazz_progression',
    name: 'Kelvin Momo Jazz Progression',
    type: 'chord_progression',
    category: 'private_school',
    difficulty: 'advanced',
    bpm: 108,
    keySignature: 'Cm',
    timeSignature: '4/4',
    midiData: null,
    chordSymbols: ['Cm9', 'Fm9', 'G7sus4', 'G7', 'Ab maj7', 'Dm7b5', 'G7alt', 'Cm6/9'],
    romanNumerals: ['i9', 'iv9', 'V7sus4', 'V7', 'bVImaj7', 'ii7b5', 'V7alt', 'i6/9'],
    scaleInfo: {
      scale: 'C Harmonic Minor',
      modes: ['Harmonic Minor', 'Dorian b2'],
      intervals: ['R', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7']
    },
    culturalContext: {
      origin: 'Pretoria Jazz Scene',
      artists: ['Kelvin Momo', 'Babalwa M'],
      era: '2020-Present Sophisticated Era',
      significance: 'Represents the evolution of amapiano into sophisticated jazz harmony'
    },
    theory: {
      analysis: 'Advanced jazz harmony with extended chords and altered dominants. Uses harmonic minor for sophisticated color.',
      techniques: ['Extended Harmony', 'Altered Dominants', 'Jazz Voice Leading'],
      learningPoints: ['9th and 11th chords', 'Harmonic minor applications', 'Jazz-fusion concepts']
    },
    downloads: 8760,
    rating: 4.9,
    tags: ['private_school', 'kelvin_momo', 'jazz', 'sophisticated', 'harmonic_minor'],
    creator: 'Private School Collective',
    isOfficial: true,
    featured: true,
    dateAdded: '2023-03-22'
  },
  {
    id: 'log_drum_classic_pattern',
    name: 'Classic Log Drum Pattern',
    type: 'drum_pattern',
    category: 'classic',
    difficulty: 'beginner',
    bpm: 118,
    keySignature: 'C',
    timeSignature: '4/4',
    midiData: null,
    culturalContext: {
      origin: 'Kwaito Evolution',
      artists: ['Kabza De Small', 'MFR Souls'],
      era: '2016-2018 Foundation Era',
      significance: 'The percussive bassline that defines amapiano rhythm'
    },
    theory: {
      analysis: 'Syncopated percussion-bass hybrid using 808 drums tuned to musical pitches. Creates both rhythm and harmonic foundation.',
      techniques: ['Polyrhythm', 'Percussive Bass', 'African Rhythmic Concepts'],
      learningPoints: ['Kick-bass relationship', 'Syncopation patterns', 'Groove fundamentals']
    },
    downloads: 22340,
    rating: 4.7,
    tags: ['log_drums', 'foundation', 'classic', 'beginner', 'essential'],
    creator: 'Amapiano Academy',
    isOfficial: true,
    featured: true,
    dateAdded: '2022-11-08'
  }
];

const COMPLEXITY_COLORS = {
  beginner: 'text-green-600 bg-green-50',
  intermediate: 'text-yellow-600 bg-yellow-50',
  advanced: 'text-orange-600 bg-orange-50',
  expert: 'text-red-600 bg-red-50'
};

const CATEGORY_COLORS = {
  classic: 'text-blue-600 bg-blue-50',
  private_school: 'text-purple-600 bg-purple-50',
  vocal: 'text-pink-600 bg-pink-50',
  deep: 'text-gray-600 bg-gray-50',
  fusion: 'text-indigo-600 bg-indigo-50'
};

export const AdvancedPatternLibrary: React.FC<AdvancedPatternLibraryProps> = ({
  onAddPatternToProject,
  onClose,
  className
}) => {
  const [patterns, setPatterns] = useState<Pattern[]>(SAMPLE_PATTERNS);
  const [filteredPatterns, setFilteredPatterns] = useState<Pattern[]>(SAMPLE_PATTERNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [playingPattern, setPlayingPattern] = useState<string | null>(null);
  const [showEducational, setShowEducational] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter and search patterns
  useEffect(() => {
    let filtered = patterns;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(pattern =>
        pattern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pattern.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        pattern.culturalContext.artists.some(artist => 
          artist.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(pattern => pattern.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(pattern => pattern.difficulty === selectedDifficulty);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(pattern => pattern.type === selectedType);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'difficulty':
          const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
          return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredPatterns(filtered);
  }, [patterns, searchQuery, selectedCategory, selectedDifficulty, selectedType, sortBy]);

  const playPattern = (pattern: Pattern) => {
    setPlayingPattern(pattern.id);
    toast.info(`🎵 Playing: ${pattern.name}`);

    // Use Tone.js to play the pattern's MIDI data
    if (pattern.midiData && Array.isArray(pattern.midiData)) {
      import('tone').then((Tone) => {
        const now = Tone.now();
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();
        pattern.midiData.forEach((note: any, i: number) => {
          synth.triggerAttackRelease(
            note.pitch || 'C4',
            note.duration || '8n',
            now + (note.time || i * 0.25)
          );
        });
        const totalDuration = pattern.midiData.reduce((acc: number, n: any) => Math.max(acc, (n.time || 0) + 0.5), 2);
        setTimeout(() => {
          setPlayingPattern(null);
          synth.dispose();
        }, totalDuration * 1000);
      });
    } else {
      setTimeout(() => setPlayingPattern(null), 2000);
    }
  };

  const stopPattern = () => {
    setPlayingPattern(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const addToProject = (pattern: Pattern) => {
    onAddPatternToProject(pattern);
    toast.success(`Added "${pattern.name}" to your project!`);
  };

  const downloadMIDI = (pattern: Pattern) => {
    const midiData = JSON.stringify(pattern.midiData || { name: pattern.name });
    const blob = new Blob([midiData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pattern.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded data for "${pattern.name}"`);
  };

  const PatternCard: React.FC<{ pattern: Pattern; isSelected: boolean }> = ({ pattern, isSelected }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => setSelectedPattern(pattern)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate mb-1">{pattern.name}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge className={`text-xs ${CATEGORY_COLORS[pattern.category]}`}>
                {pattern.category.replace('_', ' ')}
              </Badge>
              <Badge className={`text-xs ${COMPLEXITY_COLORS[pattern.difficulty]}`}>
                {pattern.difficulty}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                if (playingPattern === pattern.id) {
                  stopPattern();
                } else {
                  playPattern(pattern);
                }
              }}
              className="h-8 w-8 p-0"
            >
              {playingPattern === pattern.id ? 
                <Square className="w-4 h-4" /> : 
                <Play className="w-4 h-4" />
              }
            </Button>
          </div>
        </div>

        {/* Pattern Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{pattern.bpm} BPM</span>
            <span>{pattern.keySignature}</span>
            <span>{pattern.timeSignature}</span>
          </div>

          {/* Chord Symbols Preview */}
          {pattern.chordSymbols && (
            <div className="flex flex-wrap gap-1">
              {pattern.chordSymbols.slice(0, 4).map((chord, index) => (
                <Badge key={index} variant="outline" className="text-xs font-mono">
                  {chord}
                </Badge>
              ))}
              {pattern.chordSymbols.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{pattern.chordSymbols.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {pattern.rating}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {pattern.downloads.toLocaleString()}
              </span>
            </div>
            {pattern.featured && (
              <Badge variant="outline" className="text-xs">
                <Award className="w-2 h-2 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Advanced Pattern Library</h2>
                <p className="text-sm text-muted-foreground">
                  1000+ authentic amapiano patterns with educational context
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEducational(!showEducational)}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Educational Mode
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search patterns, artists, techniques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="private_school">Private School</SelectItem>
                <SelectItem value="vocal">Vocal</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
                <SelectItem value="fusion">Fusion</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="downloads">Downloads</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Patterns Grid */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  isSelected={selectedPattern?.id === pattern.id}
                />
              ))}
            </div>

            {filteredPatterns.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No patterns found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Pattern Details Sidebar */}
          {selectedPattern && (
            <div className="w-96 border-l bg-muted/20 overflow-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{selectedPattern.name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPattern(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                    <TabsTrigger value="theory" className="text-xs">Theory</TabsTrigger>
                    <TabsTrigger value="cultural" className="text-xs">Cultural</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Basic Info */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">BPM:</span>
                            <span className="font-medium">{selectedPattern.bpm}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Key:</span>
                            <span className="font-medium">{selectedPattern.keySignature}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">{selectedPattern.timeSignature}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Rating:</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{selectedPattern.rating}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chord Progression */}
                    {selectedPattern.chordSymbols && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Chord Progression</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {selectedPattern.chordSymbols.map((chord, index) => (
                              <div key={index} className="text-center p-2 bg-background rounded border">
                                <div className="font-mono text-sm">{chord}</div>
                                {selectedPattern.romanNumerals && (
                                  <div className="text-xs text-muted-foreground">
                                    {selectedPattern.romanNumerals[index]}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button onClick={() => addToProject(selectedPattern)} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Project
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadMIDI(selectedPattern)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          MIDI
                        </Button>
                        <Button variant="outline" size="sm">
                          <Heart className="w-4 h-4 mr-2" />
                          Like
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="theory" className="space-y-4 mt-4">
                    {showEducational && (
                      <>
                        {/* Scale Information */}
                        {selectedPattern.scaleInfo && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Music className="w-4 h-4" />
                                Scale Analysis
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Scale:</div>
                                <div className="text-sm font-medium">{selectedPattern.scaleInfo.scale}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-2">Intervals:</div>
                                <div className="flex gap-1">
                                  {selectedPattern.scaleInfo.intervals.map((interval, index) => (
                                    <Badge key={index} variant="outline" className="text-xs font-mono">
                                      {interval}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Theory Analysis */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              Music Theory
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-3">
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">Analysis:</div>
                              <p className="text-sm">{selectedPattern.theory.analysis}</p>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">Techniques:</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedPattern.theory.techniques.map((technique, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {technique}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-2">Learning Points:</div>
                              <ul className="text-sm space-y-1">
                                {selectedPattern.theory.learningPoints.map((point, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Lightbulb className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="cultural" className="space-y-4 mt-4">
                    {showEducational && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Cultural Context
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Origin:</div>
                            <div className="text-sm font-medium">{selectedPattern.culturalContext.origin}</div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Key Artists:</div>
                            <div className="flex flex-wrap gap-1">
                              {selectedPattern.culturalContext.artists.map((artist, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Users className="w-2 h-2 mr-1" />
                                  {artist}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Era:</div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {selectedPattern.culturalContext.era}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Cultural Significance:</div>
                            <p className="text-sm">{selectedPattern.culturalContext.significance}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};