import { useState, useEffect } from 'react';
import { usePluginMarketplace, MarketplacePlugin } from '@/hooks/usePluginMarketplace';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Star, Download, ShoppingCart, Filter } from 'lucide-react';
import { PluginDetailsDialog } from './PluginDetailsDialog';

export const PluginMarketplace = () => {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<MarketplacePlugin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'price'>('popular');
  const { loading, browsePlugins, purchasePlugin } = usePluginMarketplace();

  useEffect(() => {
    loadPlugins();
  }, [categoryFilter, sortBy]);

  const loadPlugins = async () => {
    const filters = {
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchQuery || undefined,
      sortBy
    };
    const data = await browsePlugins(filters);
    setPlugins(data);
  };

  const handleSearch = () => {
    loadPlugins();
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Dynamics', label: 'Dynamics' },
    { value: 'EQ', label: 'EQ' },
    { value: 'Reverb', label: 'Reverb' },
    { value: 'Delay', label: 'Delay' },
    { value: 'Modulation', label: 'Modulation' },
    { value: 'Distortion', label: 'Distortion' },
    { value: 'Utility', label: 'Utility' },
    { value: 'Synth', label: 'Synth' }
  ];

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Plugin Marketplace</h2>
            <p className="text-muted-foreground">Discover and purchase professional audio plugins</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price">Lowest Price</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>
            <Filter className="mr-2 h-4 w-4" />
            Apply
          </Button>
        </div>
      </div>

      {/* Plugin Grid */}
      <ScrollArea className="h-[600px]">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading plugins...</p>
          </div>
        ) : plugins.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No plugins found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plugins.map(plugin => (
              <Card key={plugin.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">{plugin.name}</CardTitle>
                      <CardDescription className="line-clamp-1">by {plugin.seller_name}</CardDescription>
                    </div>
                    <Badge variant="outline">{plugin.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {plugin.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{plugin.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{plugin.downloads}</span>
                    </div>
                  </div>
                  {plugin.tags && plugin.tags.length > 0 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {plugin.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-xl font-bold">{formatPrice(plugin.price_cents)}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPlugin(plugin)}>
                      Details
                    </Button>
                    <Button size="sm" onClick={() => purchasePlugin(plugin.id)}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Plugin Details Dialog */}
      {selectedPlugin && (
        <PluginDetailsDialog
          plugin={selectedPlugin}
          open={!!selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onPurchase={() => purchasePlugin(selectedPlugin.id)}
        />
      )}
    </div>
  );
};
