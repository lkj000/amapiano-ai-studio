import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Handshake, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Music, 
  BarChart3,
  FileText,
  Mail,
  CheckCircle,
  Upload,
  Zap,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface PartnershipPortalProps {
  user: User | null;
}

interface PartnershipMetrics {
  total_partnerships: number;
  active_licenses: number;
  remix_rate_improvement: number;
  partner_revenue_cents: number;
  engagement_boost: number;
}

interface ContentGap {
  genre: string;
  demand_score: number;
  supply_gap: number;
  revenue_potential: number;
  priority_level: 'high' | 'medium' | 'low';
}

export const PartnershipPortal: React.FC<PartnershipPortalProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<PartnershipMetrics>({
    total_partnerships: 47,
    active_licenses: 1230,
    remix_rate_improvement: 12,
    partner_revenue_cents: 45670000,
    engagement_boost: 28
  });
  
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([
    {
      genre: 'Private School Amapiano',
      demand_score: 94,
      supply_gap: 78,
      revenue_potential: 125000,
      priority_level: 'high'
    },
    {
      genre: 'Soulful Deep House',
      demand_score: 87,
      supply_gap: 65,
      revenue_potential: 89000,
      priority_level: 'high'
    },
    {
      genre: 'Afro-Tech Fusion',
      demand_score: 76,
      supply_gap: 82,
      revenue_potential: 67000,
      priority_level: 'medium'
    }
  ]);
  
  const [partnershipForm, setPartnershipForm] = useState({
    artist_name: '',
    email: '',
    genre_specialization: '',
    content_type: 'style_profiles',
    message: '',
    social_links: ''
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitPartnershipRequest = async () => {
    if (!partnershipForm.artist_name || !partnershipForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Store partnership request in database
      const { error } = await supabase
        .from('artist_licenses')
        .insert([{
          artist_id: user?.id || null,
          license_type: 'partnership_request',
          terms_data: {
            artist_name: partnershipForm.artist_name,
            email: partnershipForm.email,
            genre_specialization: partnershipForm.genre_specialization,
            content_type: partnershipForm.content_type,
            message: partnershipForm.message,
            social_links: partnershipForm.social_links,
            submitted_at: new Date().toISOString(),
            status: 'pending_review'
          },
          compensation_rate: 15.0, // Default 15% royalty
          is_active: false
        }]);

      if (error) throw error;

      // Send notification email via edge function
      await supabase.functions.invoke('partnership-notification', {
        body: {
          type: 'new_partnership_request',
          data: partnershipForm
        }
      });

      toast({
        title: "Partnership Request Submitted",
        description: "We'll review your application within 48 hours",
      });

      // Reset form
      setPartnershipForm({
        artist_name: '',
        email: '',
        genre_specialization: '',
        content_type: 'style_profiles',
        message: '',
        social_links: ''
      });
    } catch (error) {
      console.error('Partnership submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Handshake className="w-8 h-8 text-primary" />
            Ethical Data Partnership Portal
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              +{metrics.remix_rate_improvement}% Remix Rate
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Join our cultural preservation initiative while monetizing your unique sound
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Partnership Impact</TabsTrigger>
          <TabsTrigger value="gaps">Content Opportunities</TabsTrigger>
          <TabsTrigger value="onboarding">Partner Onboarding</TabsTrigger>
          <TabsTrigger value="resources">Resources & Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Partnerships</p>
                    <p className="text-2xl font-bold">{metrics.total_partnerships}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remix Rate Boost</p>
                    <p className="text-2xl font-bold text-green-600">+{metrics.remix_rate_improvement}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Partner Revenue</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      ${(metrics.partner_revenue_cents / 100).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Engagement Increase</p>
                    <p className="text-2xl font-bold text-purple-600">+{metrics.engagement_boost}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Value Proposition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Why Partner with Aura?
              </CardTitle>
              <CardDescription>
                Our BPM-aware discovery engine makes your content 12% more likely to be remixed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Proven Engagement
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Our algorithmic updates have demonstrated a +12% increase in remix rates, 
                    meaning your licensed content gets used more frequently.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Cultural Authenticity
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    We prioritize cultural preservation and ethical AI training, 
                    ensuring your artistic heritage is respected and compensated.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Fair Compensation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Transparent royalty system with 15% revenue share plus 
                    micro-royalties for every use of your licensed content.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Global Reach
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Access to our growing network of {metrics.total_partnerships} artists 
                    and {metrics.active_licenses.toLocaleString()} active licenses worldwide.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                High-Opportunity Content Gaps
              </CardTitle>
              <CardDescription>
                Data-driven analysis of genres with high demand but limited supply
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentGaps.map((gap, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{gap.genre}</h4>
                      <Badge variant={gap.priority_level === 'high' ? 'destructive' : 
                                   gap.priority_level === 'medium' ? 'default' : 'secondary'}>
                        {gap.priority_level} priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Demand Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={gap.demand_score} className="flex-1" />
                          <span className="text-sm font-medium">{gap.demand_score}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Supply Gap</p>
                        <div className="flex items-center gap-2">
                          <Progress value={gap.supply_gap} className="flex-1" />
                          <span className="text-sm font-medium">{gap.supply_gap}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue Potential</p>
                        <p className="text-lg font-bold text-green-600">
                          ${gap.revenue_potential.toLocaleString()}/year
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Partner Application
              </CardTitle>
              <CardDescription>
                Join our ethical data partnership program in 3 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Input
                    placeholder="Artist/Producer Name"
                    value={partnershipForm.artist_name}
                    onChange={(e) => setPartnershipForm({
                      ...partnershipForm, 
                      artist_name: e.target.value
                    })}
                  />
                  
                  <Input
                    type="email"
                    placeholder="Contact Email"
                    value={partnershipForm.email}
                    onChange={(e) => setPartnershipForm({
                      ...partnershipForm, 
                      email: e.target.value
                    })}
                  />
                  
                  <Input
                    placeholder="Genre Specialization"
                    value={partnershipForm.genre_specialization}
                    onChange={(e) => setPartnershipForm({
                      ...partnershipForm, 
                      genre_specialization: e.target.value
                    })}
                  />
                  
                  <select
                    value={partnershipForm.content_type}
                    onChange={(e) => setPartnershipForm({
                      ...partnershipForm, 
                      content_type: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="style_profiles">Style Profiles</option>
                    <option value="audio_samples">Audio Samples</option>
                    <option value="midi_patterns">MIDI Patterns</option>
                    <option value="full_tracks">Full Track Licenses</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  <Input
                    placeholder="Social Media Links (optional)"
                    value={partnershipForm.social_links}
                    onChange={(e) => setPartnershipForm({
                      ...partnershipForm, 
                      social_links: e.target.value
                    })}
                  />
                  
                  <Textarea
                    placeholder="Tell us about your music and why you'd like to partner with us..."
                    value={partnershipForm.message}
                    onChange={(e) => setPartnershipForm({
                      ...partnershipForm, 
                      message: e.target.value
                    })}
                    className="min-h-[120px]"
                  />
                  
                  <Button 
                    onClick={submitPartnershipRequest}
                    disabled={loading}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : 'Submit Partnership Request'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Partnership Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Partnership Agreement Template
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Content Submission Guidelines
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Royalty Calculation Methods
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Cultural Authenticity Standards
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  Success Stories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="border-l-2 border-primary pl-3">
                    <p className="font-medium">"Sipho's Jazz Collection"</p>
                    <p className="text-muted-foreground">
                      Generated $12,000 in 3 months through style licensing
                    </p>
                  </div>
                  <div className="border-l-2 border-primary pl-3">
                    <p className="font-medium">"Township Rhythms Co."</p>
                    <p className="text-muted-foreground">
                      1,200+ remixes using their authenticated drum patterns
                    </p>
                  </div>
                  <div className="border-l-2 border-primary pl-3">
                    <p className="font-medium">"Amapiano Legends Archive"</p>
                    <p className="text-muted-foreground">
                      Preserved 50+ historical tracks while earning royalties
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};