import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileText, Users, MessageSquare, TrendingUp, Activity, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  submissionTrends: any[];
  reviewStats: any[];
  collaborationMetrics: any[];
  statusDistribution: any[];
}

export const PaperAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    submissionTrends: [],
    reviewStats: [],
    collaborationMetrics: [],
    statusDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch papers with submission trends
      const { data: papers } = await supabase
        .from('papers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*, papers!inner(user_id)')
        .eq('papers.user_id', user.id);

      // Fetch reviewers
      const { data: reviewers } = await supabase
        .from('reviewers')
        .select('*')
        .eq('user_id', user.id);

      // Process submission trends (by month)
      const submissionsByMonth: Record<string, number> = {};
      papers?.forEach(paper => {
        const month = new Date(paper.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        submissionsByMonth[month] = (submissionsByMonth[month] || 0) + 1;
      });

      const submissionTrends = Object.entries(submissionsByMonth).map(([month, count]) => ({
        month,
        submissions: count
      }));

      // Process review statistics
      const reviewsByStatus: Record<string, number> = {};
      reviews?.forEach(review => {
        reviewsByStatus[review.status] = (reviewsByStatus[review.status] || 0) + 1;
      });

      const reviewStats = Object.entries(reviewsByStatus).map(([status, count]) => ({
        status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count
      }));

      // Process collaboration metrics
      const collaborationMetrics = [
        { metric: "Total Papers", value: papers?.length || 0 },
        { metric: "Active Reviewers", value: reviewers?.length || 0 },
        { metric: "Total Reviews", value: reviews?.length || 0 },
        { metric: "Avg Reviews/Paper", value: papers?.length ? ((reviews?.length || 0) / papers.length).toFixed(1) : 0 }
      ];

      // Process status distribution
      const statusCount: Record<string, number> = {};
      papers?.forEach(paper => {
        statusCount[paper.status] = (statusCount[paper.status] || 0) + 1;
      });

      const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
      const statusDistribution = Object.entries(statusCount).map(([status, count], idx) => ({
        name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        fill: COLORS[idx % COLORS.length]
      }));

      setAnalytics({
        submissionTrends,
        reviewStats,
        collaborationMetrics,
        statusDistribution
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Activity className="w-8 h-8 animate-pulse text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Paper Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Visualize submission trends, review statistics, and collaboration metrics
            </p>
          </div>
        </div>

        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">
              <FileText className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <MessageSquare className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="collaboration">
              <Users className="w-4 h-4 mr-2" />
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="status">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4 mt-6">
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Submission Trends Over Time</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.submissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="submissions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-6">
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Review Statistics by Status</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.reviewStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="collaboration" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              {analytics.collaborationMetrics.map((metric, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.metric}</p>
                      <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                    </div>
                    <Activity className="w-8 h-8 text-primary opacity-50" />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4 mt-6">
            <Card className="p-4">
              <h4 className="font-semibold mb-4">Paper Status Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
