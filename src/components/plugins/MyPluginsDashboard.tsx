import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Download, Eye, Heart, Package, TrendingUp, Edit, Trash2, BarChart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Plugin {
  id: string;
  name: string;
  version: string;
  type: string;
  downloads: number;
  revenue: number;
  rating: number;
  status: 'draft' | 'published' | 'pending';
  lastUpdated: string;
}

export function MyPluginsDashboard() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPlugins([]);
        return;
      }

      // Query real marketplace items created by this user
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Plugin[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        version: '1.0.0',
        type: item.category,
        downloads: item.downloads || 0,
        revenue: item.price_cents * (item.downloads || 0),
        rating: item.rating || 0,
        status: item.active ? 'published' : 'draft',
        lastUpdated: item.updated_at,
      }));

      setPlugins(mapped);
    } catch (err) {
      console.error('Failed to load plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalDownloads = plugins.reduce((sum, p) => sum + p.downloads, 0);
  const totalRevenue = plugins.reduce((sum, p) => sum + p.revenue, 0);
  const avgRating = plugins.filter(p => p.rating > 0).reduce((sum, p) => sum + p.rating, 0) / plugins.filter(p => p.rating > 0).length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plugins</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plugins.length}</div>
            <p className="text-xs text-muted-foreground">
              {plugins.filter(p => p.status === 'published').length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              From {plugins.filter(p => p.rating > 0).length} plugins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plugins List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Plugins</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {plugins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No plugins yet</p>
                <p className="text-sm">Create your first plugin in the Marketplace</p>
              </CardContent>
            </Card>
          ) : (
            plugins.map(plugin => (
              <Card key={plugin.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {plugin.name}
                        <Badge variant={plugin.status === 'published' ? 'default' : 'secondary'}>
                          {plugin.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        v{plugin.version} • {plugin.type} • Updated {new Date(plugin.lastUpdated).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline"><BarChart className="h-4 w-4" /></Button>
                      <Button size="icon" variant="outline"><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="outline"><Code className="h-4 w-4" /></Button>
                      <Button size="icon" variant="destructive" className="opacity-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Downloads</div>
                      <div className="font-medium flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {plugin.downloads.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="font-medium">${(plugin.revenue / 100).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rating</div>
                      <div className="font-medium flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {plugin.rating || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Views</div>
                      <div className="font-medium flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        —
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {plugins.filter(p => p.status === 'published').length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No published plugins</CardContent></Card>
          ) : (
            plugins.filter(p => p.status === 'published').map(plugin => (
              <Card key={plugin.id}>
                <CardHeader>
                  <CardTitle>{plugin.name}</CardTitle>
                  <CardDescription>v{plugin.version} • {plugin.type}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {plugins.filter(p => p.status === 'draft').length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No drafts</CardContent></Card>
          ) : (
            plugins.filter(p => p.status === 'draft').map(plugin => (
              <Card key={plugin.id}>
                <CardHeader>
                  <CardTitle>{plugin.name}</CardTitle>
                  <CardDescription>v{plugin.version} • {plugin.type}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
