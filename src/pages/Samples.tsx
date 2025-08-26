import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, Heart, Filter, Search, Music, Star } from "lucide-react";

const Samples = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");

  const categories = [
    "All", "Log Drums", "Piano", "Percussion", "Bass", "Vocals", "Saxophone", "Guitar", "Synth"
  ];

  const samples = [
    {
      id: 1,
      name: "Kelvin Momo Style Piano Loop",
      artist: "In the style of Kelvin Momo",
      category: "Piano",
      genre: "Private School",
      bpm: 118,
      key: "F#m",
      duration: "0:08",
      rating: 4.9,
      downloads: 2847,
      tags: ["jazzy", "soulful", "chord progression"],
      isLiked: false
    },
    {
      id: 2,
      name: "Classic Log Drum Pattern", 
      artist: "In the style of Kabza De Small",
      category: "Log Drums",
      genre: "Classic",
      bpm: 120,
      key: "Cm",
      duration: "0:04",
      rating: 4.8,
      downloads: 1923,
      tags: ["deep", "rhythmic", "classic"],
      isLiked: true
    },
    {
      id: 3,
      name: "Saxophone Melody",
      artist: "Original composition",
      category: "Saxophone", 
      genre: "Private School",
      bpm: 115,
      key: "Gm",
      duration: "0:16",
      rating: 4.7,
      downloads: 1534,
      tags: ["smooth", "jazzy", "melodic"],
      isLiked: false
    },
    {
      id: 4,
      name: "Afro Percussion Loop",
      artist: "Traditional inspired",
      category: "Percussion",
      genre: "Classic",
      bpm: 125,
      key: "N/A",
      duration: "0:08",
      rating: 4.6,
      downloads: 987,
      tags: ["traditional", "rhythmic", "african"],
      isLiked: false
    },
    {
      id: 5,
      name: "Deep Bass Foundation",
      artist: "Studio original",
      category: "Bass",
      genre: "Deep Amapiano",
      bpm: 112,
      key: "Am",
      duration: "0:12",
      rating: 4.8,
      downloads: 2156,
      tags: ["deep", "sub-bass", "foundation"],
      isLiked: true
    },
    {
      id: 6,
      name: "Vocal Chant Sample",
      artist: "Cultural heritage",
      category: "Vocals",
      genre: "Vocal Amapiano",
      bpm: 118,
      key: "Dm",
      duration: "0:06",
      rating: 4.9,
      downloads: 3421,
      tags: ["chant", "cultural", "authentic"],
      isLiked: false
    }
  ];

  const artistStyles = [
    "Kabza De Small", "Kelvin Momo", "Babalwa M", "MFR Souls", "Mas MusiQ", "DJ Maphorisa"
  ];

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sample.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || sample.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesGenre = selectedGenre === "all" || sample.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">
              Sample Library
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore 10,000+ authentic amapiano samples curated by South African artists and producers.
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="card-glow mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search samples, tags, or styles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase() === "all" ? "all" : category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="classic">Classic Amapiano</SelectItem>
                    <SelectItem value="private">Private School</SelectItem>
                    <SelectItem value="vocal">Vocal Amapiano</SelectItem>
                    <SelectItem value="deep">Deep Amapiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="samples" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="samples">Sample Collection</TabsTrigger>
              <TabsTrigger value="artists">Artist Styles</TabsTrigger>
            </TabsList>

            <TabsContent value="samples">
              {/* Sample Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSamples.map((sample) => (
                  <Card key={sample.id} className="card-glow hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{sample.name}</CardTitle>
                          <CardDescription className="text-sm">{sample.artist}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={sample.isLiked ? "text-red-500" : "text-muted-foreground"}
                        >
                          <Heart className="w-4 h-4" fill={sample.isLiked ? "currentColor" : "none"} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Sample Info */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BPM:</span>
                            <span>{sample.bpm}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Key:</span>
                            <span>{sample.key}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Length:</span>
                            <span>{sample.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rating:</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-primary text-primary" />
                              <span>{sample.rating}</span>
                            </div>
                          </div>
                        </div>

                        {/* Category and Genre */}
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {sample.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {sample.genre}
                          </Badge>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {sample.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs opacity-60">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Audio Player */}
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <Button size="sm" className="btn-glow">
                              <Play className="w-3 h-3 mr-1" />
                              Play
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {sample.downloads.toLocaleString()} downloads
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" className="flex-1">
                            <Music className="w-3 h-3 mr-1" />
                            Add to DAW
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
                  <p className="text-muted-foreground">Try adjusting your search criteria</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="artists">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artistStyles.map((artist) => (
                  <Card key={artist} className="card-glow hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg">{artist} Style Pack</CardTitle>
                      <CardDescription>
                        Samples inspired by the legendary style of {artist}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Contains 50+ samples including piano loops, drum patterns, and signature sounds
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary">Premium Pack</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            <span className="text-sm">4.9</span>
                          </div>
                        </div>
                        <Button className="w-full btn-glow">
                          Explore Pack
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Samples;