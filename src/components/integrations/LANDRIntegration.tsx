/**
 * LANDR Integration Component
 * Manages LANDR Pro plugins, samples, and mastering tools
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  Key, 
  Music2, 
  Wand2, 
  Package,
  HardDrive,
  Monitor,
  Plug,
  Copy,
  Eye,
  EyeOff,
  Play,
  Settings2,
  FolderOpen,
  Library
} from 'lucide-react';
import { toast } from 'sonner';
import { LANDRSamplesBrowser } from './landr/LANDRSamplesBrowser';
import { LANDRMastering } from './landr/LANDRMastering';
import { LANDRLayers } from './landr/LANDRLayers';

interface LANDRPlugin {
  id: string;
  name: string;
  version: string;
  category: string;
  status: 'installed' | 'available' | 'downloading';
  licenseKey?: string;
  formats: string[];
  fileSize: string;
  compatibility: string;
  description: string;
  features: string[];
  downloadProgress?: number;
}

const defaultPlugins: LANDRPlugin[] = [
  {
    id: 'landr-mastering-pro',
    name: 'LANDR Mastering Plugin PRO',
    version: '1.1.35',
    category: 'Mastering',
    status: 'installed',
    licenseKey: 'E4DDE9-17EEF2-472D9C-CE8B47-3E349A-FB62A4',
    formats: ['AAX', 'VST3', 'AU'],
    fileSize: '566 MB',
    compatibility: 'macOS 10.14+ / Windows 10+ (64 bit)',
    description: 'AI mastering engine directly in your DAW for fast, pro-level masters.',
    features: [
      'Real-time AI mastering',
      '3 custom mastering styles (Warm, Balanced, Open)',
      'EQ control (High/Mid/Low)',
      'Presence control',
      'De-Esser',
      'Stereo Field adjustment',
      'Compression control',
      'Saturation',
      'LUFS Meter',
      'Gain Match & Bypass'
    ]
  },
  {
    id: 'chromatic',
    name: 'Chromatic',
    version: '1.0.0',
    category: 'Instrument',
    status: 'available',
    formats: ['VST3', 'AU'],
    fileSize: '1.2 GB',
    compatibility: 'macOS 10.14+ / Windows 10+ (64 bit)',
    description: 'Loop-based, playable instrument plugin with unlimited access for Samples and Studio subscribers.',
    features: [
      'Loop-based playable instrument',
      'Creative territory exploration',
      'Integrated with LANDR samples',
      'Real-time manipulation'
    ]
  }
];

export const LANDRIntegration: React.FC = () => {
  const [plugins, setPlugins] = useState<LANDRPlugin[]>(defaultPlugins);
  const [showLicenseKey, setShowLicenseKey] = useState<Record<string, boolean>>({});
  const [selectedPlugin, setSelectedPlugin] = useState<LANDRPlugin | null>(plugins[0]);
  const [dawPath, setDawPath] = useState('/Library/Audio/Plug-Ins/VST3');

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('License key copied to clipboard!');
  };

  const toggleLicenseVisibility = (pluginId: string) => {
    setShowLicenseKey(prev => ({ ...prev, [pluginId]: !prev[pluginId] }));
  };

  const openInDAW = (plugin: LANDRPlugin) => {
    toast.success(`Opening ${plugin.name} in DAW...`, {
      description: 'Plugin will appear on your master track'
    });
  };

  const downloadPlugin = (plugin: LANDRPlugin) => {
    setPlugins(prev => prev.map(p => 
      p.id === plugin.id ? { ...p, status: 'downloading' as const, downloadProgress: 0 } : p
    ));
    
    const interval = setInterval(() => {
      setPlugins(prev => prev.map(p => {
        if (p.id === plugin.id && p.status === 'downloading') {
          const newProgress = (p.downloadProgress || 0) + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            toast.success(`${plugin.name} downloaded successfully!`);
            return { ...p, status: 'installed' as const, downloadProgress: 100 };
          }
          return { ...p, downloadProgress: newProgress };
        }
        return p;
      }));
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            LANDR Integration
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your LANDR Pro plugins, samples, and mastering tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.landr.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              LANDR Website
            </a>
          </Button>
          <Button size="sm">
            <Package className="w-4 h-4 mr-2" />
            Sync Library
          </Button>
        </div>
      </div>

      <Tabs defaultValue="samples" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="samples" className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            Samples
          </TabsTrigger>
          <TabsTrigger value="layers" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="plugins" className="flex items-center gap-2">
            <Plug className="w-4 h-4" />
            Plugins
          </TabsTrigger>
          <TabsTrigger value="mastering" className="flex items-center gap-2">
            <Music2 className="w-4 h-4" />
            Mastering
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Samples Tab */}
        <TabsContent value="samples" className="space-y-4">
          <LANDRSamplesBrowser />
        </TabsContent>

        {/* Layers Tab */}
        <TabsContent value="layers" className="space-y-4">
          <LANDRLayers />
        </TabsContent>

        {/* Plugins Tab */}
        <TabsContent value="plugins" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Plugin List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Plugins</CardTitle>
                  <CardDescription>Your LANDR plugin library</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {plugins.map((plugin) => (
                        <div
                          key={plugin.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedPlugin?.id === plugin.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPlugin(plugin)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{plugin.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                v{plugin.version} • {plugin.fileSize}
                              </p>
                            </div>
                            {plugin.status === 'installed' && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Installed
                              </Badge>
                            )}
                            {plugin.status === 'available' && (
                              <Badge variant="secondary" className="text-xs">
                                Available
                              </Badge>
                            )}
                            {plugin.status === 'downloading' && (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-xs">
                                {plugin.downloadProgress}%
                              </Badge>
                            )}
                          </div>
                          {plugin.status === 'downloading' && (
                            <Progress value={plugin.downloadProgress} className="h-1 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Plugin Details */}
            <div className="lg:col-span-2">
              {selectedPlugin ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="mb-2">{selectedPlugin.category}</Badge>
                        <CardTitle className="text-xl">{selectedPlugin.name}</CardTitle>
                        <CardDescription className="mt-1">
                          Version {selectedPlugin.version} • {selectedPlugin.fileSize}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {selectedPlugin.status === 'installed' ? (
                          <Button onClick={() => openInDAW(selectedPlugin)}>
                            <Play className="w-4 h-4 mr-2" />
                            Open in DAW
                          </Button>
                        ) : selectedPlugin.status === 'available' ? (
                          <Button onClick={() => downloadPlugin(selectedPlugin)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-muted-foreground text-sm">
                        {selectedPlugin.description}
                      </p>
                    </div>

                    <Separator />

                    {selectedPlugin.licenseKey && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          License Key
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 font-mono text-sm bg-muted p-3 rounded-lg">
                            {showLicenseKey[selectedPlugin.id] 
                              ? selectedPlugin.licenseKey 
                              : '••••••-••••••-••••••-••••••-••••••-••••••'}
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => toggleLicenseVisibility(selectedPlugin.id)}
                          >
                            {showLicenseKey[selectedPlugin.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyLicenseKey(selectedPlugin.licenseKey!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedPlugin.licenseKey && <Separator />}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Compatibility
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedPlugin.compatibility}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <HardDrive className="w-4 h-4" />
                          Formats
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlugin.formats.map(format => (
                            <Badge key={format} variant="outline">{format}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">Features</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {selectedPlugin.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedPlugin.status === 'installed' && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-3">Installation Instructions</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Download the installer</li>
                            <li>Locate the installer in your downloads and run the installation wizard</li>
                            <li>Once installed, restart your DAW or rescan your plugins folder</li>
                            <li>Locate the plugin within the LANDR folder in your DAW</li>
                            <li>Add the plugin to your master track</li>
                            <li>Enter the license key found above</li>
                            <li>Start Mastering!</li>
                          </ol>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground p-8">
                    <Plug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a plugin to view details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Mastering Tab */}
        <TabsContent value="mastering" className="space-y-4">
          <LANDRMastering />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plugin Paths</CardTitle>
                <CardDescription>
                  Configure where plugins are installed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>VST3 Plugin Path</Label>
                  <div className="flex gap-2">
                    <Input value={dawPath} onChange={(e) => setDawPath(e.target.value)} />
                    <Button variant="outline" size="icon">
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>AU Plugin Path (macOS)</Label>
                  <div className="flex gap-2">
                    <Input value="/Library/Audio/Plug-Ins/Components" readOnly />
                    <Button variant="outline" size="icon">
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>AAX Plugin Path</Label>
                  <div className="flex gap-2">
                    <Input value="/Library/Application Support/Avid/Audio/Plug-Ins" readOnly />
                    <Button variant="outline" size="icon">
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LANDR Account</CardTitle>
                <CardDescription>
                  Manage your LANDR subscription and licenses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">LANDR Pro</p>
                      <p className="text-xs text-muted-foreground">Active Subscription</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mastering Credits</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sample Downloads</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plugin Access</span>
                      <span className="font-medium">Full Suite</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a href="https://www.landr.com/account" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage LANDR Account
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LANDRIntegration;
