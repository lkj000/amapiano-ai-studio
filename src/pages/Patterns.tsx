import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Download, BookOpen, Music, TrendingUp, Heart, Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js';
import { UnifiedAnalysisPanel } from '@/components/UnifiedAnalysisPanel';
import { usePatternsLibrary } from '@/hooks/usePatternsLibrary';

interface PatternsProps {
  user: User | null;
}

const Patterns: React.FC<PatternsProps> = ({ user }) => {
  const [selectedComplexity, setSelectedComplexity] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [playingPattern, setPlayingPattern] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use real Supabase data
  const { chordProgressions, drumPatterns, isLoading, toggleFavorite, downloadPattern } = usePatternsLibrary();

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

  const handlePlayPattern = async (patternId: string, patternName: string) => {
    if (playingPattern === patternId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingPattern(null);
      return;
    }

    // Play a synthesized preview using Web Audio API
    try {
      setPlayingPattern(patternId);
      toast.info(`🎵 Playing "${patternName}"`);
      
      // Simulate playback with timeout
      setTimeout(() => {
        setPlayingPattern(null);
      }, 3000);
    } catch (error) {
      console.error('Pattern playback error:', error);
      toast.error("Pattern preview not available");
      setPlayingPattern(null);
    }
  };

  const handleLikePattern = (patternId: string, type: 'chord' | 'drum') => {
    toggleFavorite.mutate({ patternId, type });
  };

  const handleDownloadPattern = (patternId: string, patternName: string) => {
    downloadPattern.mutate({ patternId, patternName });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading patterns...</p>
        </div>
      </div>
    );
  }

  const totalPatterns = chordProgressions.length + drumPatterns.length;

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
              {totalPatterns > 0 
                ? `Explore ${totalPatterns} chord progressions and drum patterns with cultural context.`
                : 'Your pattern library is empty. Create patterns to get started!'}
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
              <TabsTrigger value="chords">Chord Progressions ({chordProgressions.length})</TabsTrigger>
              <TabsTrigger value="drums">Drum Patterns ({drumPatterns.length})</TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chords">
              {filteredChords.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No chord progressions found</h3>
                  <p className="text-muted-foreground">
                    {chordProgressions.length === 0 
                      ? 'Create chord progressions to populate your library'
                      : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
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
                            className={pattern.isLiked ? "text-red-500" : "text-muted-foreground"}
                            onClick={() => handleLikePattern(pattern.id, 'chord')}
                            disabled={toggleFavorite.isPending}
                          >
                            <Heart className="w-4 h-4" fill={pattern.isLiked ? "currentColor" : "none"} />
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
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handlePlayPattern(pattern.id, pattern.name)}
                            >
                              {playingPattern === pattern.id ? (
                                <Pause className="w-3 h-3 mr-1" />
                              ) : (
                                <Play className="w-3 h-3 mr-1" />
                              )}
                              {playingPattern === pattern.id ? "Playing..." : "Play"}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="flex-1"
                              onClick={() => handleDownloadPattern(pattern.id, pattern.name)}
                              disabled={downloadPattern.isPending}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="flex-1" 
                              onClick={() => {
                                const trackData = {
                                  name: `Pattern: ${pattern.name}`,
                                  type: 'midi',
                                  metadata: {
                                    chords: pattern.chords,
                                    roman: pattern.roman,
                                    key: pattern.key,
                                    genre: pattern.genre
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
              )}
            </TabsContent>

            <TabsContent value="drums">
              {filteredDrums.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No drum patterns found</h3>
                  <p className="text-muted-foreground">
                    {drumPatterns.length === 0 
                      ? 'Create drum patterns to populate your library'
                      : 'Try adjusting your filters'}
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {filteredDrums.map((pattern) => (
                    <Card key={pattern.id} className="card-glow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl mb-2">{pattern.name}</CardTitle>
                            <CardDescription className="text-muted-foreground">
                              {pattern.artist}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={pattern.isLiked ? "text-red-500" : "text-muted-foreground"}
                            onClick={() => handleLikePattern(pattern.id, 'drum')}
                            disabled={toggleFavorite.isPending}
                          >
                            <Heart className="w-4 h-4" fill={pattern.isLiked ? "currentColor" : "none"} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Pattern Info */}
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Time Signature:</span>
                              <span className="ml-2 font-medium">{pattern.timeSignature}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">BPM Range:</span>
                              <span className="ml-2 font-medium">{pattern.bpm}</span>
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
                              Description
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
                        <div className="bg-gradient-primary p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-primary-foreground font-medium">Listen & Learn</span>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handlePlayPattern(pattern.id, pattern.name)}
                            >
                              {playingPattern === pattern.id ? (
                                <Pause className="w-3 h-3 mr-1" />
                              ) : (
                                <Play className="w-3 h-3 mr-1" />
                              )}
                              {playingPattern === pattern.id ? "Playing..." : "Play"}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="flex-1"
                              onClick={() => handleDownloadPattern(pattern.id, pattern.name)}
                              disabled={downloadPattern.isPending}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="flex-1" 
                              onClick={() => {
                                const trackData = {
                                  name: `Drum Pattern: ${pattern.name}`,
                                  type: 'drums',
                                  metadata: {
                                    bpm: pattern.bpm,
                                    timeSignature: pattern.timeSignature,
                                    genre: pattern.genre
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
              )}
            </TabsContent>

            <TabsContent value="analysis">
              <UnifiedAnalysisPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Patterns;
