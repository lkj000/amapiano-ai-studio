import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Plus, X, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  name: string;
  price: number;
  type: string;
}

export function PluginBundleCreator() {
  const [bundleName, setBundleName] = useState('');
  const [description, setDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);

  const availablePlugins: Plugin[] = [
    { id: '1', name: 'Amapiano Synth Pro', price: 1999, type: 'Instrument' },
    { id: '2', name: 'Log Drum FX', price: 999, type: 'Effect' },
    { id: '3', name: 'Piano Roll Delay', price: 799, type: 'Effect' },
    { id: '4', name: 'VAST Compressor', price: 1499, type: 'Effect' },
    { id: '5', name: '808 Bass Generator', price: 1299, type: 'Instrument' },
  ];

  const togglePlugin = (id: string) => {
    setSelectedPlugins(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const totalIndividualPrice = selectedPlugins.reduce((sum, id) => {
    const plugin = availablePlugins.find(p => p.id === id);
    return sum + (plugin?.price || 0);
  }, 0);

  const discount = bundlePrice ? ((totalIndividualPrice - parseFloat(bundlePrice) * 100) / totalIndividualPrice * 100).toFixed(0) : '0';

  const handleCreateBundle = () => {
    if (!bundleName || selectedPlugins.length < 2) {
      toast.error('Bundle must have a name and at least 2 plugins');
      return;
    }

    toast.success('Bundle created successfully!');
    // Reset form
    setBundleName('');
    setDescription('');
    setBundlePrice('');
    setSelectedPlugins([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Plugin Bundle
          </CardTitle>
          <CardDescription>
            Bundle multiple plugins together at a discounted price to increase sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bundle Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bundle-name">Bundle Name</Label>
              <Input
                id="bundle-name"
                placeholder="Amapiano Production Suite"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle-desc">Description</Label>
              <Textarea
                id="bundle-desc"
                placeholder="Everything you need for professional Amapiano production..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle-price">Bundle Price ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bundle-price"
                  type="number"
                  placeholder="29.99"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Plugin Selection */}
          <div className="space-y-3">
            <Label>Select Plugins ({selectedPlugins.length} selected)</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availablePlugins.map(plugin => (
                <Card key={plugin.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedPlugins.includes(plugin.id)}
                        onCheckedChange={() => togglePlugin(plugin.id)}
                      />
                      <div>
                        <div className="font-medium">{plugin.name}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(plugin.price / 100).toFixed(2)} • {plugin.type}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{plugin.type}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          {selectedPlugins.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Individual Price Total:</span>
                    <span className="line-through text-muted-foreground">
                      ${(totalIndividualPrice / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Bundle Price:</span>
                    <span className="text-primary">
                      ${bundlePrice || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm">Customer Saves:</span>
                    <Badge variant="default" className="bg-green-600">
                      {discount}% OFF
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateBundle} 
              className="flex-1"
              disabled={selectedPlugins.length < 2 || !bundleName}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
            <Button variant="outline" onClick={() => {
              setBundleName('');
              setDescription('');
              setBundlePrice('');
              setSelectedPlugins([]);
            }}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Bundles */}
      <Card>
        <CardHeader>
          <CardTitle>Active Bundles</CardTitle>
          <CardDescription>Your currently published plugin bundles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Card className="p-4 border-primary/30">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="font-medium">Complete Production Bundle</div>
                  <div className="text-sm text-muted-foreground">5 plugins • 45% savings</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">142 sales</Badge>
                    <Badge variant="outline">$4,260 revenue</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">$49.99</div>
                  <div className="text-xs text-muted-foreground line-through">$89.99</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 opacity-50">
              <div className="text-center text-sm text-muted-foreground py-4">
                Create your first bundle to boost sales
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
