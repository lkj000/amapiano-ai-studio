import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Settings, Crown, Star, Zap, User } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface SubscriptionManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SupabaseUser | null;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const { subscription_tier, subscribed, subscription_end, openCustomerPortal } = useSubscription(user);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'producer': return Star;
      case 'professional': return Crown;
      case 'enterprise': return Zap;
      default: return User;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'producer': return 'text-blue-600 bg-blue-100';
      case 'professional': return 'text-purple-600 bg-purple-100';
      case 'enterprise': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleBillingPortal = async () => {
    try {
      await openCustomerPortal();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast.error('You need to have an active subscription to access the billing portal. Please subscribe first.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const TierIcon = getTierIcon(subscription_tier);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Manage Your Subscription</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getTierColor(subscription_tier)}`}>
                  <TierIcon className="h-5 w-5" />
                </div>
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plan:</span>
                <Badge variant="secondary" className={getTierColor(subscription_tier)}>
                  {subscription_tier.charAt(0).toUpperCase() + subscription_tier.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={subscribed ? "default" : "secondary"}>
                  {subscribed ? "Active" : "Inactive"}
                </Badge>
              </div>

              {subscription_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Billing:</span>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {formatDate(subscription_end)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {subscription_tier === 'free' && (
                  <>
                    <div>• 3 Projects</div>
                    <div>• 8 Tracks per Project</div>
                    <div>• 2 Plugins per Track</div>
                    <div>• Basic Features</div>
                  </>
                )}
                {subscription_tier === 'producer' && (
                  <>
                    <div>• Unlimited Projects</div>
                    <div>• 32 Tracks per Project</div>
                    <div>• 8 Plugins per Track</div>
                    <div>• Basic VST Plugins</div>
                    <div>• Sample Library</div>
                    <div>• MIDI Controller</div>
                  </>
                )}
                {subscription_tier === 'professional' && (
                  <>
                    <div>• Everything in Producer</div>
                    <div>• 64 Tracks per Project</div>
                    <div>• 16 Plugins per Track</div>
                    <div>• Premium VST Plugins</div>
                    <div>• Advanced Effects</div>
                    <div>• Multi-track Routing</div>
                    <div>• Elastic Audio</div>
                    <div>• Automation Lanes</div>
                  </>
                )}
                {subscription_tier === 'enterprise' && (
                  <>
                    <div>• Everything in Professional</div>
                    <div>• Unlimited Tracks</div>
                    <div>• Unlimited Plugins</div>
                    <div>• Collaboration Tools</div>
                    <div>• Batch Processing</div>
                    <div>• Priority Support</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Management Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleBillingPortal}
              className="flex-1 flex items-center gap-2"
              variant="default"
            >
              <CreditCard className="h-4 w-4" />
              Billing Portal
            </Button>
            
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          </div>

          {!subscribed && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                You're currently on the free plan. Upgrade to unlock more features!
              </p>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  // This could trigger opening the subscription modal
                }}
                size="sm"
              >
                View Plans
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};