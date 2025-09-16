import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Puzzle, 
  Download, 
  Star, 
  Code, 
  Zap, 
  Settings, 
  Play,
  Wrench,
  Music,
  BarChart3,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface PluginStoreProps {
  user: User | null;
}

interface WebPlugin {
  id: string;
  developer_id: string;
  name: string;
  plugin_type: 'instrument' | 'effect' | 'utility' | 'analyzer';
  plugin_code: string;
  manifest_data: any;
  version: string;
  is_approved: boolean;
  download_count: number;
  rating: number;
  created_at: string;
}

interface PluginInstallation {
  id: string;
  plugin_id: string;
  installation_config: any;
  is_active: boolean;
  installed_at: string;
}

export const PluginStore: React.FC<PluginStoreProps> = ({ user }) => {
  const [plugins, setPlugins] = useState<WebPlugin[]>([]);
  const [installations, setInstallations] = useState<PluginInstallation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [newPlugin, setNewPlugin] = useState({
    name: '',
    description: '',
    plugin_type: 'instrument' as const,
    features: '',
    code_preview: `// Aura Plugin Example
class AuraPlugin {
  constructor(context, config) {
    this.audioContext = context;
    this.config = config;
    this.initialized = false;
  }
  
  async initialize() {
    // Plugin initialization
    this.initialized = true;
    return true;
  }
  
  process(inputBuffer, outputBuffer, params) {
    // Audio processing logic
    return outputBuffer;
  }
  
  getParameters() {
    return [
      { id: 'gain', name: 'Gain', min: 0, max: 1, default: 0.5 },
      { id: 'frequency', name: 'Frequency', min: 20, max: 20000, default: 440 }
    ];
  }
}

// Export plugin
window.AuraPluginExports = { AuraPlugin };`
  });

  useEffect(() => {
    fetchPlugins();
    if (user) {
      fetchInstallations();
    }
  }, [user]);

  const fetchPlugins = async () => {
    try {
      const { data, error } = await supabase
        .from('web_plugins')
        .select('*')
        .eq('is_approved', true)
        .order('download_count', { ascending: false });

      if (error) throw error;
      setPlugins(data || []);
    } catch (error) {
      console.error('Error fetching plugins:', error);
    }
  };

  const fetchInstallations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_plugin_installations')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setInstallations(data || []);
    } catch (error) {
      console.error('Error fetching installations:', error);
    }
  };

  const installPlugin = async (plugin: WebPlugin) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_plugin_installations')
        .insert([{
          user_id: user.id,
          plugin_id: plugin.id,
          installation_config: {
            installed_at: new Date().toISOString(),
            version: plugin.version,
            settings: {}
          },
          is_active: true
        }]);

      if (error) throw error;

      // Update download count
      await supabase
        .from('web_plugins')
        .update({ download_count: plugin.download_count + 1 })
        .eq('id', plugin.id);

      await fetchInstallations();
      await fetchPlugins();

      toast({
        title: "Plugin Installed",
        description: `${plugin.name} is now available in your DAW`,
      });
    } catch (error) {
      console.error('Error installing plugin:', error);
      toast({
        title: "Installation Failed",
        description: "Failed to install plugin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlugin = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const manifest = {
        name: newPlugin.name,
        description: newPlugin.description,
        type: newPlugin.plugin_type,
        features: newPlugin.features.split(',').map(f => f.trim()),
        api_version: '1.0',
        author: user.email,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('web_plugins')
        .insert([{
          developer_id: user.id,
          name: newPlugin.name,
          plugin_type: newPlugin.plugin_type,
          plugin_code: newPlugin.code_preview,
          manifest_data: manifest,
          version: '1.0.0',
          is_approved: false // Requires approval
        }]);

      if (error) throw error;

      setNewPlugin({
        name: '',
        description: '',
        plugin_type: 'instrument',
        features: '',
        code_preview: `// Aura Plugin Example
class AuraPlugin {
  constructor(context, config) {
    this.audioContext = context;
    this.config = config;
    this.initialized = false;
  }
  
  async initialize() {
    // Plugin initialization
    this.initialized = true;
    return true;
  }
  
  process(inputBuffer, outputBuffer, params) {
    // Audio processing logic
    return outputBuffer;
  }
  
  getParameters() {
    return [
      { id: 'gain', name: 'Gain', min: 0, max: 1, default: 0.5 },
      { id: 'frequency', name: 'Frequency', min: 20, max: 20000, default: 440 }
    ];
  }
}

// Export plugin
window.AuraPluginExports = { AuraPlugin };`
      });
      setShowCreateForm(false);

      toast({
        title: "Plugin Submitted",
        description: "Your plugin has been submitted for review",
      });
    } catch (error) {
      console.error('Error creating plugin:', error);
      toast({
        title: "Error",
        description: "Failed to create plugin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isInstalled = (pluginId: string) => {
    return installations.some(i => i.plugin_id === pluginId && i.is_active);
  };

  const getPluginIcon = (type: string) => {
    switch (type) {
      case 'instrument': return Music;
      case 'effect': return Zap;
      case 'utility': return Wrench;
      case 'analyzer': return BarChart3;
      default: return Puzzle;
    }
  };

  // Sample plugins for demonstration
  const samplePlugins: WebPlugin[] = [
    {
      id: 'plugin-1',
      developer_id: 'dev-1',
      name: 'Amapiano Log Drum Synthesizer',
      plugin_type: 'instrument',
      plugin_code: '',
      manifest_data: {
        description: 'Authentic log drum sounds with customizable parameters',
        features: ['Multiple log drum samples', 'Pitch control', 'Envelope shaping', 'Cultural authenticity'],
        author: 'Aura Team',
        size: '2.3 MB'
      },
      version: '1.2.0',
      is_approved: true,
      download_count: 15420,
      rating: 4.8,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'plugin-2',
      developer_id: 'dev-2',
      name: 'South African Reverb',
      plugin_type: 'effect',
      plugin_code: '',
      manifest_data: {
        description: 'Captures the unique acoustic spaces of South African venues',
        features: ['Multiple venue IRs', 'Cultural spaces', 'Adjustable parameters', 'Authentic sound'],
        author: 'Studio Collective',
        size: '4.1 MB'
      },
      version: '2.0.1',
      is_approved: true,
      download_count: 8930,
      rating: 4.6,
      created_at: '2024-02-01T00:00:00Z'
    },
    {
      id: 'plugin-3',
      developer_id: 'dev-3',
      name: 'Pattern Analyzer Pro',
      plugin_type: 'analyzer',
      plugin_code: '',
      manifest_data: {
        description: 'Analyze and understand amapiano patterns in real-time',
        features: ['Real-time analysis', 'Pattern recognition', 'Cultural scoring', 'Educational insights'],
        author: 'Music AI Lab',
        size: '1.8 MB'
      },
      version: '1.0.3',
      is_approved: true,
      download_count: 5670,
      rating: 4.9,
      created_at: '2024-03-01T00:00:00Z'
    }
  ];

  const displayPlugins = plugins.length > 0 ? plugins : samplePlugins;
  const filteredPlugins = displayPlugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.manifest_data.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || plugin.plugin_type === selectedType;
    return matchesSearch && matchesType;
  });

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary" />
            Plugin Store
          </CardTitle>
          <CardDescription>
            Please sign in to access the plugin marketplace
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Puzzle className="w-8 h-8 text-primary" />
            Plugin Store
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Web-Native Extensions
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Extend your DAW with community-built plugins and tools
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plugin
        </Button>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="store">Plugin Store</TabsTrigger>
          <TabsTrigger value="installed">Installed ({installations.length})</TabsTrigger>
          <TabsTrigger value="develop">Developer Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search plugins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Types</option>
                  <option value="instrument">Instruments</option>
                  <option value="effect">Effects</option>
                  <option value="utility">Utilities</option>
                  <option value="analyzer">Analyzers</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Plugins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins.map((plugin) => {
              const IconComponent = getPluginIcon(plugin.plugin_type);
              return (
                <Card key={plugin.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <Badge variant="outline">{plugin.plugin_type}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{plugin.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{plugin.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {plugin.manifest_data.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {plugin.manifest_data.features?.slice(0, 3).map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{plugin.download_count.toLocaleString()} downloads</span>
                      <span>v{plugin.version}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      {isInstalled(plugin.id) ? (
                        <Button size="sm" disabled className="flex-1">
                          <Download className="w-3 h-3 mr-1" />
                          Installed
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => installPlugin(plugin)}
                          disabled={loading}
                          className="flex-1"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Install
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="installed" className="space-y-6">
          {installations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Puzzle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No plugins installed</h3>
                <p className="text-muted-foreground mb-4">
                  Browse the store to find and install plugins for your DAW
                </p>
                <Button onClick={() => {
                  const storeTab = document.querySelector('[value="store"]') as HTMLButtonElement;
                  storeTab?.click();
                }}>
                  Browse Plugin Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {installations.map((installation) => {
                const plugin = displayPlugins.find(p => p.id === installation.plugin_id);
                if (!plugin) return null;
                
                const IconComponent = getPluginIcon(plugin.plugin_type);
                return (
                  <Card key={installation.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-6 h-6 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <CardDescription>v{plugin.version} • Installed {new Date(installation.installed_at).toLocaleDateString()}</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Badge variant={installation.is_active ? "default" : "secondary"}>
                            {installation.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="develop" className="space-y-6">
          {/* Create Plugin Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Plugin</CardTitle>
                <CardDescription>
                  Develop web-native plugins for the Aura ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Plugin name"
                  value={newPlugin.name}
                  onChange={(e) => setNewPlugin({...newPlugin, name: e.target.value})}
                />
                <Textarea
                  placeholder="Plugin description"
                  value={newPlugin.description}
                  onChange={(e) => setNewPlugin({...newPlugin, description: e.target.value})}
                />
                <select
                  value={newPlugin.plugin_type}
                  onChange={(e) => setNewPlugin({...newPlugin, plugin_type: e.target.value as any})}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="instrument">Instrument</option>
                  <option value="effect">Effect</option>
                  <option value="utility">Utility</option>
                  <option value="analyzer">Analyzer</option>
                </select>
                <Input
                  placeholder="Features (comma separated)"
                  value={newPlugin.features}
                  onChange={(e) => setNewPlugin({...newPlugin, features: e.target.value})}
                />
                <div>
                  <label className="text-sm font-medium mb-2 block">Plugin Code</label>
                  <Textarea
                    value={newPlugin.code_preview}
                    onChange={(e) => setNewPlugin({...newPlugin, code_preview: e.target.value})}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={createPlugin} disabled={loading}>
                    <Code className="w-4 h-4 mr-2" />
                    Submit for Review
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Developer Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Developer Resources</CardTitle>
              <CardDescription>
                Tools and documentation for plugin development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col items-start">
                  <Code className="w-6 h-6 mb-2 text-primary" />
                  <div className="text-left">
                    <h4 className="font-semibold">API Documentation</h4>
                    <p className="text-sm text-muted-foreground">Complete plugin development guide</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col items-start">
                  <Puzzle className="w-6 h-6 mb-2 text-primary" />
                  <div className="text-left">
                    <h4 className="font-semibold">Sample Plugins</h4>
                    <p className="text-sm text-muted-foreground">Example implementations and templates</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};