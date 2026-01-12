/**
 * LANDR Samples Browser Component
 * Full samples library with genres, categories, trending packs
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
  Clock,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface SamplePack {
  id: string;
  name: string;
  artist: string;
  genre: string;
  sampleCount: number;
  imageUrl?: string;
  isExclusive?: boolean;
  isNew?: boolean;
}

interface TrendingItem {
  rank: number;
  name: string;
  artist?: string;
  count?: string;
}

const GENRES = [
  'Hip-Hop', 'House', 'RnB', 'Techno', 'LoFi', 'Synthwave', 
  'Drum & Bass', 'Afrobeats', 'SFX', 'Reggaeton', 'Soul', 'Trap', 'Pop'
];

const INSTRUMENTS = [
  { name: 'Vocals', icon: Mic2 },
  { name: 'Drums', icon: Drum },
  { name: 'Guitars', icon: Guitar },
  { name: 'Bass', icon: Waves },
  { name: 'Synth', icon: Waves },
  { name: 'Keys', icon: Piano }
];

const TRENDING_PACKS: TrendingItem[] = [
  { rank: 1, name: 'Textures', artist: 'Jazzfeezy Productions' },
  { rank: 2, name: 'Drumline Goldmine Vol. 2', artist: 'Hot Mic' },
  { rank: 3, name: 'Noire - Soul & RnB Samples', artist: 'wolves' },
  { rank: 4, name: 'Modern Pop Vocals Volume 1', artist: 'AMV Music Library' },
  { rank: 5, name: 'Strings Volume 1', artist: 'Jazzfeezy Productions' }
];

const TRENDING_LABELS: TrendingItem[] = [
  { rank: 1, name: 'AMV Music Library', count: '26 packs' },
  { rank: 2, name: 'UNDRGRND Sounds', count: '212 packs' },
  { rank: 3, name: 'Sample Tools by Cr2', count: '255 packs' },
  { rank: 4, name: 'Image Sounds', count: '244 packs' },
  { rank: 5, name: 'Catalyst Samples', count: '290 packs' }
];

const LANDR_EXCLUSIVES: TrendingItem[] = [
  { rank: 1, name: 'Shadow Realm', count: '110 samples' },
  { rank: 2, name: 'Trapsoul Drip', count: '100 samples' },
  { rank: 3, name: 'Grillz', count: '100 samples' },
  { rank: 4, name: 'SOS Vox', count: '31 samples' },
  { rank: 5, name: 'Violet RnB', count: '139 samples' }
];

const TOP_SELLING_GENRES = [
  'House', 'Soul & RnB', 'LoFi', 'Techno', 'Hip Hop', 
  'Reggaeton', 'Drum & Bass', 'Afrobeats', 'SFX'
];

const FEATURED_ARTISTS = [
  { name: 'Billie Eilish', genre: 'POP / ALTERNATIVE' },
  { name: 'Ellie Goulding', genre: 'ELECTROPOP' },
  { name: 'Eminem', genre: 'HIP-HOP' },
  { name: 'Flying Lotus', genre: 'ELECTRONIC / INSTRUMENTAL HIP-HOP' },
  { name: 'Clean Bandit', genre: 'ELECTRONIC / POP' },
  { name: 'Russ', genre: 'HIP-HOP' },
  { name: 'Joey Bada$$', genre: 'HIP-HOP' },
  { name: 'Rick Ross', genre: 'HIP-HOP' },
  { name: 'T.I', genre: 'HIP-HOP' },
  { name: 'Drake', genre: 'HIP-HOP / R&B' },
  { name: 'Sigrid', genre: 'POP' }
];

const SAMPLE_PACKS: SamplePack[] = [
  { id: '1', name: 'Prism Soul', artist: 'UNDRGRND Sounds', genre: 'Soul', sampleCount: 150, isExclusive: true },
  { id: '2', name: 'Hot Mic Drums', artist: 'Hot Mic', genre: 'Hip-Hop', sampleCount: 200, isNew: true },
  { id: '3', name: 'AIDDLE Beats', artist: 'AIDDLE', genre: 'Afrobeats', sampleCount: 120 },
  { id: '4', name: 'Banger Samples Vol.1', artist: 'Banger Samples', genre: 'Trap', sampleCount: 180 },
  { id: '5', name: 'Solar Samples', artist: 'Solar Samples', genre: 'House', sampleCount: 90 },
  { id: '6', name: 'Shobeats Pack', artist: 'Shobeats', genre: 'Hip-Hop', sampleCount: 250 },
  { id: '7', name: 'Amapiano Essentials', artist: 'Tamuz Samples', genre: 'Afrobeats', sampleCount: 175, isExclusive: true },
  { id: '8', name: 'Lo-Fi Dreams', artist: 'Chromatic', genre: 'LoFi', sampleCount: 100 }
];

export const LANDRSamplesBrowser: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success('Removed from favorites');
      } else {
        next.add(id);
        toast.success('Added to favorites');
      }
      return next;
    });
  };

  const downloadPack = (pack: SamplePack) => {
    toast.success(`Downloading ${pack.name}...`, {
      description: `${pack.sampleCount} samples from ${pack.artist}`
    });
  };

  const filteredPacks = SAMPLE_PACKS.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pack.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || pack.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

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
            Favorites
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

      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="artists">Artist Samples</TabsTrigger>
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
              <h3 className="text-lg font-semibold">New Releases</h3>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPacks.map(pack => (
                <Card key={pack.id} className="group overflow-hidden hover:border-primary/50 transition-all">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music2 className="w-12 h-12 text-primary/40" />
                    </div>
                    {pack.isExclusive && (
                      <Badge className="absolute top-2 left-2 bg-purple-500">Exclusive</Badge>
                    )}
                    {pack.isNew && (
                      <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => setPlayingId(playingId === pack.id ? null : pack.id)}
                      >
                        {playingId === pack.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => toggleFavorite(pack.id)}
                      >
                        <Heart className={`w-4 h-4 ${favorites.has(pack.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={() => downloadPack(pack)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
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
              ))}
            </div>
          </div>

          {/* Top Selling */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Selling Packs 2025</h3>
            <div className="flex flex-wrap gap-2">
              {TOP_SELLING_GENRES.map(genre => (
                <Button key={genre} variant="outline" size="sm">
                  {genre}
                </Button>
              ))}
            </div>
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
                  {TRENDING_PACKS.map(item => (
                    <div key={item.rank} className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2">
                      <span className="text-lg font-bold text-muted-foreground w-6">{item.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">by {item.artist}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Labels */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Trending Labels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TRENDING_LABELS.map(item => (
                    <div key={item.rank} className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2">
                      <span className="text-lg font-bold text-muted-foreground w-6">{item.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.count}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* LANDR Exclusives */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  LANDR Exclusives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {LANDR_EXCLUSIVES.map(item => (
                    <div key={item.rank} className="flex items-center gap-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2">
                      <span className="text-lg font-bold text-muted-foreground w-6">{item.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.count}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
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
                  {['Trap', 'Pop', 'R&B', 'House', 'Techno', 'Soul', 'Afrobeats', 'Amapiano', 'Drill', 'Future Bass'].map(genre => (
                    <Button key={genre} variant="outline" size="sm">
                      {genre}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SFX */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sound Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Voices', 'Ambience', 'Environment', 'Industrial', 'Foley', 'Risers', 'Impacts'].map(sfx => (
                    <Button key={sfx} variant="outline" size="sm">
                      {sfx}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* BPM & Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">BPM & Key</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Popular BPMs</p>
                    <div className="flex flex-wrap gap-2">
                      {['90 BPM', '100 BPM', '120 BPM', '140 BPM', '150 BPM'].map(bpm => (
                        <Badge key={bpm} variant="outline" className="cursor-pointer hover:bg-primary/10">
                          {bpm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Keys</p>
                    <div className="flex flex-wrap gap-2">
                      {['C min', 'D min', 'E min', 'F min', 'G min', 'A min', 'C maj', 'D maj'].map(key => (
                        <Badge key={key} variant="outline" className="cursor-pointer hover:bg-primary/10">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Artist Samples Tab */}
        <TabsContent value="artists" className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Samples from Award-Winning Producers</h3>
            <p className="text-muted-foreground">With credits alongside the biggest names in music</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {FEATURED_ARTISTS.map((artist, index) => (
              <Card key={index} className="group cursor-pointer hover:border-primary/50 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <Music2 className="w-8 h-8 text-primary/60" />
                  </div>
                  <h4 className="font-medium text-sm truncate">{artist.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{artist.genre}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LANDRSamplesBrowser;
