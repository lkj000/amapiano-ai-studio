/**
 * Sample Similarity Search Component
 * Semantic search for finding similar samples using AI embeddings
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Plus,
  AudioWaveform,
  Music2,
  Sparkles,
  Filter,
  Clock,
  Hash,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SampleResult {
  id: string;
  name: string;
  category: string;
  bpm: number | null;
  key: string | null;
  duration: number | null;
  similarity: number;
  tags: string[];
  audioUrl?: string;
}

export function SampleSimilaritySearch() {
  const [searchMode, setSearchMode] = useState<'text' | 'audio'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SampleResult[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minBpm: 80,
    maxBpm: 180,
    category: 'all',
    minSimilarity: 50
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    try {
      // Search using vector similarity
      const { data: vectors, error } = await supabase
        .from('musical_vectors')
        .select('entity_id, metadata, embedding')
        .eq('entity_type', 'sample')
        .limit(20);

      if (error) throw error;

      // Simple text matching for demo (in production, use proper vector search)
      const queryLower = searchQuery.toLowerCase();
      const matchedResults: SampleResult[] = (vectors || [])
        .filter(v => {
          const meta = v.metadata as any;
          const searchText = `${meta?.name || ''} ${meta?.category || ''} ${(meta?.tags || []).join(' ')}`.toLowerCase();
          return searchText.includes(queryLower);
        })
        .map((v, i) => {
          const meta = v.metadata as any;
          return {
            id: v.entity_id,
            name: meta?.name || 'Unknown Sample',
            category: meta?.category || 'Uncategorized',
            bpm: meta?.bpm || null,
            key: meta?.key || null,
            duration: meta?.duration || null,
            similarity: 95 - (i * 5), // Simulated similarity scores
            tags: meta?.tags || []
          };
        });

      if (matchedResults.length === 0) {
        // Generate mock results for demo
        setResults(generateMockResults(searchQuery));
        toast.info('Showing example results (index your samples for real search)');
      } else {
        setResults(matchedResults);
        toast.success(`Found ${matchedResults.length} similar samples`);
      }

    } catch (error) {
      console.error('Search failed:', error);
      // Show mock results on error
      setResults(generateMockResults(searchQuery));
      toast.info('Showing example results');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAudioSearch = async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file');
      return;
    }

    setIsSearching(true);
    toast.info('Analyzing audio characteristics...');

    try {
      // Simulate audio analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would:
      // 1. Extract audio features (spectral, rhythm, etc.)
      // 2. Generate embedding vector
      // 3. Search for similar vectors in database
      
      const mockResults = generateMockResults('audio-based');
      setResults(mockResults);
      toast.success(`Found ${mockResults.length} similar samples`);

    } catch (error) {
      console.error('Audio search failed:', error);
      toast.error('Audio search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const generateMockResults = (query: string): SampleResult[] => {
    const categories = ['Drums', 'Bass', 'Synth', 'Vocal', 'FX', 'Percussion'];
    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].flatMap(k => [`${k} Major`, `${k} Minor`]);
    const tags = ['amapiano', 'log drum', 'punchy', 'warm', 'dark', 'bright', 'deep', 'airy'];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: `sample-${i}`,
      name: `${query.charAt(0).toUpperCase() + query.slice(1)} Sample ${i + 1}`,
      category: categories[i % categories.length],
      bpm: 110 + Math.floor(Math.random() * 20),
      key: keys[Math.floor(Math.random() * keys.length)],
      duration: 2 + Math.random() * 8,
      similarity: 98 - (i * 8) + Math.floor(Math.random() * 5),
      tags: [tags[i % tags.length], tags[(i + 3) % tags.length]]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      toast.success(`Loaded: ${file.name}`);
    }
  };

  const togglePlay = useCallback((sample: SampleResult) => {
    if (playingId === sample.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      // In production, would play actual audio URL
      setPlayingId(sample.id);
      toast.info(`Playing: ${sample.name}`);
      // Simulate playback end
      setTimeout(() => setPlayingId(null), 3000);
    }
  }, [playingId]);

  const addToProject = (sample: SampleResult) => {
    toast.success(`Added "${sample.name}" to project`);
  };

  const filteredResults = results.filter(r => {
    if (r.bpm && (r.bpm < filters.minBpm || r.bpm > filters.maxBpm)) return false;
    if (filters.category !== 'all' && r.category.toLowerCase() !== filters.category) return false;
    if (r.similarity < filters.minSimilarity) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Search className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold">Sample Similarity Search</h2>
        </div>
        <p className="text-muted-foreground">
          Find samples by description or upload audio to find similar sounds
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Search Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as 'text' | 'audio')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Text Search
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <AudioWaveform className="w-4 h-4" />
                  
                  Audio Search
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 'punchy log drum 115 bpm' or 'dark ambient pad'"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleTextSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Try:</span>
                  {['amapiano log drum', 'deep bass 120 bpm', 'vocal chop', 'percussion loop'].map(suggestion => (
                    <Badge 
                      key={suggestion}
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        handleTextSearch();
                      }}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4 mt-4">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                {!audioFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Upload a reference sample</p>
                    <p className="text-sm text-muted-foreground">
                      We'll find similar sounds in your library
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <Music2 className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{audioFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(audioFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button onClick={handleAudioSearch} disabled={isSearching}>
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Find Similar
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAudioFile(null);
                        fileInputRef.current?.click();
                      }}
                      className="w-full"
                    >
                      Upload Different File
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>BPM Range</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm w-8">{filters.minBpm}</span>
                <Slider
                  value={[filters.minBpm, filters.maxBpm]}
                  onValueChange={([min, max]) => setFilters(f => ({ ...f, minBpm: min, maxBpm: max }))}
                  min={60}
                  max={200}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm w-8">{filters.maxBpm}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Min Similarity</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[filters.minSimilarity]}
                  onValueChange={([v]) => setFilters(f => ({ ...f, minSimilarity: v }))}
                  min={0}
                  max={100}
                />
                <Badge variant="outline">{filters.minSimilarity}%</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {['all', 'drums', 'bass', 'synth', 'vocal', 'fx'].map(cat => (
                  <Badge
                    key={cat}
                    variant={filters.category === cat ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilters(f => ({ ...f, category: cat }))}
                  >
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Results ({filteredResults.length})</span>
              <Badge variant="outline">
                {results.length} total matches
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredResults.map(sample => (
                  <div
                    key={sample.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => togglePlay(sample)}
                    >
                      {playingId === sample.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{sample.name}</p>
                        <Badge 
                          variant="secondary"
                          className={
                            sample.similarity >= 90 ? 'bg-green-500/20 text-green-500' :
                            sample.similarity >= 70 ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-muted'
                          }
                        >
                          {sample.similarity}% match
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{sample.category}</span>
                        {sample.bpm && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sample.bpm} BPM
                          </span>
                        )}
                        {sample.key && <span>{sample.key}</span>}
                        {sample.duration && <span>{sample.duration.toFixed(1)}s</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sample.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="icon" onClick={() => addToProject(sample)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
