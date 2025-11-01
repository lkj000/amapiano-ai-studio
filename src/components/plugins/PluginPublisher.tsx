import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle, Zap, Package, Globe, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { PluginProject } from './PluginDevelopmentIDE';

interface PluginPublisherProps {
  project: PluginProject;
  wasmEngine: any;
}

export const PluginPublisher: React.FC<PluginPublisherProps> = ({
  project,
  wasmEngine
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishData, setPublishData] = useState({
    name: project.name,
    description: project.metadata.description,
    category: project.metadata.category,
    tags: project.metadata.tags.join(', '),
    price: 0,
    license: 'MIT',
    website: '',
    repository: ''
  });

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      // Simulate publishing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Plugin published successfully!', {
        description: 'Your plugin is now available in the marketplace'
      });
      
      // Here you would actually upload to marketplace
      console.log('Publishing plugin:', {
        ...publishData,
        binary: project.wasmBinary,
        wasmEnabled: wasmEngine.isInitialized
      });
      
    } catch (error: any) {
      toast.error('Publishing failed', {
        description: error.message
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish to Marketplace
            {wasmEngine.isInitialized && (
              <Badge variant="default" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                <Zap className="h-3 w-3 mr-1" />
                WASM
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plugin Info */}
          <div className="space-y-3">
            <div>
              <Label>Plugin Name *</Label>
              <Input
                value={publishData.name}
                onChange={(e) => setPublishData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Plugin"
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={publishData.description}
                onChange={(e) => setPublishData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your plugin does..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Select
                  value={publishData.category}
                  onValueChange={(value) => setPublishData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Synthesizers">Synthesizers</SelectItem>
                    <SelectItem value="Effects">Effects</SelectItem>
                    <SelectItem value="Dynamics">Dynamics</SelectItem>
                    <SelectItem value="Reverb">Reverb</SelectItem>
                    <SelectItem value="Delay">Delay</SelectItem>
                    <SelectItem value="Modulation">Modulation</SelectItem>
                    <SelectItem value="Utility">Utility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>License *</Label>
                <Select
                  value={publishData.license}
                  onValueChange={(value) => setPublishData(prev => ({ ...prev, license: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIT">MIT</SelectItem>
                    <SelectItem value="GPL-3.0">GPL 3.0</SelectItem>
                    <SelectItem value="Apache-2.0">Apache 2.0</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={publishData.tags}
                onChange={(e) => setPublishData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="reverb, space, vintage"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={publishData.price}
                    onChange={(e) => setPublishData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    placeholder="0"
                    className="pl-10"
                    min={0}
                    step={0.01}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Set to 0 for free plugins
                </p>
              </div>

              <div>
                <Label>Website (optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={publishData.website}
                    onChange={(e) => setPublishData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Repository (optional)</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={publishData.repository}
                  onChange={(e) => setPublishData(prev => ({ ...prev, repository: e.target.value }))}
                  placeholder="https://github.com/..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Plugin Stats */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Plugin Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="ml-2">{project.type}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Framework:</span>
                  <Badge variant="outline" className="ml-2">{project.framework.toUpperCase()}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Parameters:</span>
                  <span className="ml-2 font-medium">{project.parameters.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">WASM:</span>
                  <Badge variant={wasmEngine.isInitialized ? 'default' : 'outline'} className="ml-2">
                    {wasmEngine.isInitialized ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {project.wasmBinary && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Binary Size:</span>
                    <span className="ml-2 font-medium">
                      {(project.wasmBinary.byteLength / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publish Button */}
          <Button 
            onClick={handlePublish} 
            disabled={isPublishing || !publishData.name || !publishData.description}
            className="w-full"
            size="lg"
          >
            {isPublishing ? (
              <>Publishing...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publish to Marketplace
              </>
            )}
          </Button>

          {!project.compiled && (
            <div className="text-sm text-muted-foreground text-center">
              ⚠️ Plugin must be compiled before publishing
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
