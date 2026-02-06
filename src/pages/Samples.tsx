import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Download, Heart, Search, Music, Star, Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js';
import { UnifiedAnalysisPanel } from '@/components/UnifiedAnalysisPanel';
import { useSampleLibrary, type Sample } from '@/hooks/useSampleLibrary';
import { SamplePackUploader } from '@/components/samples/SamplePackUploader';

interface SamplesProps {
  user: User | null;
}

const Samples: React.FC<SamplesProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [playingSample, setPlayingSample] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { samples, isLoading, toggleFavorite, downloadSample, refetch } = useSampleLibrary();

  const categories = [
    "All", "Log Drums", "Piano", "Percussion", "Bass", "Vocals", "Saxophone", "Guitar", "Synth", "Kicks", "Snares", "Hi-Hats", "FX", "Loops"
  ];

  const artistStyles = [
    "Kabza De Small", "Kelvin Momo", "Babalwa M", "MFR Souls", "Mas MusiQ", "DJ Maphorisa"
  ];

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sample.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || sample.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesGenre = selectedGenre === "all" || sample.sample_type === selectedGenre;
    return matchesSearch && matchesCategory && matchesGenre;
  });

  const handlePlaySample = async (sampleId: string, sampleName: string, audioUrl: string) => {
    if (playingSample === sampleId) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      setPlayingSample(null);
      return;
    }
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingSample(sampleId);
      toast.info(`🎵 Playing "${sampleName}"`);
      audio.addEventListener('ended', () => setPlayingSample(null));
      audio.addEventListener('error', () => { toast.error("Audio playback failed"); setPlayingSample(null); });
      await audio.play();
    } catch {
      toast.error("Audio playback failed");
      setPlayingSample(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading samples...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gradient-primary mb-2">Sample Library</h1>
              <p className="text-lg text-muted-foreground">
                {samples.length > 0
                  ? `Explore ${samples.length} authentic amapiano samples.`
                  : 'Your sample library is empty. Upload a pack to get started!'}
              </p>
            </div>
            <SamplePackUploader onComplete={() => refetch()} />
          </div>

          {/* Search and Filters */}
          <Card className="card-glow mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search samples, tags, or packs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c.toLowerCase() === "all" ? "all" : c.toLowerCase()}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="loop">Loops</SelectItem>
                    <SelectItem value="oneshot">One-shots</SelectItem>
                    <SelectItem value="midi">MIDI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="samples" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="samples">Sample Collection</TabsTrigger>
              <TabsTrigger value="artists">Artist Styles</TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />AI Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="samples">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSamples.map(sample => (
                  <Card key={sample.id} className="card-glow hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{sample.name}</CardTitle>
                          <CardDescription className="text-sm">{sample.pack_name || 'Uncategorized'}</CardDescription>
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          className={sample.is_favorite ? "text-destructive" : "text-muted-foreground"}
                          onClick={() => toggleFavorite.mutate(sample.id)}
                          disabled={toggleFavorite.isPending}
                        >
                          <Heart className="w-4 h-4" fill={sample.is_favorite ? "currentColor" : "none"} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BPM:</span>
                            <span>{sample.bpm || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Key:</span>
                            <span>{sample.key_signature || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Length:</span>
                            <span>{formatDuration(sample.duration_seconds)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Downloads:</span>
                            <span>{sample.download_count}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">{sample.category}</Badge>
                          <Badge variant="outline" className="text-xs">{sample.sample_type}</Badge>
                        </div>

                        {sample.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sample.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs opacity-60">#{tag}</Badge>
                            ))}
                          </div>
                        )}

                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <Button size="sm" className="btn-glow" onClick={() => handlePlaySample(sample.id, sample.name, sample.audio_url)}>
                              {playingSample === sample.id ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                              {playingSample === sample.id ? "Playing..." : "Play"}
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadSample(sample)}>
                            <Download className="w-3 h-3 mr-1" />Download
                          </Button>
                          <Button size="sm" className="flex-1" onClick={() => {
                            const trackData = {
                              name: `Sample: ${sample.name}`,
                              audioUrl: sample.audio_url,
                              type: 'audio',
                              metadata: { bpm: sample.bpm || 120, genre: sample.category, duration: sample.duration_seconds || 30 },
                            };
                            localStorage.setItem('pendingGeneratedTrack', JSON.stringify(trackData));
                            navigate('/daw');
                            toast.success(`🎵 "${sample.name}" sent to DAW!`);
                          }}>
                            <Music className="w-3 h-3 mr-1" />Add to DAW
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredSamples.length === 0 && (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No samples found</h3>
                  <p className="text-muted-foreground">
                    {samples.length === 0 ? 'Upload a sample pack to get started' : 'Try adjusting your search criteria'}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="artists">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artistStyles.map(artist => (
                  <Card key={artist} className="card-glow hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg">{artist} Style Pack</CardTitle>
                      <CardDescription>Samples inspired by {artist}'s legendary style</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">50+ samples including piano loops, drum patterns, and signature sounds</p>
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary">Premium</Badge>
                          <Button size="sm">Explore Pack</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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

export default Samples;
