import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Heart, 
  DollarSign, 
  Award, 
  Music, 
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Globe,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface EthicalDataPledgeProps {
  user: User | null;
  className?: string;
}

interface DataPartnership {
  id: string;
  artist_id: string;
  artist_name: string;
  track_title: string;
  license_type: 'training' | 'style_reference' | 'full_rights';
  royalty_percentage: number;
  usage_count: number;
  revenue_earned: number;
  cultural_authenticity_score: number;
  status: 'pending' | 'active' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
}

interface RoyaltyTransaction {
  id: string;
  partnership_id: string;
  artist_id: string;
  amount_cents: number;
  usage_type: 'generation' | 'analysis' | 'style_transfer';
  ai_model_used: string;
  cultural_impact_score: number;
  transaction_date: string;
}

export const EthicalDataPledge: React.FC<EthicalDataPledgeProps> = ({ user, className }) => {
  const [partnerships, setPartnerships] = useState<DataPartnership[]>([]);
  const [transactions, setTransactions] = useState<RoyaltyTransaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPartnershipForm, setShowPartnershipForm] = useState(false);
  const { toast } = useToast();

  const [newPartnership, setNewPartnership] = useState({
    track_title: '',
    artist_name: '',
    license_type: 'training' as const,
    royalty_percentage: 5,
    duration_months: 12,
    cultural_notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchPartnerships();
      fetchTransactions();
    }
  }, [user]);

  const fetchPartnerships = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('ethical_data_partnerships')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not exist yet — show empty state silently
        console.warn('ethical_data_partnerships not available:', error.message);
        setPartnerships([]);
        return;
      }
      setPartnerships(data || []);
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      setPartnerships([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('micro_royalty_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not exist yet — show empty state silently
        console.warn('micro_royalty_transactions not available:', error.message);
        setTransactions([]);
        setTotalRevenue(0);
        return;
      }
      const rows = data || [];
      setTransactions(rows);
      const total = rows.reduce((sum: number, t: any) => sum + (t.amount_cents || 0), 0) / 100;
      setTotalRevenue(total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setTotalRevenue(0);
    }
  };

  const createPartnership = async () => {
    if (!user || !newPartnership.track_title.trim() || !newPartnership.artist_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + newPartnership.duration_months);

      const { error } = await (supabase as any)
        .from('ethical_data_partnerships')
        .insert([{
          user_id: user.id,
          artist_name: newPartnership.artist_name,
          data_rights_granted: [newPartnership.license_type],
          compensation_model: `${newPartnership.royalty_percentage}% royalty`,
          status: 'pending',
        }]);

      if (error) {
        console.error('Error creating partnership:', error);
        toast({
          title: "Error",
          description: error.message.includes('does not exist')
            ? "Partnership table not yet available. Please run database migrations."
            : "Failed to create data partnership",
          variant: "destructive",
        });
        return;
      }

      await fetchPartnerships();
      setNewPartnership({
        track_title: '',
        artist_name: '',
        license_type: 'training',
        royalty_percentage: 5,
        duration_months: 12,
        cultural_notes: ''
      });
      setShowPartnershipForm(false);

      toast({
        title: "Partnership Created",
        description: "Your ethical data partnership has been submitted for review",
      });
    } catch (error) {
      console.error('Error creating partnership:', error);
      toast({
        title: "Error",
        description: "Failed to create data partnership",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayPartnerships = partnerships;
  const displayTransactions = transactions;
  const displayRevenue = totalRevenue;

  const getLicenseColor = (type: string) => {
    switch (type) {
      case 'training': return 'text-blue-500';
      case 'style_reference': return 'text-green-500';
      case 'full_rights': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'expired': return 'text-red-500';
      case 'revoked': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Ethical Data Pledge
          </CardTitle>
          <CardDescription>
            Please sign in to access the ethical data partnership program
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Ethical Data Pledge
            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
              Transparent AI Training
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Fair compensation and cultural respect for AI training data contributors
          </p>
        </div>
        
        <Button onClick={() => setShowPartnershipForm(true)}>
          <Heart className="w-4 h-4 mr-2" />
          Create Partnership
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${displayRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Partnerships</p>
                <p className="text-2xl font-bold">{displayPartnerships.filter(p => p.status === 'active').length}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cultural Score</p>
                <p className="text-2xl font-bold">
                  {displayPartnerships.length > 0
                    ? (displayPartnerships.reduce((sum, p) => sum + (p.cultural_authenticity_score || 0), 0) / displayPartnerships.length * 100).toFixed(1)
                    : '—'}%
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">{displayPartnerships.reduce((sum, p) => sum + p.usage_count, 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="partnerships" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="partnerships">My Partnerships</TabsTrigger>
          <TabsTrigger value="transactions">Royalty History</TabsTrigger>
          <TabsTrigger value="pledge">Our Pledge</TabsTrigger>
        </TabsList>

        <TabsContent value="partnerships" className="space-y-4">
          {/* Create Partnership Form */}
          {showPartnershipForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create Ethical Data Partnership</CardTitle>
                <CardDescription>
                  License your music for AI training with fair compensation and cultural respect
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Track title"
                    value={newPartnership.track_title}
                    onChange={(e) => setNewPartnership({...newPartnership, track_title: e.target.value})}
                  />
                  <Input
                    placeholder="Artist name"
                    value={newPartnership.artist_name}
                    onChange={(e) => setNewPartnership({...newPartnership, artist_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={newPartnership.license_type}
                    onChange={(e) => setNewPartnership({...newPartnership, license_type: e.target.value as any})}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="training">Training License</option>
                    <option value="style_reference">Style Reference</option>
                    <option value="full_rights">Full Rights</option>
                  </select>

                  <Input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    placeholder="Royalty %"
                    value={newPartnership.royalty_percentage}
                    onChange={(e) => setNewPartnership({...newPartnership, royalty_percentage: parseFloat(e.target.value) || 5})}
                  />

                  <Input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="Duration (months)"
                    value={newPartnership.duration_months}
                    onChange={(e) => setNewPartnership({...newPartnership, duration_months: parseInt(e.target.value) || 12})}
                  />
                </div>

                <Textarea
                  placeholder="Cultural significance and context notes (optional)"
                  value={newPartnership.cultural_notes}
                  onChange={(e) => setNewPartnership({...newPartnership, cultural_notes: e.target.value})}
                  rows={3}
                />

                <div className="flex gap-2">
                  <Button onClick={createPartnership} disabled={loading}>
                    <Heart className="w-4 h-4 mr-2" />
                    Create Partnership
                  </Button>
                  <Button variant="outline" onClick={() => setShowPartnershipForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Partnerships List */}
          {displayPartnerships.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No partnerships yet. Create your first partnership above.</p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayPartnerships.map((partnership) => (
              <Card key={partnership.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{partnership.track_title}</CardTitle>
                    <Badge variant="outline" className={getStatusColor(partnership.status)}>
                      {partnership.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    by {partnership.artist_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">License Type</span>
                    <Badge variant="outline" className={getLicenseColor(partnership.license_type)}>
                      {partnership.license_type}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cultural Authenticity</span>
                      <span>{(partnership.cultural_authenticity_score * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={partnership.cultural_authenticity_score * 100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Usage Count</p>
                      <p className="font-medium">{partnership.usage_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue Earned</p>
                      <p className="font-medium text-green-500">${partnership.revenue_earned.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Royalty Rate</p>
                      <p className="font-medium">{partnership.royalty_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">{new Date(partnership.expires_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {displayTransactions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
          )}
          <div className="space-y-3">
            {displayTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{transaction.usage_type}</Badge>
                        <Badge variant="outline">{transaction.ai_model_used}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Cultural Impact Score: {(transaction.cultural_impact_score * 100).toFixed(1)}%
                      </p>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(transaction.transaction_date).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-500">
                        +${(transaction.amount_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Our Ethical AI Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Fair Compensation</h3>
                      <p className="text-sm text-muted-foreground">
                        Every use of your music in AI training generates micro-royalties paid directly to you
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Cultural Respect</h3>
                      <p className="text-sm text-muted-foreground">
                        AI models are trained with cultural context and authenticity validation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Full Transparency</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete visibility into how your music is used and the revenue it generates
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Artist Control</h3>
                      <p className="text-sm text-muted-foreground">
                        You maintain full control and can revoke permissions at any time
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Community Building</h3>
                      <p className="text-sm text-muted-foreground">
                        Revenue sharing supports the broader amapiano artist community
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Data Security</h3>
                      <p className="text-sm text-muted-foreground">
                        Enterprise-grade security and privacy protection for all data
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Global Impact
                </h3>
                <p className="text-sm text-muted-foreground">
                  By participating in our ethical data program, you're helping preserve and promote 
                  South African musical heritage while ensuring AI technology development benefits 
                  the original creators and their communities.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};