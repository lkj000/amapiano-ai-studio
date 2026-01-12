/**
 * Plugin Browser Component
 * LANDR-inspired plugin marketplace with categories and filtering
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search, 
  Download, 
  Star,
  Play,
  Filter,
  Zap,
  Wand2,
  Music,
  Volume2,
  Sparkles,
  Waves,
  Piano,
  Mic
} from 'lucide-react';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  name: string;
  developer: string;
  category: string;
  type: 'effect' | 'instrument' | 'utility';
  description: string;
  price: number; // cents, 0 = free
  rating: number;
  downloads: number;
  isNew: boolean;
  isFeatured: boolean;
  isPro: boolean;
  tags: string[];
  imageUrl?: string;
}

const MOCK_PLUGINS: Plugin[] = [
  {
    id: '1',
    name: 'LANDR Sampler',
    developer: 'LANDR',
    category: 'Samplers',
    type: 'instrument',
    description: 'Connect seamlessly to your sample libraries with randomization and smart search.',
    price: 0,
    rating: 4.8,
    downloads: 125000,
    isNew: false,
    isFeatured: true,
    isPro: false,
    tags: ['sampler', 'drums', 'loops']
  },
  {
    id: '2',
    name: 'LANDR Stems',
    developer: 'LANDR',
    category: 'Workflow',
    type: 'utility',
    description: 'Extract individual vocals, drums, bass with AudioShake\'s AI technology.',
    price: 0,
    rating: 4.9,
    downloads: 89000,
    isNew: true,
    isFeatured: true,
    isPro: true,
    tags: ['stems', 'separation', 'AI']
  },
  {
    id: '3',
    name: 'LANDR Mastering Plugin PRO',
    developer: 'LANDR',
    category: 'Mastering',
    type: 'effect',
    description: 'Pro-level AI mastering with fast revisions right in your DAW.',
    price: 0,
    rating: 4.7,
    downloads: 156000,
    isNew: false,
    isFeatured: true,
    isPro: true,
    tags: ['mastering', 'AI', 'loudness']
  },
  {
    id: '4',
    name: 'LANDR Composer',
    developer: 'LANDR',
    category: 'Synths',
    type: 'instrument',
    description: 'Generate unique AI-powered chord progressions, melodies, and basslines.',
    price: 0,
    rating: 4.6,
    downloads: 67000,
    isNew: true,
    isFeatured: true,
    isPro: true,
    tags: ['composition', 'AI', 'MIDI']
  },
  {
    id: '5',
    name: 'BlackQ3',
    developer: 'Tone Empire',
    category: 'EQs',
    type: 'effect',
    description: 'Vintage-style equalizer with warm analog character.',
    price: 4999,
    rating: 4.5,
    downloads: 23000,
    isNew: false,
    isFeatured: false,
    isPro: false,
    tags: ['EQ', 'analog', 'vintage']
  },
  {
    id: '6',
    name: 'LaCreme3',
    developer: 'Tone Empire',
    category: 'Dynamics',
    type: 'effect',
    description: 'Smooth, creamy compression for vocals and instruments.',
    price: 4999,
    rating: 4.4,
    downloads: 18000,
    isNew: false,
    isFeatured: false,
    isPro: false,
    tags: ['compressor', 'dynamics', 'smooth']
  },
  {
    id: '7',
    name: 'LANDR VoxTune',
    developer: 'LANDR',
    category: 'Vocal Processing',
    type: 'effect',
    description: 'Professional vocal tuning with natural-sounding pitch correction.',
    price: 0,
    rating: 4.6,
    downloads: 45000,
    isNew: false,
    isFeatured: false,
    isPro: true,
    tags: ['vocals', 'pitch', 'tuning']
  },
  {
    id: '8',
    name: 'U73b Compressor',
    developer: 'Audified',
    category: 'Dynamics',
    type: 'effect',
    description: 'Classic German broadcast compressor emulation.',
    price: 7999,
    rating: 4.7,
    downloads: 12000,
    isNew: false,
    isFeatured: false,
    isPro: false,
    tags: ['compressor', 'vintage', 'broadcast']
  },
  {
    id: '9',
    name: 'Log Drum Synth',
    developer: 'Aura',
    category: 'Synths',
    type: 'instrument',
    description: 'Authentic Amapiano log drum synthesis with regional presets.',
    price: 2999,
    rating: 4.9,
    downloads: 34000,
    isNew: true,
    isFeatured: true,
    isPro: false,
    tags: ['amapiano', 'log drums', 'synth']
  },
  {
    id: '10',
    name: 'Amapiano Keys',
    developer: 'Aura',
    category: 'Synths',
    type: 'instrument',
    description: 'Authentic piano and synth sounds for Amapiano production.',
    price: 1999,
    rating: 4.8,
    downloads: 28000,
    isNew: true,
    isFeatured: false,
    isPro: false,
    tags: ['amapiano', 'piano', 'keys']
  },
];

const CATEGORIES = [
  'All',
  'Effects',
  'Instruments',
  'Samplers',
  'Dynamics',
  'EQs',
  'Reverb',
  'Synths',
  'Mastering',
  'Vocal Processing',
  'Workflow'
];

const TYPES = ['All', 'Effects', 'Instruments', 'Utility'];

export function PluginBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [plugins] = useState<Plugin[]>(MOCK_PLUGINS);

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || plugin.category === selectedCategory;
    const matchesType = selectedType === 'All' || 
      (selectedType === 'Effects' && plugin.type === 'effect') ||
      (selectedType === 'Instruments' && plugin.type === 'instrument') ||
      (selectedType === 'Utility' && plugin.type === 'utility');
    const matchesNew = !showNewOnly || plugin.isNew;
    
    return matchesSearch && matchesCategory && matchesType && matchesNew;
  });

  const featuredPlugins = plugins.filter(p => p.isFeatured);

  const handleDownload = (plugin: Plugin) => {
    toast.success(`Downloading ${plugin.name}...`, {
      description: 'Plugin will be available in your DAW shortly.'
    });
  };

  const handlePreview = (plugin: Plugin) => {
    toast.info(`Playing ${plugin.name} demo...`);
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDownloads = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Synths': return <Piano className="w-4 h-4" />;
      case 'Dynamics': return <Waves className="w-4 h-4" />;
      case 'EQs': return <Volume2 className="w-4 h-4" />;
      case 'Vocal Processing': return <Mic className="w-4 h-4" />;
      case 'Mastering': return <Wand2 className="w-4 h-4" />;
      case 'Workflow': return <Zap className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Plugin Browser</CardTitle>
              <CardDescription>
                Effects, instruments & production tools
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {plugins.length} Plugins
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Featured Section */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Featured
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {featuredPlugins.slice(0, 4).map(plugin => (
              <Card 
                key={plugin.id} 
                className="min-w-[200px] bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(plugin.category)}
                    <span className="font-medium text-sm truncate">{plugin.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{plugin.developer}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={plugin.price === 0 ? 'default' : 'secondary'} className="text-xs">
                      {formatPrice(plugin.price)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs">{plugin.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins..."
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant={showNewOnly ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setShowNewOnly(!showNewOnly)}
          >
            New Only
          </Button>
        </div>

        {/* Plugin Grid */}
        <ScrollArea className="h-[400px]">
          <div className="grid gap-3 md:grid-cols-2">
            {filteredPlugins.map(plugin => (
              <Card key={plugin.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(plugin.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{plugin.name}</h4>
                        {plugin.isNew && (
                          <Badge className="text-xs bg-green-500/20 text-green-600">NEW</Badge>
                        )}
                        {plugin.isPro && (
                          <Badge variant="outline" className="text-xs">PRO</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{plugin.developer}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {plugin.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs gap-1">
                        {getCategoryIcon(plugin.category)}
                        {plugin.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Download className="w-3 h-3" />
                        {formatDownloads(plugin.downloads)}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {plugin.rating}
                      </div>
                    </div>
                    <Badge variant={plugin.price === 0 ? 'default' : 'outline'}>
                      {formatPrice(plugin.price)}
                    </Badge>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handlePreview(plugin)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownload(plugin)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      {plugin.price === 0 ? 'Install' : 'Buy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPlugins.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No plugins found matching your criteria</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
