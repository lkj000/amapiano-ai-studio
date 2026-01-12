/**
 * LANDR Samples Browser Component
 * Full samples library with real Supabase data
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Download, 
  Heart, 
  Play, 
  Pause,
  Music2,
  Drum,
  Guitar,
  Piano,
  Mic2,
  Waves,
  TrendingUp,
  Star,
  Package,
  FolderOpen,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useLANDRSamples, LANDRSamplePack } from '@/hooks/useLANDRSamples';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const GENRES = [
  'Hip-Hop', 'House', 'RnB', 'Techno', 'LoFi', 'Synthwave', 
  'Drum & Bass', 'Afrobeats', 'SFX', 'Reggaeton', 'Soul', 'Trap', 'Pop', 'Amapiano'
];

const INSTRUMENTS = [
  { name: 'Vocals', icon: Mic2 },
  { name: 'Drums', icon: Drum },
  { name: 'Guitars', icon: Guitar },
  { name: 'Bass', icon: Waves },
  { name: 'Synth', icon: Waves },
  { name: 'Keys', icon: Piano }
];

export const LANDRSamplesBrowser: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { packs, samples, isLoading, favorites, toggleFavorite, downloadPack, downloadSample } = useLANDRSamples();
  const audioPlayer = useAudioPlayer();

  const filteredPacks = packs.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pack.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || pack.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const trendingPacks = [...packs].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
  const exclusivePacks = packs.filter(p => p.isExclusive).slice(0, 5);
  const newPacks = packs.filter(p => p.isNew).slice(0, 5);

  const handlePlaySample = async (sample: any) => {
    if (audioPlayer.currentTrackId === sample.id && audioPlayer.isPlaying) {
      audioPlayer.pause();
      setPlayingId(null);
    } else {
      await audioPlayer.play(sample.audio_url, sample.id);
      setPlayingId(sample.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search samples, packs, labels..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Heart className="w-4 h-4 mr-2" />
            Favorites ({favorites.size})
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Downloads
          </Button>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            My Collections
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="browse" className="w-full">
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="samples">Individual Samples</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Genre Pills */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedGenre === null ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedGenre(null)}
              >
                All
              </Button>
              {GENRES.map(genre => (
                <Button 
                  key={genre} 
                  variant={selectedGenre === genre ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </Button>
              ))}
            </div>

            {/* Free Pack Banner */}
            <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-purple-400" />
                  <div>
                    <h3 className="font-semibold">Free Pack Giveaway</h3>
                    <p className="text-sm text-muted-foreground">Download exclusive free samples weekly</p>
                  </div>
                </div>
                <Button>Claim Free Pack</Button>
              </CardContent>
            </Card>

            {/* Sample Packs Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {filteredPacks.length > 0 ? 'Sample Packs' : 'No packs found'}
                </h3>
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              {filteredPacks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sample packs found</p>
                  <p className="text-sm">Upload sample packs to the marketplace to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPacks.map(pack => (
                    <PackCard 
                      key={pack.id} 
                      pack={pack} 
                      isFavorite={favorites.has(pack.id)}
                      onToggleFavorite={() => toggleFavorite(pack.id)}
                      onDownload={() => downloadPack.mutate(pack)}
                      isDownloading={downloadPack.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Trending Packs */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    Trending Packs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trendingPacks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No trending packs yet</p>
                    ) : (
                      trendingPacks.map((pack, index) => (
                        <div key={pack.id} className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2">
                          <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pack.name}</p>
                            <p className="text-xs text-muted-foreground truncate">by {pack.artist}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Exclusives */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Exclusives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exclusivePacks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No exclusive packs yet</p>
                    ) : (
                      exclusivePacks.map((pack, index) => (
                        <div key={pack.id} className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2">
                          <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pack.name}</p>
                            <p className="text-xs text-muted-foreground">{pack.sampleCount} samples</p>
                          </div>
                          <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* New Releases */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-500" />
                    New Releases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {newPacks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No new packs this week</p>
                    ) : (
                      newPacks.map((pack, index) => (
                        <div key={pack.id} className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2">
                          <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{pack.name}</p>
                            <p className="text-xs text-muted-foreground">{pack.sampleCount} samples</p>
                          </div>
                          <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Instruments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Instruments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {INSTRUMENTS.map(inst => (
                      <Button 
                        key={inst.name} 
                        variant="outline" 
                        className="h-auto py-4 flex-col gap-2 hover:border-primary"
                      >
                        <inst.icon className="w-6 h-6" />
                        <span>{inst.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Genres */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Genres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.slice(0, 10).map(genre => (
                      <Button 
                        key={genre} 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedGenre(genre)}
                      >
                        {genre}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Individual Samples Tab */}
          <TabsContent value="samples" className="space-y-4">
            <ScrollArea className="h-[500px]">
              {samples.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Music2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No public samples available</p>
                  <p className="text-sm">Upload samples and make them public to see them here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {samples.map(sample => (
                    <div 
                      key={sample.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        playingId === sample.id ? 'bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-10 h-10 rounded-full"
                        onClick={() => handlePlaySample(sample)}
                      >
                        {playingId === sample.id && audioPlayer.isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{sample.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{sample.category}</span>
                          {sample.bpm && <span>• {sample.bpm} BPM</span>}
                          {sample.key_signature && <span>• {sample.key_signature}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(sample.id)}
                        >
                          <Heart className={`w-4 h-4 ${favorites.has(sample.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadSample.mutate(sample)}
                          disabled={downloadSample.isPending}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// Pack Card Component
interface PackCardProps {
  pack: LANDRSamplePack;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}

const PackCard: React.FC<PackCardProps> = ({ pack, isFavorite, onToggleFavorite, onDownload, isDownloading }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="group overflow-hidden hover:border-primary/50 transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          {pack.imageUrl ? (
            <img src={pack.imageUrl} alt={pack.name} className="w-full h-full object-cover" />
          ) : (
            <Music2 className="w-12 h-12 text-primary/40" />
          )}
        </div>
        {pack.isExclusive && (
          <Badge className="absolute top-2 left-2 bg-purple-500">Exclusive</Badge>
        )}
        {pack.isNew && (
          <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
        )}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity">
            <Button size="icon" variant="secondary">
              <Play className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button 
              size="icon" 
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium text-sm truncate">{pack.name}</h4>
        <p className="text-xs text-muted-foreground truncate">by {pack.artist}</p>
        <div className="flex items-center justify-between mt-2">
          <Badge variant="outline" className="text-xs">{pack.genre}</Badge>
          <span className="text-xs text-muted-foreground">{pack.sampleCount} samples</span>
        </div>
      </CardContent>
    </Card>
  );
};
