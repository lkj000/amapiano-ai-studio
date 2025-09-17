import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Heart, Play, MessageCircle, Repeat2 } from 'lucide-react';

interface EngagementMetrics {
  totalPlays: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementRate: number;
  trendinessScore: number;
  activeUsers: number;
}

interface EngagementAnalyticsProps {
  userId?: string;
  postId?: string;
  timeframe?: '1h' | '24h' | '7d' | '30d';
}

export const EngagementAnalytics: React.FC<EngagementAnalyticsProps> = ({
  userId,
  postId,
  timeframe = '24h'
}) => {
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    totalPlays: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    engagementRate: 0,
    trendinessScore: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);

  useEffect(() => {
    fetchEngagementMetrics();
    
    // Set up real-time updates
    const channel = supabase
      .channel('engagement-analytics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        () => {
          setRealTimeUpdates(prev => prev + 1);
          fetchEngagementMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, postId, timeframe]);

  const fetchEngagementMetrics = async () => {
    try {
      setLoading(true);
      
      const timeframeHours = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
      }[timeframe];

      // Fetch engagement data
      const { data: analyticsData, error } = await supabase
        .from('analytics_events')
        .select('event_type, event_data, created_at')
        .gte('created_at', new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString())
        .eq(postId ? 'post_id' : 'user_id', postId || userId);

      if (error) throw error;

      // Calculate metrics
      const plays = analyticsData?.filter(e => e.event_type === 'play').length || 0;
      const likes = analyticsData?.filter(e => e.event_type === 'like').length || 0;
      const comments = analyticsData?.filter(e => e.event_type === 'comment').length || 0;
      const shares = analyticsData?.filter(e => e.event_type === 'share').length || 0;
      
      const totalInteractions = plays + likes + comments + shares;
      const uniqueUsers = new Set(analyticsData?.map(e => {
        const eventData = e.event_data as any;
        return eventData?.user_id;
      }).filter(Boolean)).size;
      
      const engagementRate = uniqueUsers > 0 ? (totalInteractions / uniqueUsers) * 100 : 0;
      const trendinessScore = calculateTrendinessScore(analyticsData || []);

      setMetrics({
        totalPlays: plays,
        totalLikes: likes,
        totalComments: comments,
        totalShares: shares,
        engagementRate,
        trendinessScore,
        activeUsers: uniqueUsers
      });

    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrendinessScore = (data: any[]): number => {
    if (!data.length) return 0;
    
    const now = Date.now();
    const recentWeight = 2;
    const baseWeight = 1;
    
    const score = data.reduce((acc, event) => {
      const eventTime = new Date(event.created_at).getTime();
      const hoursSinceEvent = (now - eventTime) / (1000 * 60 * 60);
      
      // Recent events get more weight
      const weight = hoursSinceEvent < 1 ? recentWeight : baseWeight;
      const eventScore = {
        'play': 1,
        'like': 2,
        'comment': 3,
        'share': 2,
        'remix': 4
      }[event.event_type] || 1;
      
      return acc + (eventScore * weight);
    }, 0);
    
    return Math.min(score / 10, 100); // Normalize to 0-100
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendingLevel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Viral', color: 'bg-red-500' };
    if (score >= 60) return { label: 'Hot', color: 'bg-orange-500' };
    if (score >= 40) return { label: 'Trending', color: 'bg-yellow-500' };
    if (score >= 20) return { label: 'Rising', color: 'bg-green-500' };
    return { label: 'Stable', color: 'bg-blue-500' };
  };

  const trendingLevel = getTrendingLevel(metrics.trendinessScore);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Analytics
          </div>
          <Badge className={`${trendingLevel.color} text-white`}>
            {trendingLevel.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trending Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Trending Score</span>
            <span className="text-sm text-muted-foreground">
              {metrics.trendinessScore.toFixed(1)}/100
            </span>
          </div>
          <Progress value={metrics.trendinessScore} className="h-2" />
        </div>

        {/* Engagement Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Engagement Rate</span>
            <span className="text-sm text-muted-foreground">
              {metrics.engagementRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(metrics.engagementRate, 100)} className="h-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Play className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm font-medium">{formatNumber(metrics.totalPlays)}</div>
              <div className="text-xs text-muted-foreground">Plays</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Heart className="w-4 h-4 text-red-500" />
            <div>
              <div className="text-sm font-medium">{formatNumber(metrics.totalLikes)}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-sm font-medium">{formatNumber(metrics.totalComments)}</div>
              <div className="text-xs text-muted-foreground">Comments</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Repeat2 className="w-4 h-4 text-green-500" />
            <div>
              <div className="text-sm font-medium">{formatNumber(metrics.totalShares)}</div>
              <div className="text-xs text-muted-foreground">Shares</div>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Active Users</span>
          </div>
          <span className="text-sm font-bold">{formatNumber(metrics.activeUsers)}</span>
        </div>

        {realTimeUpdates > 0 && (
          <div className="text-xs text-center text-muted-foreground">
            Live updates: {realTimeUpdates} new interactions
          </div>
        )}
      </CardContent>
    </Card>
  );
};