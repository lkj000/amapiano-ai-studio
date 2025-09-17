import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from './LoadingSpinner';

interface SubscriptionTier {
  id: string;
  tier_name: string;
  price_cents: number;
  currency: string;
  features: string[];
  ai_generation_credits: number;
  upload_limit_mb: number;
  priority_processing: boolean;
  exclusive_models: boolean;
  created_at: string;
}

interface SubscriptionManagerProps {
  currentTier?: string;
  onUpgrade?: (tier: string) => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  currentTier = 'Free',
  onUpgrade
}) => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionTiers();
  }, []);

  const fetchSubscriptionTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('price_cents', { ascending: true });

      if (error) throw error;

      const postsWithFeatures = (data || []).map(tier => ({
        ...tier,
        features: Array.isArray(tier.features) ? tier.features.filter(f => typeof f === 'string') as string[] : []
      }));

      setTiers(postsWithFeatures);
    } catch (error) {
      console.error('Error fetching subscription tiers:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const handleUpgrade = async (tierName: string) => {
    setUpgrading(tierName);
    
    try {
      // In a real implementation, this would integrate with Stripe
      // For now, we'll simulate the upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${tierName}! Your new features are now active.`,
      });

      onUpgrade?.(tierName);
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Upgrade Failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setUpgrading(null);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free':
        return <Sparkles className="w-5 h-5" />;
      case 'creator':
        return <Zap className="w-5 h-5" />;
      case 'pro':
        return <Crown className="w-5 h-5" />;
      case 'studio':
        return <Star className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free':
        return 'bg-slate-500';
      case 'creator':
        return 'bg-blue-500';
      case 'pro':
        return 'bg-purple-500';
      case 'studio':
        return 'bg-gold-500';
      default:
        return 'bg-slate-500';
    }
  };

  const isCurrentTier = (tierName: string) => {
    return tierName.toLowerCase() === currentTier.toLowerCase();
  };

  const canUpgrade = (tierName: string) => {
    const tierIndex = tiers.findIndex(t => t.tier_name.toLowerCase() === tierName.toLowerCase());
    const currentTierIndex = tiers.findIndex(t => t.tier_name.toLowerCase() === currentTier.toLowerCase());
    return tierIndex > currentTierIndex;
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner message="Loading subscription plans..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock more AI models, increased generation limits, and premium features to take your music creation to the next level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
              isCurrentTier(tier.tier_name) ? 'ring-2 ring-primary shadow-lg' : ''
            } ${tier.tier_name.toLowerCase() === 'pro' ? 'border-purple-500 border-2' : ''}`}
          >
            {tier.tier_name.toLowerCase() === 'pro' && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white ${getTierColor(tier.tier_name)}`}>
                {getTierIcon(tier.tier_name)}
              </div>
              <CardTitle className="text-xl">{tier.tier_name}</CardTitle>
              <CardDescription>
                <div className="text-3xl font-bold text-foreground">
                  {tier.price_cents === 0 ? 'Free' : formatCurrency(tier.price_cents)}
                </div>
                {tier.price_cents > 0 && (
                  <span className="text-sm text-muted-foreground">/month</span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>AI Generations</span>
                  <Badge variant="outline">
                    {tier.ai_generation_credits === -1 ? 'Unlimited' : `${tier.ai_generation_credits}/day`}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Upload Limit</span>
                  <Badge variant="outline">
                    {tier.upload_limit_mb}MB
                  </Badge>
                </div>
                {tier.priority_processing && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Priority Processing
                  </div>
                )}
                {tier.exclusive_models && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Check className="w-4 h-4" />
                    Exclusive AI Models
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Features:</h5>
                <div className="space-y-1">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3 h-3 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                {isCurrentTier(tier.tier_name) ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : canUpgrade(tier.tier_name) ? (
                  <Button 
                    className="w-full"
                    onClick={() => handleUpgrade(tier.tier_name)}
                    disabled={upgrading === tier.tier_name}
                  >
                    {upgrading === tier.tier_name ? (
                      <LoadingSpinner size="sm" message="" className="mr-2" />
                    ) : (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to {tier.tier_name}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Lower Tier
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          All plans include access to our community features and basic AI models.
        </p>
        <p className="text-sm text-muted-foreground">
          Cancel anytime. No long-term contracts.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionManager;