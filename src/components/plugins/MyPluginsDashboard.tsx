import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Download, Eye, Heart, Package, TrendingUp, Edit, Trash2, BarChart } from 'lucide-react';

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
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const mockPlugins: Plugin[] = [
    {
      id: '1',
      name: 'Amapiano Synth Pro',
      version: '1.2.3',
      type: 'Instrument',
      downloads: 1247,
      revenue: 2494,
      rating: 4.8,
      status: 'published',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      name: 'Log Drum FX',
      version: '2.0.1',
      type: 'Effect',
      downloads: 892,
      revenue: 1784,
      rating: 4.6,
      status: 'published',
      lastUpdated: '2024-01-10'
    },
    {
      id: '3',
      name: 'Piano Roll Delay',
      version: '0.9.0',
      type: 'Effect',
      downloads: 0,
      revenue: 0,
      rating: 0,
      status: 'draft',
      lastUpdated: '2024-01-20'
    }
  ];

  const plugins = mockPlugins;

  const totalDownloads = plugins.reduce((sum, p) => sum + p.downloads, 0);
  const totalRevenue = plugins.reduce((sum, p) => sum + p.revenue, 0);
  const avgRating = plugins.filter(p => p.rating > 0).reduce((sum, p) => sum + p.rating, 0) / plugins.filter(p => p.rating > 0).length || 0;

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
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
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
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {plugins.map(plugin => (
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
                      v{plugin.version} • {plugin.type} • Updated {plugin.lastUpdated}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline">
                      <BarChart className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline">
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                      {(plugin.downloads * 3.2).toFixed(0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {plugins.filter(p => p.status === 'published').map(plugin => (
            <Card key={plugin.id}>
              <CardHeader>
                <CardTitle>{plugin.name}</CardTitle>
                <CardDescription>v{plugin.version} • {plugin.type}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {plugins.filter(p => p.status === 'draft').map(plugin => (
            <Card key={plugin.id}>
              <CardHeader>
                <CardTitle>{plugin.name}</CardTitle>
                <CardDescription>v{plugin.version} • {plugin.type}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Detailed performance metrics for your plugins</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
