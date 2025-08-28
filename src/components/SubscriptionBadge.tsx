import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, User } from 'lucide-react';
import { SubscriptionTier } from '@/hooks/useSubscription';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  className?: string;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  tier,
  className = ""
}) => {
  const getTierConfig = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'producer':
        return {
          label: 'Producer',
          icon: Star,
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'professional':
        return {
          label: 'Pro',
          icon: Crown,
          variant: 'default' as const,
          className: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'enterprise':
        return {
          label: 'Enterprise',
          icon: Zap,
          variant: 'default' as const,
          className: 'bg-gradient-to-r from-orange-400 to-red-500 text-white border-0'
        };
      default: // free
        return {
          label: 'Free',
          icon: User,
          variant: 'outline' as const,
          className: 'text-muted-foreground'
        };
    }
  };

  const config = getTierConfig(tier);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};