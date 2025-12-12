import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, Loader2 } from "lucide-react";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface PricingSectionProps {
  user: User | null;
}

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with AI music generation",
    icon: Zap,
    features: [
      "3 generations per month",
      "Basic audio analysis",
      "Community samples access",
      "Standard quality output",
    ],
    cta: "Get Started",
    tier: "free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious music creators",
    icon: Crown,
    features: [
      "50 generations per month",
      "Stem separation & export",
      "Priority GPU processing",
      "Advanced Amapianorization",
      "DAW integration",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    tier: "pro",
    popular: true,
  },
  {
    name: "Studio",
    price: "$99",
    period: "/month",
    description: "Professional production suite",
    icon: Rocket,
    features: [
      "Unlimited generations",
      "API access",
      "Custom model training",
      "White-glove onboarding",
      "Dedicated GPU allocation",
      "Commercial licensing",
    ],
    cta: "Go Studio",
    tier: "studio",
    popular: false,
  },
];

export const PricingSection: React.FC<PricingSectionProps> = ({ user }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    if (tier === "free") {
      if (!user) {
        window.location.href = "/auth";
      } else {
        toast.success("You're already on the Free tier!");
      }
      return;
    }

    if (!user) {
      toast.info("Please sign in to upgrade");
      window.location.href = "/auth";
      return;
    }

    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Turn Ideas into Radio-Ready Tracks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional-quality AI music generation for independent artists, content creators, and labels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isLoading = loading === tier.tier;
              
              return (
                <Card 
                  key={tier.name}
                  className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-xl ${
                    tier.popular 
                      ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                      : 'hover:ring-1 hover:ring-border'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 ${
                      tier.popular 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.period && (
                        <span className="text-muted-foreground">{tier.period}</span>
                      )}
                    </div>
                    <CardDescription className="mt-2">{tier.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${tier.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(tier.tier)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        tier.cta
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include access to our core AI features. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
};
