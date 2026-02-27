import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Download, Trash2, Settings, Star, 
  Package, Zap, Music, Sliders, Filter,
  RefreshCw, ExternalLink, Play, Pause,
  Volume2, MoreVertical, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { usePluginSystem } from '@/hooks/usePluginSystem';
import { supabase } from '@/integrations/supabase/client';
import type { PluginManifest, PluginInstance, PluginFilters } from '@/hooks/usePluginSystem';

interface PluginManagerPanelProps {
  audioContext: AudioContext | null;
  onClose: () => void;
}

interface PluginCard {
  plugin: PluginManifest;
  isInstalled: boolean;
  isLoading?: boolean;
}

export default function PluginManagerPanel({ 
  audioContext, 
  onClose 
}: PluginManagerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [marketplacePlugins, setMarketplacePlugins] = useState<PluginManifest[]>([]);
  const [activeTab, setActiveTab] = useState('installed');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  
  const {
    installedPlugins,
    pluginInstances,
    isLoading,
    createPluginInstance,
    removePluginInstance,
    updatePluginParameter,
    getTrackPlugins,
    searchMarketplace,
    installPlugin,
    getPlugin
  } = usePluginSystem(audioContext);

  // Load marketplace data
  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('active', true)
        .order('downloads', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: PluginManifest[] = data.map(item => ({
          id: item.id,
          name: item.name,
          version: '1.0.0',
          author: item.seller_id || 'Community',
          description: item.description || '',
          type: (item.subcategory === 'instrument' ? 'instrument' : 'effect') as 'instrument' | 'effect',
          category: item.category,
          tags: item.tags || [],
          icon: '🔌',
          audioInputs: 2,
          audioOutputs: 2,
          midiInputs: 0,
          midiOutputs: 0,
          parameters: [],
          presets: [],
          entryPoint: item.download_url || '',
          dependencies: [],
          minimumVersion: '1.0.0',
          license: 'Commercial',
          price: item.price_cents / 100,
          downloadCount: item.downloads || 0,
          rating: item.rating || 0,
          reviews: 0
        }));
        setMarketplacePlugins(mapped);
      }
    } catch (error) {
      console.error('Failed to load marketplace plugins:', error);
      setMarketplacePlugins([]);
    }
  };

  const categories = [
    'all', 'Dynamics', 'EQ', 'Reverb', 'Delay', 'Modulation', 
    'Synthesizers', 'Drums', 'Utility', 'Mastering'
  ];

  const getFilteredPlugins = (plugins: PluginManifest[]): PluginCard[] => {
    return plugins
      .filter(plugin => {
        const matchesSearch = searchQuery === '' || 
          plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
        const matchesType = selectedType === 'all' || plugin.type === selectedType;
        
        return matchesSearch && matchesCategory && matchesType;
      })
      .map(plugin => ({
        plugin,
        isInstalled: installedPlugins.some(installed => installed.id === plugin.id)
      }));
  };

  const handleInstallPlugin = async (plugin: PluginManifest) => {
    try {
      await installPlugin(plugin);
      toast.success(`Installed ${plugin.name}`);
    } catch (error) {
      toast.error(`Failed to install ${plugin.name}`);
    }
  };

  const handleUninstallPlugin = (pluginId: string) => {
    // In a real implementation, this would remove the plugin
    toast.success('Plugin uninstalled');
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-3 w-3 text-yellow-400" />);
    }
    
    return <div className="flex">{stars}</div>;
  };

  const renderPluginCard = ({ plugin, isInstalled, isLoading }: PluginCard) => (
    <Card key={plugin.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{plugin.icon || '🔌'}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{plugin.name}</h3>
                <p className="text-xs text-muted-foreground mb-1">by {plugin.author}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {plugin.description}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <Badge variant={plugin.type === 'instrument' ? 'default' : 'secondary'}>
                  {plugin.type}
                </Badge>
                <div className="text-xs font-medium">{formatPrice(plugin.price)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {renderStars(plugin.rating)}
              <span className="text-xs text-muted-foreground">
                ({plugin.reviews})
              </span>
              <span className="text-xs text-muted-foreground">
                {plugin.downloadCount.toLocaleString()} downloads
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {plugin.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                {isInstalled ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleUninstallPlugin(plugin.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Installed
                    </Badge>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handleInstallPlugin(plugin)}
                    disabled={isLoading}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Install
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const installedPluginCards = getFilteredPlugins(installedPlugins);
  const marketplacePluginCards = getFilteredPlugins(
    marketplacePlugins.filter(plugin => 
      !installedPlugins.some(installed => installed.id === plugin.id)
    )
  );

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Plugin Manager
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins..."
              className="pl-10"
            />
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="instrument">Instruments</SelectItem>
              <SelectItem value="effect">Effects</SelectItem>
              <SelectItem value="utility">Utilities</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plugin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Installed ({installedPlugins.length})
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Marketplace ({marketplacePlugins.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {installedPluginCards.length > 0 ? (
                  installedPluginCards.map(renderPluginCard)
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No plugins installed</h3>
                    <p className="text-muted-foreground mb-4">
                      Browse the marketplace to discover and install plugins
                    </p>
                    <Button onClick={() => setActiveTab('marketplace')}>
                      Browse Marketplace
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="marketplace" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                    <p>Loading plugins...</p>
                  </div>
                ) : marketplacePluginCards.length > 0 ? (
                  marketplacePluginCards.map(renderPluginCard)
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No plugins found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  );
}