import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Book, Globe, Music, Users, Star, Clock, 
  Brain, Lightbulb, Archive, Database, Zap, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface KnowledgeItem {
  id: string;
  type: 'cultural' | 'technical' | 'artist' | 'technique' | 'history';
  title: string;
  content: string;
  tags: string[];
  relevanceScore: number;
  source: string;
  lastUpdated: Date;
  views: number;
  helpful: number;
}

interface RAGKnowledgeBaseProps {
  currentContext?: string;
  onKnowledgeApply?: (knowledge: KnowledgeItem) => void;
  className?: string;
}

// Comprehensive Amapiano Knowledge Database
const AMAPIANO_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: 'kb_cultural_001',
    type: 'cultural',
    title: 'Origins of Amapiano in South African Townships',
    content: 'Amapiano originated in South African townships around 2012, blending deep house, jazz, and lounge music. The genre emerged from Gauteng province, particularly in areas like Pretoria and the East Rand. Key pioneers included Kabza De Small, DJ Maphorisa, and MFR Souls who developed the signature sound combining log drums, piano melodies, and deep basslines.',
    tags: ['history', 'south africa', 'townships', 'origins', 'kabza de small'],
    relevanceScore: 0.95,
    source: 'Cultural Heritage Archives',
    lastUpdated: new Date('2024-01-15'),
    views: 1247,
    helpful: 89
  },
  {
    id: 'kb_technical_001',
    type: 'technical',
    title: 'Log Drum Programming Techniques',
    content: 'The iconic amapiano log drum sound is achieved using pitched percussion samples, typically tuned wooden drums or synthesized equivalents. Key programming tips: Use velocities between 85-127 for kicks, layer multiple log samples at different pitches (C1, F#1, A#1), apply subtle swing timing (±10ms), and emphasize beats 1 and 3 with syncopated ghost notes on off-beats.',
    tags: ['log drums', 'programming', 'percussion', 'technique', 'swing'],
    relevanceScore: 0.92,
    source: 'Production Masterclass',
    lastUpdated: new Date('2024-02-08'),
    views: 2156,
    helpful: 156
  },
  {
    id: 'kb_artist_001', 
    type: 'artist',
    title: 'Kabza De Small - Production Style Analysis',
    content: 'Kabza De Small\'s signature sound features deep, rolling basslines, sophisticated jazz chord progressions, and intricate percussion layering. His tracks typically sit at 118 BPM in minor keys (F#m, Am). He often uses gospel-influenced piano voicings with 7th and 9th extensions, creates dynamic builds through percussion additions, and maintains cultural authenticity while pushing creative boundaries.',
    tags: ['kabza de small', 'production style', 'bass', 'piano', 'jazz chords'],
    relevanceScore: 0.89,
    source: 'Artist Analysis Database',
    lastUpdated: new Date('2024-02-20'),
    views: 987,
    helpful: 78
  },
  {
    id: 'kb_technical_002',
    type: 'technical', 
    title: 'Private School Amapiano Characteristics',
    content: 'Private School amapiano is a sophisticated subgenre featuring live instruments, complex arrangements, and jazz influences. Key elements include: violin/string sections for melodic leads, acoustic guitar fingerpicking patterns, jazz saxophone and trumpet sections, sophisticated chord progressions (ii-V-I movements), and subtle vocal harmonies. The production is cleaner and more polished than traditional amapiano.',
    tags: ['private school', 'live instruments', 'strings', 'jazz', 'sophisticated'],
    relevanceScore: 0.88,
    source: 'Genre Classification Study',
    lastUpdated: new Date('2024-01-30'),
    views: 1543,
    helpful: 112
  },
  {
    id: 'kb_technique_001',
    type: 'technique',
    title: 'Amapiano Mixing and Mastering Guidelines',
    content: 'Amapiano mixing requires specific techniques for optimal sound: High-pass everything except kick and bass around 80-100Hz to avoid muddy low-end. Use side-chain compression on bass triggered by kick for pumping effect. Apply subtle reverb to piano and percussion for space. Keep vocals dry but present. Master to -14 LUFS for streaming platforms. Use multiband compression to control low-end buildup.',
    tags: ['mixing', 'mastering', 'eq', 'compression', 'streaming'],
    relevanceScore: 0.91,
    source: 'Audio Engineering Guide',
    lastUpdated: new Date('2024-02-15'),
    views: 1876,
    helpful: 134
  },
  {
    id: 'kb_cultural_002',
    type: 'cultural',
    title: 'Traditional Instruments in Modern Amapiano',
    content: 'Modern amapiano incorporates traditional South African instruments: Marimba patterns inspire log drum rhythms, traditional drums like djembe and talking drum influence percussion layers, mbira (thumb piano) patterns inspire melodic sequences, and traditional vocal techniques like ululation and call-response are sampled or recreated. This maintains cultural authenticity while modernizing the sound.',
    tags: ['traditional instruments', 'marimba', 'mbira', 'cultural authenticity'],
    relevanceScore: 0.86,
    source: 'Ethnomusicology Research',
    lastUpdated: new Date('2024-01-22'),
    views: 743,
    helpful: 67
  },
  {
    id: 'kb_history_001',
    type: 'history',
    title: 'Evolution from Kwaito to Amapiano',
    content: 'Amapiano evolved from kwaito, South African house music popular in the 1990s-2000s. While kwaito featured slower tempos (around 110 BPM) and prominent vocals, amapiano increased the tempo to 115-120 BPM, emphasized instrumental sections, and incorporated jazz elements. The transition happened gradually from 2010-2015, with producers like DJ Maphorisa bridging both genres.',
    tags: ['kwaito', 'evolution', 'dj maphorisa', 'history', 'south african house'],
    relevanceScore: 0.84,
    source: 'Music History Archives',
    lastUpdated: new Date('2024-01-10'),
    views: 665,
    helpful: 52
  }
];

