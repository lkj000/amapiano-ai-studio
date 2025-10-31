import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Download, BookOpen, Music, TrendingUp, Heart, Brain } from "lucide-react";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js';
import { UnifiedAnalysisPanel } from '@/components/UnifiedAnalysisPanel';

interface PatternsProps {
  user: User | null;
}

const Patterns: React.FC<PatternsProps> = ({ user }) => {
  const [selectedComplexity, setSelectedComplexity] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [playingPattern, setPlayingPattern] = useState<number | null>(null);
  const [likedPatterns, setLikedPatterns] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chordProgressions = [
    {
      id: 1,
      name: "Amukelani Progression",
      artist: "Kelvin Momo",
      roman: "i - bIII - bVII - IV",
      chords: "Fm - Ab - Eb - Bb",
      key: "F minor",
      complexity: "Intermediate",
      genre: "Private School",
      description: "The signature chord progression from Kelvin Momo's masterpiece. Features sophisticated jazz harmony with smooth voice leading.",
      culturalContext: "This progression represents the evolution of amapiano into more jazz-influenced territory, showcasing the 'Private School' aesthetic.",
      isLiked: true,
      usage: "Used in over 200 tracks by various artists"
    },
    {
      id: 2,
      name: "Kabza's Classic Vamp",
      artist: "Kabza De Small",
      roman: "i - bVI - bVII - i",
      chords: "Cm - Ab - Bb - Cm",
      key: "C minor",
      complexity: "Simple",
      genre: "Classic",
      description: "The foundational chord progression that defined early amapiano. Simple yet incredibly effective for building groove.",
      culturalContext: "This progression is rooted in traditional South African house music and helped establish amapiano's distinctive sound.",
      isLiked: false,
      usage: "The most sampled progression in amapiano history"
    },
    {
      id: 3,
      name: "Soulful Sunday Chords",
      artist: "Various Artists",
      roman: "i - iv - bVII - bIII",
      chords: "Am - Dm - G - C",
      key: "A minor",
      complexity: "Intermediate",
      genre: "Private School",
      description: "A beautiful progression perfect for Sunday afternoon vibes. Creates a sense of longing and resolution.",
      culturalContext: "Popular in gospel-influenced amapiano tracks, reflecting the spiritual side of South African culture.",
      isLiked: false,
      usage: "Featured in many weekend relaxation playlists"
    }
  ];

  const drumPatterns = [
    {
      id: 1,
      name: "Classic Log Drum Pattern",
      artist: "Traditional",
      complexity: "Simple",
      genre: "Classic",
      timeSignature: "4/4",
      description: "The foundational log drum pattern that defines amapiano. Features the characteristic deep, woody tone.",
      technique: "Emphasizes beats 1 and 3 with syncopated ghost notes",
      culturalContext: "The log drum sound originated from traditional African percussion instruments.",
      isLiked: true,
      bpm: "118-125"
    },
    {
      id: 2,  
      name: "Private School Hi-Hat Shuffle",
      artist: "Modern Evolution",
      complexity: "Advanced",
      genre: "Private School",
      timeSignature: "4/4",
      description: "Sophisticated hi-hat pattern with jazz-influenced swing and complex subdivision.",
      technique: "Uses triplet feel over straight time with dynamic accents",
      culturalContext: "Represents the genre's evolution toward more complex rhythmic structures.",
      isLiked: false,
      bpm: "115-120"
    },
    {
      id: 3,
      name: "Afro Percussion Layer",
      artist: "Cultural Heritage",
      complexity: "Intermediate", 
      genre: "Classic",
      timeSignature: "4/4",
      description: "Traditional African percussion elements adapted for modern amapiano production.",
      technique: "Layered polyrhythms creating rich textural foundation",
      culturalContext: "Preserves connection to traditional African drumming patterns.",
      isLiked: true,
      bpm: "120-128"
    }
  ];

  const complexityLevels = ["All", "Simple", "Intermediate", "Advanced"];
  const genres = ["All", "Classic", "Private School", "Vocal", "Deep"];

  const filteredChords = chordProgressions.filter(pattern => {
    const matchesComplexity = selectedComplexity === "all" || pattern.complexity.toLowerCase() === selectedComplexity.toLowerCase();
    const matchesGenre = selectedGenre === "all" || pattern.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesComplexity && matchesGenre;
  });

  const filteredDrums = drumPatterns.filter(pattern => {
    const matchesComplexity = selectedComplexity === "all" || pattern.complexity.toLowerCase() === selectedComplexity.toLowerCase();
    const matchesGenre = selectedGenre === "all" || pattern.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesComplexity && matchesGenre;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case "simple": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handlePlayPattern = async (patternId: number, patternName: string) => {
    if (playingPattern === patternId) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingPattern(null);
      return;
    }

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new audio element for this pattern
      const audio = new Audio(`https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/pattern-${patternId}`);
      audioRef.current = audio;
      
      setPlayingPattern(patternId);
      toast.info(`🎵 Playing "${patternName}"`);

      audio.addEventListener('ended', () => {
        setPlayingPattern(null);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        toast.error("🔊 Demo audio unavailable. Pattern preview coming soon!");
        setPlayingPattern(null);
      });

      await audio.play();
    } catch (error) {
      console.error('Pattern playback error:', error);
      toast.error("🔊 Demo audio unavailable. Pattern preview coming soon!");
      setPlayingPattern(null);
    }
  };

  const handleLikePattern = (patternId: number) => {
    const newLikedPatterns = new Set(likedPatterns);
    if (likedPatterns.has(patternId)) {
      newLikedPatterns.delete(patternId);
      toast.success("Removed from favorites");
    } else {
      newLikedPatterns.add(patternId);
      toast.success("Added to favorites");
    }
    setLikedPatterns(newLikedPatterns);
  };

  const handleDownloadMIDI = (patternId: number, patternName: string) => {
    toast.success(`📁 MIDI file for "${patternName}" downloaded!`);
    // Simulate MIDI download
    const element = document.createElement('a');
    element.href = `https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/pattern-${patternId}.mid`;
    element.download = `${patternName.replace(/\s+/g, '_')}.mid`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">
              Pattern Library
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn from 1,000+ chord progressions and drum patterns with cultural context and complexity ratings.
            </p>
          </div>

          {/* Filters */}
          <Card className="card-glow mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Complexity Level</label>
                  <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      {complexityLevels.map((level) => (
                        <SelectItem key={level} value={level.toLowerCase() === "all" ? "all" : level.toLowerCase()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Genre Style</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre.toLowerCase() === "all" ? "all" : genre.toLowerCase()}>
                          {genre} {genre !== "All" && "Amapiano"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Most Popular
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="chords" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="chords">Chord Progressions</TabsTrigger>
              <TabsTrigger value="drums">Drum Patterns</TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chords">
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredChords.map((pattern) => (
                  <Card key={pattern.id} className="card-glow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">{pattern.name}</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            Featured in tracks by {pattern.artist}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={likedPatterns.has(pattern.id) ? "text-red-500" : "text-muted-foreground"}
                          onClick={() => handleLikePattern(pattern.id)}
                        >
                          <Heart className="w-4 h-4" fill={likedPatterns.has(pattern.id) ? "currentColor" : "none"} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Pattern Info */}
                      <div className="bg-muted p-4 rounded-lg space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {pattern.chords}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Roman Numerals: {pattern.roman}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Key: {pattern.key}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getComplexityColor(pattern.complexity)}>
                          {pattern.complexity}
                        </Badge>
                        <Badge variant="outline">
                          {pattern.genre} Amapiano
                        </Badge>
                      </div>

                      {/* Description */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-1 flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Musical Description
                          </h4>
                          <p className="text-sm text-muted-foreground">{pattern.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Cultural Context
                          </h4>
                          <p className="text-sm text-muted-foreground">{pattern.culturalContext}</p>
                        </div>
                      </div>

                      {/* Usage Info */}
                      <div className="text-xs text-muted-foreground border-t pt-3">
                        {pattern.usage}
                      </div>

                      {/* Interactive Controls */}
                      <div className="bg-gradient-primary p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-primary-foreground font-medium">Listen & Learn</span>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handlePlayPattern(pattern.id, pattern.name)}
                              disabled={playingPattern === pattern.id}
                            >
                              {playingPattern === pattern.id ? (
                                <Pause className="w-3 h-3 mr-1" />
                              ) : (
                                <Play className="w-3 h-3 mr-1" />
                              )}
                              {playingPattern === pattern.id ? "Playing..." : "Play"}
                            </Button>
                          </div>
                        </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="flex-1"
                              onClick={() => handleDownloadMIDI(pattern.id, pattern.name)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              MIDI
                            </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="flex-1" 
                            onClick={() => {
                              const trackData = {
                                name: `Pattern: ${pattern.name}`,
                                audioUrl: `https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/pattern-${pattern.id}`,
                                type: 'audio',
                                metadata: {
                                  bpm: 118, // Default BPM for patterns
                                  genre: 'Amapiano Pattern',
                                  duration: 30
                                }
                              };
                              localStorage.setItem('pendingGeneratedTrack', JSON.stringify(trackData));
                              window.open('/daw', '_blank');
                              toast.success(`🎵 "${pattern.name}" sent to DAW!`);
                            }}
                          >
                            <Music className="w-3 h-3 mr-1" />
                            Add to DAW
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="drums">
              <div className="grid lg:grid-cols-2 gap-6">
                {filteredDrums.map((pattern) => (
                  <Card key={pattern.id} className="card-glow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">{pattern.name}</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {pattern.artist} • {pattern.timeSignature} • {pattern.bpm} BPM
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={likedPatterns.has(pattern.id) ? "text-red-500" : "text-muted-foreground"}
                          onClick={() => handleLikePattern(pattern.id)}
                        >
                          <Heart className="w-4 h-4" fill={likedPatterns.has(pattern.id) ? "currentColor" : "none"} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Pattern Visualization */}
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-center mb-3">
                          <div className="text-lg font-bold text-primary">
                            Drum Pattern Visualization
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {pattern.timeSignature} • {pattern.bpm} BPM
                          </div>
                        </div>
                        <div className="grid grid-cols-16 gap-1 h-16 items-center">
                          {Array.from({ length: 16 }, (_, i) => (
                            <div
                              key={i}
                              className={`h-8 rounded-sm ${
                                [0, 4, 8, 12].includes(i) 
                                  ? "bg-primary" 
                                  : [2, 6, 10, 14].includes(i)
                                  ? "bg-secondary"
                                  : "bg-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getComplexityColor(pattern.complexity)}>
                          {pattern.complexity}
                        </Badge>
                        <Badge variant="outline">
                          {pattern.genre} Amapiano
                        </Badge>
                      </div>

                      {/* Description */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-1 flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Pattern Description
                          </h4>
                          <p className="text-sm text-muted-foreground">{pattern.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1">Technique</h4>
                          <p className="text-sm text-muted-foreground">{pattern.technique}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-1 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Cultural Context
                          </h4>
                          <p className="text-sm text-muted-foreground">{pattern.culturalContext}</p>
                        </div>
                      </div>

                      {/* Interactive Controls */}
                      <div className="bg-gradient-accent p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-accent-foreground font-medium">Practice & Export</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary">
                              <Play className="w-3 h-3 mr-1" />
                              Play Loop
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="flex-1" 
                            onClick={() => {
                              const trackData = {
                                name: `Advanced Pattern: ${pattern.name}`,
                                audioUrl: `https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/advanced-${pattern.id}`,
                                type: 'audio',
                                metadata: {
                                  bpm: 118, // Default BPM for advanced patterns
                                  genre: 'Advanced Amapiano',
                                  duration: 45
                                }
                              };
                              localStorage.setItem('pendingGeneratedTrack', JSON.stringify(trackData));
                              window.open('/daw', '_blank');
                              toast.success(`🎵 "${pattern.name}" sent to DAW!`);
                            }}
                          >
                            <Music className="w-3 h-3 mr-1" />
                            Add to DAW
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Pattern Analysis with AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UnifiedAnalysisPanel 
                    showOptions={true}
                    onAnalysisComplete={(result) => {
                      console.log('Pattern analysis complete:', result);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Patterns;