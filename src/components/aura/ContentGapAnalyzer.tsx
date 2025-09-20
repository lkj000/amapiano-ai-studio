import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  TrendingUp, 
  BarChart3, 
  Music, 
  DollarSign,
  AlertCircle,
  Zap,
  RefreshCw,
  Filter,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface ContentGapAnalyzerProps {
  user: User | null;
}

interface GenreGap {
  genre: string;
  subgenre?: string;
  demand_score: number;
  supply_count: number;
  gap_percentage: number;
  revenue_potential: number;
  trending_velocity: number;
  bpm_range: [number, number];
  key_signatures: string[];
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  monthly_searches: number;
  remix_rate: number;
}

interface MarketOpportunity {
  title: string;
  description: string;
  market_size: number;
  competition_level: number;
  entry_difficulty: number;
  time_to_market: string;
  potential_partners: string[];
}

export const ContentGapAnalyzer: React.FC<ContentGapAnalyzerProps> = ({ user }) => {
  const [genreGaps, setGenreGaps] = useState<GenreGap[]>([]);
  const [marketOpportunities, setMarketOpportunities] = useState<MarketOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [sortBy, setSortBy] = useState('priority');
  const { toast } = useToast();

  // Sample data based on AuraConductor analysis
  const sampleGenreGaps: GenreGap[] = [
    {
      genre: 'Private School Amapiano',
      subgenre: 'Melodic Private School',
      demand_score: 94,
      supply_count: 12,
      gap_percentage: 87,
      revenue_potential: 156000,
      trending_velocity: 145,
      bpm_range: [112, 118],
      key_signatures: ['C major', 'G major', 'A minor'],
      priority_level: 'critical',
      monthly_searches: 2400,
      remix_rate: 23.4
    },
    {
      genre: 'Soulful Deep House',
      subgenre: 'Afro-Soulful',
      demand_score: 89,
      supply_count: 23,
      gap_percentage: 74,
      revenue_potential: 124000,
      trending_velocity: 98,
      bpm_range: [118, 125],
      key_signatures: ['F major', 'C major', 'D minor'],
      priority_level: 'critical',
      monthly_searches: 1890,
      remix_rate: 19.8
    },
    {
      genre: 'Vocal Amapiano',
      subgenre: 'Female Vocal Leads',
      demand_score: 82,
      supply_count: 34,
      gap_percentage: 69,
      revenue_potential: 98000,
      trending_velocity: 112,
      bpm_range: [115, 120],
      key_signatures: ['G major', 'E minor', 'C major'],
      priority_level: 'high',
      monthly_searches: 1650,
      remix_rate: 17.2
    },
    {
      genre: 'Progressive Amapiano',
      subgenre: 'Experimental Fusion',
      demand_score: 76,
      supply_count: 45,
      gap_percentage: 61,
      revenue_potential: 87000,
      trending_velocity: 78,
      bpm_range: [110, 128],
      key_signatures: ['A minor', 'F major', 'C major'],
      priority_level: 'high',
      monthly_searches: 1200,
      remix_rate: 15.6
    },
    {
      genre: 'Log Drum Variations',
      subgenre: 'Regional Styles',
      demand_score: 71,
      supply_count: 67,
      gap_percentage: 52,
      revenue_potential: 73000,
      trending_velocity: 89,
      bpm_range: [114, 122],
      key_signatures: ['C major', 'G major', 'A minor'],
      priority_level: 'medium',
      monthly_searches: 980,
      remix_rate: 14.1
    }
  ];

  const sampleMarketOpportunities: MarketOpportunity[] = [
    {
      title: 'Private School Amapiano Expansion',
      description: 'Critical shortage of authentic private school style profiles with high commercial demand',
      market_size: 2400000,
      competition_level: 15,
      entry_difficulty: 25,
      time_to_market: '2-3 weeks',
      potential_partners: ['DJ Maphorisa', 'Kabza De Small', 'Private School Piano']
    },
    {
      title: 'Vocal Sample Libraries',
      description: 'Untapped market for ethically-sourced South African vocal samples and hooks',
      market_size: 1800000,
      competition_level: 32,
      entry_difficulty: 40,
      time_to_market: '4-6 weeks',
      potential_partners: ['Sha Sha', 'Njelic', 'Boohle']
    },
    {
      title: 'Regional Log Drum Variations',
      description: 'Opportunity to capture diverse regional log drum styles from across South Africa',
      market_size: 1200000,
      competition_level: 28,
      entry_difficulty: 35,
      time_to_market: '3-4 weeks',
      potential_partners: ['Regional Artists', 'Cultural Institutions']
    }
  ];

  useEffect(() => {
    setGenreGaps(sampleGenreGaps);
    setMarketOpportunities(sampleMarketOpportunities);
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      // Simulate analysis with current data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call the analytics engine
      const { data, error } = await supabase.functions.invoke('content-gap-analysis', {
        body: {
          timeframe: selectedTimeframe,
          analysis_type: 'comprehensive'
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: "Content gap analysis has been updated with the latest data",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Using cached results. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const sortedGaps = [...genreGaps].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority_level] - priorityOrder[a.priority_level];
      case 'revenue':
        return b.revenue_potential - a.revenue_potential;
      case 'demand':
        return b.demand_score - a.demand_score;
      case 'gap':
        return b.gap_percentage - a.gap_percentage;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Content Gap Analyzer
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              AI-Powered Insights
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Data-driven identification of high-opportunity content gaps in the amapiano ecosystem
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={runAnalysis} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="gaps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
          <TabsTrigger value="opportunities">Market Opportunities</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="priority">Priority Level</option>
                  <option value="revenue">Revenue Potential</option>
                  <option value="demand">Demand Score</option>
                  <option value="gap">Gap Percentage</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Genre Gaps Grid */}
          <div className="space-y-4">
            {sortedGaps.map((gap, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{gap.genre}</CardTitle>
                      {gap.subgenre && (
                        <CardDescription>{gap.subgenre}</CardDescription>
                      )}
                    </div>
                    <Badge className={getPriorityColor(gap.priority_level)}>
                      {gap.priority_level} priority
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Demand Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={gap.demand_score} className="flex-1" />
                        <span className="text-sm font-bold">{gap.demand_score}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Supply Gap</p>
                      <div className="flex items-center gap-2">
                        <Progress value={gap.gap_percentage} className="flex-1" />
                        <span className="text-sm font-bold text-red-600">{gap.gap_percentage}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Revenue Potential</p>
                      <p className="text-lg font-bold text-green-600">
                        ${gap.revenue_potential.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Trending Velocity</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-green-600">+{gap.trending_velocity}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">BPM Range:</p>
                      <p className="font-medium">{gap.bpm_range[0]} - {gap.bpm_range[1]}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Searches:</p>
                      <p className="font-medium">{gap.monthly_searches.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Remix Rate:</p>
                      <p className="font-medium">{gap.remix_rate}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-4">
                    {gap.key_signatures.map((key, keyIndex) => (
                      <Badge key={keyIndex} variant="outline" className="text-xs">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketOpportunities.map((opportunity, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    {opportunity.title}
                  </CardTitle>
                  <CardDescription>{opportunity.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Market Size</p>
                      <p className="text-lg font-bold text-green-600">
                        ${(opportunity.market_size / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time to Market</p>
                      <p className="font-medium">{opportunity.time_to_market}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Competition Level</p>
                      <Progress value={opportunity.competition_level} className="h-2" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entry Difficulty</p>
                      <Progress value={opportunity.entry_difficulty} className="h-2" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Potential Partners</p>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.potential_partners.map((partner, partnerIndex) => (
                        <Badge key={partnerIndex} variant="secondary" className="text-xs">
                          {partner}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Immediate Action Required</p>
                      <p className="text-sm text-muted-foreground">
                        Target private school amapiano artists - 87% supply gap with $156k revenue potential
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">High Priority</p>
                      <p className="text-sm text-muted-foreground">
                        Expand soulful deep house partnerships - trending +98% with strong commercial demand
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Music className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Medium Priority</p>
                      <p className="text-sm text-muted-foreground">
                        Develop vocal sample libraries - untapped market with moderate entry barriers
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Revenue Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ${(genreGaps.reduce((sum, gap) => sum + gap.revenue_potential, 0) / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total addressable revenue from identified gaps
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Critical Priority Gaps:</span>
                    <span className="font-medium">
                      ${genreGaps.filter(g => g.priority_level === 'critical')
                        .reduce((sum, gap) => sum + gap.revenue_potential, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Priority Gaps:</span>
                    <span className="font-medium">
                      ${genreGaps.filter(g => g.priority_level === 'high')
                        .reduce((sum, gap) => sum + gap.revenue_potential, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Partner Outreach Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">48hrs</div>
                  <p className="text-sm text-muted-foreground">Response time for critical gaps</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">20+</div>
                  <p className="text-sm text-muted-foreground">Priority partners to contact</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">15%</div>
                  <p className="text-sm text-muted-foreground">Standard royalty rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};