export const RAGKnowledgeBase: React.FC<RAGKnowledgeBaseProps> = ({
  currentContext,
  onKnowledgeApply,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(AMAPIANO_KNOWLEDGE);
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>(AMAPIANO_KNOWLEDGE);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [contextualSuggestions, setContextualSuggestions] = useState<KnowledgeItem[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-search based on current context
  useEffect(() => {
    if (currentContext) {
      generateContextualSuggestions(currentContext);
    }
  }, [currentContext]);

  // Filter knowledge items based on search and type
  useEffect(() => {
    let filtered = knowledgeItems;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );

      // Sort by relevance
      filtered = filtered.sort((a, b) => {
        const aScore = calculateSearchRelevance(a, query);
        const bScore = calculateSearchRelevance(b, query);
        return bScore - aScore;
      });
    } else {
      // Sort by relevance score when no search
      filtered = filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedType, knowledgeItems]);

  const calculateSearchRelevance = (item: KnowledgeItem, query: string): number => {
    let score = item.relevanceScore;
    
    // Boost score for title matches
    if (item.title.toLowerCase().includes(query)) {
      score += 0.3;
    }
    
    // Boost for exact tag matches
    if (item.tags.some(tag => tag.toLowerCase() === query)) {
      score += 0.2;
    }
    
    // Boost for content matches
    const contentMatches = (item.content.toLowerCase().match(new RegExp(query, 'g')) || []).length;
    score += contentMatches * 0.05;
    
    return score;
  };

  const generateContextualSuggestions = (context: string) => {
    const contextLower = context.toLowerCase();
    let suggestions: KnowledgeItem[] = [];

    // Analyze context and suggest relevant knowledge
    if (contextLower.includes('log') && contextLower.includes('drum')) {
      suggestions = knowledgeItems.filter(item => 
        item.tags.includes('log drums') || item.tags.includes('percussion')
      );
    } else if (contextLower.includes('piano')) {
      suggestions = knowledgeItems.filter(item => 
        item.tags.includes('piano') || item.tags.includes('jazz chords')
      );
    } else if (contextLower.includes('mix') || contextLower.includes('master')) {
      suggestions = knowledgeItems.filter(item => 
        item.tags.includes('mixing') || item.tags.includes('mastering')
      );
    } else if (contextLower.includes('private school')) {
      suggestions = knowledgeItems.filter(item => 
        item.tags.includes('private school') || item.tags.includes('sophisticated')
      );
    } else {
      // Default to most relevant cultural and technical items
      suggestions = knowledgeItems
        .filter(item => item.type === 'cultural' || item.type === 'technical')
        .slice(0, 3);
    }

    setContextualSuggestions(suggestions.slice(0, 4));
  };

  const performAISearch = async (query: string) => {
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('rag-knowledge-search', {
        body: {
          query,
          currentContext,
          knowledgeBase: knowledgeItems.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content.substring(0, 500),
            tags: item.tags,
            type: item.type
          }))
        }
      });

      if (error) {
        console.error('RAG search error:', error);
        toast.error('AI search unavailable, using basic search');
        return;
      }

      if (data?.enhancedResults) {
        const enhancedItems = data.enhancedResults
          .map((result: any) => {
            const originalItem = knowledgeItems.find(item => item.id === result.id);
            return originalItem ? { ...originalItem, relevanceScore: result.score } : null;
          })
          .filter(Boolean) as KnowledgeItem[];

        setFilteredItems(enhancedItems);
        toast.success(`Found ${enhancedItems.length} AI-enhanced results`);
      }

    } catch (error) {
      console.error('AI search error:', error);
      toast.error('Search failed, using basic filtering');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      performAISearch(query);
    }
  };

  const applyKnowledge = (item: KnowledgeItem) => {
    // Update view count
    setKnowledgeItems(prev => 
      prev.map(k => k.id === item.id ? { ...k, views: k.views + 1 } : k)
    );

    onKnowledgeApply?.(item);
    toast.success(`Applied knowledge: ${item.title}`);
  };

  const markHelpful = (item: KnowledgeItem) => {
    setKnowledgeItems(prev => 
      prev.map(k => k.id === item.id ? { ...k, helpful: k.helpful + 1 } : k)
    );
    toast.success("Marked as helpful!");
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      cultural: Globe,
      technical: Brain,
      artist: Users,
      technique: Lightbulb,
      history: Archive
    };
    return icons[type as keyof typeof icons] || Book;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      cultural: 'bg-green-500/20 text-green-700',
      technical: 'bg-blue-500/20 text-blue-700',
      artist: 'bg-purple-500/20 text-purple-700',
      technique: 'bg-yellow-500/20 text-yellow-700',
      history: 'bg-red-500/20 text-red-700'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-700';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          RAG Knowledge Base
          <Badge variant="outline" className="ml-auto bg-gradient-to-r from-green-500/20 to-blue-500/20">
            <Brain className="w-3 h-3 mr-1" />
            AI-Enhanced
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="contextual">Contextual</TabsTrigger>
            <TabsTrigger value="browse">Browse</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Search Interface */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search amapiano knowledge... (e.g., 'log drum patterns', 'private school style')"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => performAISearch(searchQuery)}
                  disabled={isSearching || !searchQuery.trim()}
                  variant="outline"
                >
                  {isSearching ? <Zap className="w-4 h-4 animate-pulse" /> : <Zap className="w-4 h-4" />}
                </Button>
              </div>

              {/* Type Filters */}
              <div className="flex gap-2 flex-wrap">
                {['all', 'cultural', 'technical', 'artist', 'technique', 'history'].map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="capitalize"
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Results */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    <Book className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No knowledge found</p>
                    <p className="text-xs">Try different search terms or browse categories</p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <Card 
                        key={item.id} 
                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-primary" />
                            <h3 className="font-medium text-sm">{item.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(item.type)} variant="outline">
                              {item.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(item.relevanceScore * 100)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {item.content.substring(0, 120)}...
                        </p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {item.helpful}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="contextual" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-3">
              Based on your current project context
            </div>

            <div className="space-y-3">
              {contextualSuggestions.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No contextual suggestions</p>
                  <p className="text-xs">Start working on your project to get relevant knowledge</p>
                </div>
              ) : (
                contextualSuggestions.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-primary" />
                          <h3 className="font-medium text-sm">{item.title}</h3>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyKnowledge(item)}
                        >
                          Apply
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3">
                        {item.content.substring(0, 150)}...
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge className={getTypeColor(item.type)} variant="outline">
                          {item.type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markHelpful(item)}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Helpful
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            {/* Browse by Category */}
            <div className="grid grid-cols-5 gap-2">
              {['cultural', 'technical', 'artist', 'technique', 'history'].map((type) => {
                const TypeIcon = getTypeIcon(type);
                const count = knowledgeItems.filter(item => item.type === type).length;
                
                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-auto p-3 flex-col gap-1"
                    onClick={() => setSelectedType(type)}
                  >
                    <TypeIcon className="w-5 h-5" />
                    <span className="text-xs capitalize">{type}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </Button>
                );
              })}
            </div>

            {/* Most Popular Knowledge */}
            <div>
              <h3 className="font-medium mb-2">Most Popular</h3>
              <div className="space-y-2">
                {knowledgeItems
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.views} views</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Knowledge Detail Modal/Panel */}
        {selectedItem && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {React.createElement(getTypeIcon(selectedItem.type), { className: "w-5 h-5 text-primary" })}
                    {selectedItem.title}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getTypeColor(selectedItem.type)}>
                    {selectedItem.type}
                  </Badge>
                  <Badge variant="outline">{selectedItem.source}</Badge>
                  <Badge variant="secondary">
                    {selectedItem.views} views • {selectedItem.helpful} helpful
                  </Badge>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p>{selectedItem.content}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedItem.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => applyKnowledge(selectedItem)}
                    className="flex-1"
                  >
                    Apply to Project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => markHelpful(selectedItem)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Helpful
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};