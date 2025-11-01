import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Download, Users, Eye, Star, Globe } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function SellerAnalytics() {
  const revenueData = [
    { month: 'Jan', revenue: 1200, downloads: 45 },
    { month: 'Feb', revenue: 1890, downloads: 67 },
    { month: 'Mar', revenue: 2340, downloads: 89 },
    { month: 'Apr', revenue: 1950, downloads: 72 },
    { month: 'May', revenue: 3200, downloads: 115 },
    { month: 'Jun', revenue: 4100, downloads: 142 },
  ];

  const pluginPerformance = [
    { name: 'Amapiano Synth Pro', downloads: 1247, revenue: 24940 },
    { name: 'Log Drum FX', downloads: 892, revenue: 17840 },
    { name: 'Piano Roll Delay', downloads: 634, revenue: 12680 },
    { name: '808 Bass Generator', downloads: 521, revenue: 10420 },
  ];

  const geographicData = [
    { country: 'USA', value: 35, color: '#0088FE' },
    { country: 'UK', value: 22, color: '#00C49F' },
    { country: 'Germany', value: 18, color: '#FFBB28' },
    { country: 'Japan', value: 12, color: '#FF8042' },
    { country: 'Others', value: 13, color: '#8884d8' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$14,420</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +32% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,294</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +18% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +0.3 from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,540</div>
            <div className="flex items-center gap-1 text-xs text-red-600">
              <TrendingDown className="h-3 w-3" />
              -5% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue & Downloads</TabsTrigger>
          <TabsTrigger value="plugins">Plugin Performance</TabsTrigger>
          <TabsTrigger value="geography">Geographic</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and download statistics</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="downloads" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Performance</CardTitle>
              <CardDescription>Revenue comparison by plugin</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pluginPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {pluginPerformance.map((plugin, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">{plugin.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Downloads</span>
                      <span className="font-medium">{plugin.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="font-medium">${(plugin.revenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Price</span>
                      <span className="font-medium">${(plugin.revenue / plugin.downloads / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Downloads by Country</CardTitle>
                <CardDescription>Geographic distribution of your customers</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={geographicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {geographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Revenue breakdown by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {geographicData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <Badge>{item.value}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Metrics</CardTitle>
              <CardDescription>Sales funnel analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Page Views</span>
                    <span className="font-medium">12,540</span>
                  </div>
                  <div className="w-full bg-secondary h-8 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Product Detail Views</span>
                    <span className="font-medium">4,215 (33.6%)</span>
                  </div>
                  <div className="w-full bg-secondary h-8 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: '33.6%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Add to Cart</span>
                    <span className="font-medium">1,687 (13.4%)</span>
                  </div>
                  <div className="w-full bg-secondary h-8 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600" style={{ width: '13.4%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Purchases</span>
                    <span className="font-medium">3,294 (26.3%)</span>
                  </div>
                  <div className="w-full bg-secondary h-8 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600" style={{ width: '26.3%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
