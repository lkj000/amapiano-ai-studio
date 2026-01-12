/**
 * Plugin Browser Component
 * Real plugin marketplace with Supabase data
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search, 
  Download, 
  Star,
  Play,
  Wand2,
  Music,
  Volume2,
  Sparkles,
  Waves,
  Piano,
  Mic,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { usePluginMarketplace, MarketplacePlugin } from '@/hooks/usePluginMarketplace';

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

export function PluginBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { browsePlugins, purchasePlugin, loading } = usePluginMarketplace();

  // Load plugins on mount and when filters change
  useEffect(() => {
    loadPlugins();
  }, [selectedCategory, searchQuery]);

  const loadPlugins = async () => {
    setIsLoading(true);
    const data = await browsePlugins({
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      search: searchQuery || undefined,
      sortBy: 'popular'
    });
    setPlugins(data);
    setIsLoading(false);
  };

  const handleDownload = async (plugin: MarketplacePlugin) => {
    if (plugin.price_cents === 0) {
      toast.success(`Downloading ${plugin.name}...`, {
        description: 'Plugin will be available in your DAW shortly.'
      });
    } else {
      await purchasePlugin(plugin.id);
    }
  };

  const handlePreview = (plugin: MarketplacePlugin) => {
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
    switch (category?.toLowerCase()) {
      case 'synths': return <Piano className="w-4 h-4" />;
      case 'dynamics': return <Waves className="w-4 h-4" />;
      case 'eqs': return <Volume2 className="w-4 h-4" />;
      case 'vocal processing': return <Mic className="w-4 h-4" />;
      case 'mastering': return <Wand2 className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const featuredPlugins = plugins.filter(p => p.rating >= 4.5).slice(0, 4);

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
        {featuredPlugins.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Featured
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {featuredPlugins.map(plugin => (
                <Card 
                  key={plugin.id} 
                  className="min-w-[200px] bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(plugin.category)}
                      <span className="font-medium text-sm truncate">{plugin.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{plugin.seller_name}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={plugin.price_cents === 0 ? 'default' : 'secondary'} className="text-xs">
                        {formatPrice(plugin.price_cents)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs">{plugin.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Plugin Grid */}
        {!isLoading && (
          <ScrollArea className="h-[400px]">
            <div className="grid gap-3 md:grid-cols-2">
              {plugins.map(plugin => (
                <Card key={plugin.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(plugin.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{plugin.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{plugin.seller_name}</p>
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
                          {formatDownloads(plugin.downloads || 0)}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {plugin.rating?.toFixed(1) || 'N/A'}
                        </div>
                      </div>
                      <Badge variant={plugin.price_cents === 0 ? 'default' : 'outline'}>
                        {formatPrice(plugin.price_cents)}
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
                        disabled={loading}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {plugin.price_cents === 0 ? 'Install' : 'Buy'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {plugins.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No plugins found matching your criteria</p>
                <p className="text-sm">Try adjusting your filters or add plugins to the marketplace</p>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
