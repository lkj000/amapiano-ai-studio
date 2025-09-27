import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, Star, Download, Search, Filter, Grid, List, ExternalLink, 
  Settings, Play, Pause, RotateCcw, Save, Trash2, X, Volume2,
  Activity, TrendingUp, Users, Clock, HardDrive, Cpu
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useVSTPluginSystem } from '@/hooks/useVSTPluginSystem';
import type { VSTPluginManifest, VSTPluginInstance, VSTParameter } from '@/hooks/useVSTPluginSystem';

interface VSTPluginPanelProps {
  audioContext: AudioContext | null;
  trackId?: string;
  onClose: () => void;
  vstPluginSystem?: ReturnType<typeof useVSTPluginSystem>;
}

export default function VSTPluginPanel({ 
  audioContext, 
  trackId, 
  onClose, 
  vstPluginSystem: externalVstSystem 
}: VSTPluginPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVendor, setSelectedVendor] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedInstance, setSelectedInstance] = useState<VSTPluginInstance | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Use external VST system if provided, otherwise create internal one  
  const internalVstSystem = useVSTPluginSystem(audioContext);
  const vstSystem = externalVstSystem || internalVstSystem;

  const {
    availablePlugins,
    installedPlugins,
    pluginInstances,
    store,
    isLoading,
    scanForVSTPlugins,
    createVSTInstance,
    removeVSTInstance,
    updateVSTParameter,
    loadVSTPreset,
    getTrackVSTPlugins,
    downloadPlugin,
    getVSTPlugin
  } = vstSystem;

  const [activeTab, setActiveTab] = useState('marketplace');

  // Get current track plugins
  const trackPlugins = trackId ? getTrackVSTPlugins(trackId) : [];

  useEffect(() => {
    if (trackPlugins.length > 0 && !selectedInstance) {
      setSelectedInstance(trackPlugins[0]);
    }
  }, [trackPlugins, selectedInstance]);

  const filteredPlugins = availablePlugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || plugin.category === selectedCategory;
    const matchesVendor = selectedVendor === 'All' || plugin.vendor === selectedVendor;
    
    return matchesSearch && matchesCategory && matchesVendor;
  });

  const handleScanPlugins = async () => {
    setIsScanning(true);
    await scanForVSTPlugins();
    setIsScanning(false);
  };

  const handleInstallPlugin = async (plugin: VSTPluginManifest) => {
    if (!trackId) {
      toast.error('Select a track first');
      return;
    }
    
    const instanceId = await createVSTInstance(plugin.id, trackId);
    if (instanceId) {
      toast.success(`${plugin.name} loaded on track`);
      setActiveTab('instances');
    }
  };

  const handleDownloadPlugin = async (plugin: VSTPluginManifest) => {
    await downloadPlugin(plugin.id);
  };

  const handleRemoveInstance = (instanceId: string) => {
    const success = removeVSTInstance(instanceId);
    if (success) {
      if (selectedInstance?.id === instanceId) {
        setSelectedInstance(null);
      }
      toast.success('Plugin removed');
    }
  };

  const renderParameter = (param: VSTParameter, instance: VSTPluginInstance) => {
    const currentValue = instance.parameters[param.id];
    
    const handleChange = (value: any) => {
      updateVSTParameter(instance.id, param.id, value);
    };

    switch (param.type) {
      case 'float':
      case 'int':
        return (
          <div key={param.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{param.label}</label>
              <span className="text-xs text-muted-foreground">
                {param.displayFormat === 'percentage' && `${Math.round(currentValue)}%`}
                {param.displayFormat === 'db' && `${currentValue.toFixed(1)} dB`}
                {param.displayFormat === 'hz' && `${Math.round(currentValue)} Hz`}
                {param.displayFormat === 'seconds' && `${currentValue.toFixed(2)}s`}
                {(!param.displayFormat || param.displayFormat === 'raw') && currentValue.toFixed(2)}
                {param.unit && ` ${param.unit}`}
              </span>
            </div>
            <Slider
              value={[currentValue]}
              onValueChange={([value]) => handleChange(value)}
              min={param.min || 0}
              max={param.max || 100}
              step={param.type === 'int' ? 1 : 0.01}
              className="w-full"
            />
          </div>
        );
      
      case 'bool':
        return (
          <div key={param.id} className="flex items-center justify-between">
            <label className="text-sm font-medium">{param.label}</label>
            <Switch
              checked={currentValue}
              onCheckedChange={handleChange}
            />
          </div>
        );
      
      case 'enum':
        return (
          <div key={param.id} className="space-y-2">
            <label className="text-sm font-medium">{param.label}</label>
            <Select value={currentValue} onValueChange={handleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'string':
        return (
          <div key={param.id} className="space-y-2">
            <label className="text-sm font-medium">{param.label}</label>
            <Input
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={param.label}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderPluginCard = (plugin: VSTPluginManifest, isInstalled = false) => {
    if (viewMode === 'list') {
      return (
        <Card key={plugin.id} className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                  plugin.format === 'instrument' 
                    ? 'from-purple-500 to-pink-500' 
                    : 'from-blue-500 to-cyan-500'
                } flex items-center justify-center`}>
                  {plugin.format === 'instrument' ? 
                    <Activity className="w-6 h-6 text-white" /> :
                    <Volume2 className="w-6 h-6 text-white" />
                  }
                </div>
                <div>
                  <h4 className="font-semibold">{plugin.name}</h4>
                  <p className="text-sm text-muted-foreground">{plugin.vendor}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{plugin.type}</Badge>
                    <Badge variant="outline">{plugin.category}</Badge>
                    {plugin.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{plugin.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {!isInstalled && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDownloadPlugin(plugin)}
                      disabled={isLoading}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {plugin.price ? `$${plugin.price}` : 'Free'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {trackId && (
                  <Button 
                    size="sm" 
                    onClick={() => handleInstallPlugin(plugin)}
                    disabled={isLoading}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Load
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Grid view
    return (
      <Card key={plugin.id} className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-4">
          <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${
            plugin.format === 'instrument' 
              ? 'from-purple-500 to-pink-500' 
              : 'from-blue-500 to-cyan-500'
          } flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
            {plugin.format === 'instrument' ? 
              <Activity className="w-12 h-12 text-white" /> :
              <Volume2 className="w-12 h-12 text-white" />
            }
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold line-clamp-1">{plugin.name}</h4>
            <p className="text-sm text-muted-foreground">{plugin.vendor}</p>
            
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant="outline" className="text-xs">{plugin.type}</Badge>
              <Badge variant="outline" className="text-xs">{plugin.category}</Badge>
            </div>
            
            {plugin.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{plugin.rating}</span>
                </div>
                {plugin.downloads && (
                  <span className="text-xs text-muted-foreground">
                    {(plugin.downloads / 1000000).toFixed(1)}M downloads
                  </span>
                )}
              </div>
            )}
            
            <div className="flex gap-1 pt-2">
              {!isInstalled && (
                <Button 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => handleDownloadPlugin(plugin)}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {plugin.price ? `$${plugin.price}` : 'Free'}
                </Button>
              )}
              {trackId && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleInstallPlugin(plugin)}
                  disabled={isLoading}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Load
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">VST/AU Plugin Manager</CardTitle>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              Professional Edition
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b p-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                <TabsTrigger value="installed">Installed ({installedPlugins.length})</TabsTrigger>
                <TabsTrigger value="instances">Instances ({trackPlugins.length})</TabsTrigger>
                <TabsTrigger value="scan">Scan</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 flex">
              <div className={`${selectedInstance ? 'flex-1' : 'w-full'} flex flex-col`}>
                <TabsContent value="marketplace" className="flex-1 m-0">
                  {/* Search and Filters */}
                  <div className="p-4 border-b space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search plugins..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Categories</SelectItem>
                          {store?.categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Vendors</SelectItem>
                          {store?.vendors.map(vendor => (
                            <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Button 
                          variant={viewMode === 'grid' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant={viewMode === 'list' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                  </div>

                  {/* Track selection hint */}
                  {!trackId && (
                    <div className="px-4 pt-2">
                      <Alert>
                        <AlertDescription>
                          Select a track in the DAW timeline to enable "Load" buttons.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  </div>

                  {/* Plugin Grid */}
                  <ScrollArea className="flex-1 p-4">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredPlugins.map(plugin => renderPluginCard(plugin, false))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredPlugins.map(plugin => renderPluginCard(plugin, false))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="installed" className="flex-1 m-0">
                  <ScrollArea className="flex-1 p-4">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {installedPlugins.map(plugin => renderPluginCard(plugin, true))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {installedPlugins.map(plugin => renderPluginCard(plugin, true))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="instances" className="flex-1 m-0">
                  <ScrollArea className="flex-1 p-4">
                    {!trackId ? (
                      <div className="text-center py-12">
                        <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No track selected</h3>
                        <p className="text-muted-foreground">Select a track in the DAW to view and manage its plugin instances</p>
                      </div>
                    ) : trackPlugins.length === 0 ? (
                      <div className="text-center py-12">
                        <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No plugins loaded</h3>
                        <p className="text-muted-foreground">Load some plugins to start making music</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {trackPlugins.map(instance => {
                          const plugin = getVSTPlugin(instance.pluginId);
                          return (
                            <Card key={instance.id} className={`cursor-pointer transition-all ${
                              selectedInstance?.id === instance.id ? 'ring-2 ring-primary' : ''
                            }`} onClick={() => setSelectedInstance(instance)}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                                      plugin?.format === 'instrument' 
                                        ? 'from-purple-500 to-pink-500' 
                                        : 'from-blue-500 to-cyan-500'
                                    } flex items-center justify-center`}>
                                      {plugin?.format === 'instrument' ? 
                                        <Activity className="w-5 h-5 text-white" /> :
                                        <Volume2 className="w-5 h-5 text-white" />
                                      }
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{instance.name}</h4>
                                      <p className="text-sm text-muted-foreground">{plugin?.vendor}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={instance.isActive ? 'default' : 'secondary'}>
                                      {instance.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveInstance(instance.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="scan" className="flex-1 m-0">
                  <div className="p-6 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Cpu className="w-5 h-5" />
                          Plugin Scanner
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Scan your system for installed VST/AU plugins. This will search common plugin directories
                          and register any compatible plugins found.
                        </p>
                        
                        {isScanning && (
                          <div className="space-y-2">
                            <Progress value={65} className="w-full" />
                            <p className="text-sm text-center">Scanning plugin directories...</p>
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleScanPlugins}
                          disabled={isScanning || isLoading}
                          className="w-full"
                        >
                          {isScanning ? (
                            <>
                              <Cpu className="w-4 h-4 mr-2 animate-spin" />
                              Scanning...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Scan for Plugins
                            </>
                          )}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{installedPlugins.length}</div>
                            <div className="text-sm text-muted-foreground">Installed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{trackPlugins.length}</div>
                            <div className="text-sm text-muted-foreground">Active</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>

              {/* Plugin Instance Panel */}
              {selectedInstance && (
                <Card className="w-80 border-l border-t-0 border-b-0 border-r-0 rounded-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{selectedInstance.name}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedInstance(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {getVSTPlugin(selectedInstance.pluginId)?.parameters.map(param => 
                          renderParameter(param, selectedInstance)
                        )}
                      </div>
                    </ScrollArea>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}