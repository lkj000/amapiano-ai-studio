import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Star, Zap } from 'lucide-react';
import { SubscriptionTier } from '@/hooks/useSubscription';

interface FeatureGateProps {
  feature: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  onUpgrade: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requiredTier,
  currentTier,
  onUpgrade,
  children,
  className = ""
}) => {
  const hasAccess = () => {
    const tierHierarchy = {
      'free': 0,
      'producer': 1,
      'professional': 2,
      'enterprise': 3
    };
    return tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'producer': return Star;
      case 'professional': return Crown;
      case 'enterprise': return Zap;
      default: return Lock;
    }
  };

  const getTierLabel = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'producer': return 'Producer';
      case 'professional': return 'Professional';
      case 'enterprise': return 'Enterprise';
      default: return 'Free';
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'producer': return 'bg-blue-500';
      case 'professional': return 'bg-purple-500';
      case 'enterprise': return 'bg-gradient-to-r from-orange-400 to-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  const Icon = getTierIcon(requiredTier);

  return (
    <div className={`relative ${className}`}>
      {/* Blurred/disabled content */}
      <div className="pointer-events-none opacity-30 blur-sm">
        {children}
      </div>

      {/* Overlay */}
      <Card className="absolute inset-0 flex items-center justify-center bg-background/95 border-2 border-dashed border-primary/20">
        <CardContent className="text-center p-6">
          <div className={`mx-auto w-16 h-16 ${getTierColor(requiredTier)} rounded-full flex items-center justify-center mb-4`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          
          <CardTitle className="mb-2">{feature}</CardTitle>
          <CardDescription className="mb-4">
            This feature requires a {getTierLabel(requiredTier)} subscription or higher.
          </CardDescription>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Required:</span>
            <Badge variant="secondary" className={getTierColor(requiredTier)}>
              <Icon className="h-3 w-3 mr-1 text-white" />
              <span className="text-white">{getTierLabel(requiredTier)}</span>
            </Badge>
          </div>

          <Button onClick={onUpgrade} className="w-full">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};