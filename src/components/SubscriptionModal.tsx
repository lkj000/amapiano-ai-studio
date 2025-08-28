import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useSubscription, SubscriptionTier } from '@/hooks/useSubscription';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const plans = [
  {
    id: 'producer' as SubscriptionTier,
    name: 'Producer',
    price: '$9.99',
    icon: Star,
    description: 'Perfect for aspiring producers',
    features: [
      'Unlimited Projects',
      'Basic VST Plugins',
      'Sample Library Access',
      'MIDI Controller Support',
      '32 Tracks per Project',
      '8 Plugins per Track'
    ],
    popular: false,
  },
  {
    id: 'professional' as SubscriptionTier,
    name: 'Professional',
    price: '$29.99',
    icon: Crown,
    description: 'For serious music producers',
    features: [
      'Everything in Producer',
      'Premium VST Plugins',
      'Advanced Audio Effects',
      'Multi-track Routing',
      'Elastic Audio Processing',
      'Automation Lanes',
      '64 Tracks per Project',
      '16 Plugins per Track'
    ],
    popular: true,
  },
  {
    id: 'enterprise' as SubscriptionTier,
    name: 'Enterprise',
    price: '$49.99',
    icon: Zap,
    description: 'For professional studios',
    features: [
      'Everything in Professional',
      'All VST Plugins',
      'Collaboration Tools',
      'Batch Processing',
      'Priority Support',
      'Unlimited Tracks',
      'Unlimited Plugins',
      'Advanced Analytics'
    ],
    popular: false,
  },
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const { subscription_tier, subscribed, createSubscription } = useSubscription(user);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      const { url } = await createSubscription(tier);
      window.open(url, '_blank');
      onOpenChange(false);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to create subscription');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Unlock advanced features and take your music production to the next level
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription_tier === plan.id;
            const isUpgrade = subscribed && !isCurrentPlan;

            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} 
                ${isCurrentPlan ? 'border-green-500 bg-green-50/50' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white">
                    Current Plan
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || !user}
                  >
                    {!user ? 'Login to Subscribe' : 
                     isCurrentPlan ? 'Current Plan' : 
                     isUpgrade ? 'Upgrade' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Free Plan Includes:</span>
          </div>
          <p className="text-sm text-muted-foreground">
            3 Projects • 8 Tracks per Project • 2 Plugins per Track • Basic Features
          </p>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
};