import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Music, Search, Headphones, Grid3X3, Volume2, Sparkles, Users, BookOpen, Zap, Crown, ShoppingCart } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { User } from '@supabase/supabase-js';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';

// Lazy load heavy below-fold components
const SubscriptionModal = lazy(() => import('@/components/SubscriptionModal').then(m => ({ default: m.SubscriptionModal })));
const SubscriptionManagement = lazy(() => import('@/components/SubscriptionManagement').then(m => ({ default: m.SubscriptionManagement })));
const MarketplaceModal = lazy(() => import('@/components/MarketplaceModal').then(m => ({ default: m.MarketplaceModal })));
const AIModelMarketplace = lazy(() => import('@/components/AIModelMarketplace').then(m => ({ default: m.AIModelMarketplace })));
const RealTimeCollaboration = lazy(() => import('@/components/RealTimeCollaboration').then(m => ({ default: m.RealTimeCollaboration })));
const PricingSection = lazy(() => import('@/components/PricingSection').then(m => ({ default: m.PricingSection })));
interface IndexProps {
  user: User | null;
  showSubscription?: boolean;
  showMarketplace?: boolean;
}

const Index: React.FC<IndexProps> = ({ user, showSubscription = false, showMarketplace = false }) => {
  const { subscribed, subscription_tier, hasFeature } = useSubscription(user);
  const [searchParams] = useSearchParams();
  
  // Show subscription management for existing subscribers, subscription modal for new users
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(showSubscription && !subscribed);
  const [subscriptionManagementOpen, setSubscriptionManagementOpen] = useState(showSubscription && subscribed);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(showMarketplace);

  // Handle subscription success/cancel from Stripe redirect
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      toast.success('Subscription activated! Welcome to AURA-X Pro.');
    } else if (subscriptionStatus === 'canceled') {
      toast.info('Subscription checkout was canceled.');
    }
  }, [searchParams]);
  const features = [
    {
      icon: Users,
      title: "Social Music Feed",
      description: "Discover, share, and remix tracks from creators worldwide. TikTok-style vertical feed with AI-powered recommendations.",
      href: "/social",
      color: "text-primary",
      featured: true
    },
    {
      icon: Music,
      title: "AI Music Generation",
      description: "Create authentic amapiano tracks from text prompts with professional-grade stem separation.",
      href: "/generate",
      color: "text-primary"
    },
    {
      icon: Search,
      title: "Universal Audio Analysis",
      description: "Analyze any audio from YouTube, TikTok, or upload files. Get stems and pattern recognition.",
      href: "/analyze",
      color: "text-secondary"
    },
    {
      icon: Headphones,
      title: "Sample Library",
      description: "10,000+ authentic amapiano samples with artist-specific styles and cultural context.",
      href: "/samples",
      color: "text-accent"
    },
    {
      icon: Grid3X3,
      title: "Pattern Library",
      description: "Learn from 1,000+ chord progressions and drum patterns with educational content.",
      href: "/patterns",
      color: "text-success"
    },
    {
      icon: Volume2,
      title: "Professional DAW",
      description: "Complete production environment optimized for amapiano with integrated AI assistance.",
      href: "/daw",
      color: "text-info"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Authentic Samples" },
    { value: "1,000+", label: "Musical Patterns" },
    { value: "50+", label: "Artist Styles" },
    { value: "25+", label: "Countries Served" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 sm:mb-6 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              World's First Amapiano AI Platform
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 px-2">
              Create Authentic{" "}
              <span className="text-gradient-primary">Amapiano</span>{" "}
              with AI
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              Democratize amapiano music production while preserving South African musical heritage through cutting-edge AI technology and cultural authenticity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-2">
              {user ? (
                <>
                   <Link to="/social" className="w-full sm:w-auto">
                     <Button size="lg" className="btn-glow text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
                       <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                       Explore Social Feed
                       <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                     </Button>
                   </Link>
                   <Link to="/generate" className="w-full sm:w-auto">
                     <Button 
                       size="lg" 
                       variant="outline" 
                       className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                     >
                       <Music className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                       Create Music
                     </Button>
                   </Link>
                </>
              ) : (
                <>
                   <Link to="/auth" className="w-full sm:w-auto">
                     <Button size="lg" className="btn-glow text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
                       <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                       Join Social Network
                       <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                     </Button>
                   </Link>
                   <Link to="/social" className="w-full sm:w-auto">
                     <Button 
                       size="lg" 
                       variant="outline" 
                       className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                     >
                       <Music className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                       Browse Feed
                     </Button>
                   </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-2xl mx-auto px-2">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Complete Amapiano Production Suite
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create, learn, and master authentic amapiano music with cultural accuracy and professional quality.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} to={feature.href} className="block">
                    <Card className={`card-glow hover:shadow-xl transition-all duration-300 h-full group ${
                      feature.featured ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent' : ''
                    }`}>
                      <CardHeader className="p-4 sm:p-6">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-3 sm:mb-4 ${feature.color}`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                        </div>
                        {feature.featured && (
                          <Badge className="w-fit mb-2 bg-primary/10 text-primary border-primary/20 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            New Feature
                          </Badge>
                        )}
                        <CardTitle className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="flex items-center text-sm sm:text-base text-primary font-medium group-hover:gap-2 transition-all">
                          {feature.featured ? 'Try now' : 'Explore feature'}
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Social Features Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4 border-primary/20 text-primary">
                  <Users className="w-3 h-3 mr-1" />
                  Social Network
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Connect with Global Amapiano Community
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Share your creations, discover new artists, and collaborate with producers worldwide in our TikTok-style vertical feed designed specifically for amapiano creators.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Creator Network</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with artists worldwide and build your fanbase
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Music className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Share & Remix</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload tracks, create remixes, and engage with community content
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">AI Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        Personalized feed powered by machine learning and your preferences
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Link to="/social">
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                      <Users className="w-5 h-5 mr-2" />
                      Explore Social Feed
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div>
                <div className="relative">
                  <div className="w-full h-80 bg-gradient-card rounded-2xl border border-border/50 flex items-center justify-center overflow-hidden">
                    <div className="text-center">
                      <div className="relative">
                        <Users className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse-glow" />
                        <div className="absolute top-0 right-0 w-6 h-6 bg-accent rounded-full animate-ping" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 bg-secondary rounded-full animate-pulse" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Social Network</h3>
                      <p className="text-muted-foreground">
                        TikTok-style vertical feed for amapiano
                      </p>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cultural Heritage Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4 border-primary/20 text-primary">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Cultural Authenticity
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Preserving South African Musical Heritage
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Built in partnership with South African artists and cultural experts, Amapiano AI ensures every generated track respects and celebrates the authentic musical traditions of amapiano.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Artist Partnerships</h3>
                      <p className="text-sm text-muted-foreground">
                        Collaborating with legendary artists like Kabza De Small and Kelvin Momo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Educational Focus</h3>
                      <p className="text-sm text-muted-foreground">
                        Every feature includes cultural context and music theory education
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Revenue Sharing</h3>
                      <p className="text-sm text-muted-foreground">
                        Direct support for original artists and the amapiano community
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:order-first">
                <div className="relative">
                  <div className="w-full h-80 bg-gradient-card rounded-2xl border border-border/50 flex items-center justify-center">
                    <div className="text-center">
                      <Music className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse-glow" />
                      <h3 className="text-xl font-semibold mb-2">Cultural Heritage</h3>
                      <p className="text-muted-foreground">
                        Authentic amapiano education and preservation
                      </p>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Suspense fallback={<div className="py-20" />}>
        <PricingSection user={user} />
      </Suspense>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Join the Global Amapiano Community
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Connect with creators worldwide, share your music, and discover new sounds in our AI-powered social network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link to="/social">
                    <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                      <Users className="w-5 h-5 mr-2" />
                      Explore Social Feed
                    </Button>
                  </Link>
                  <Link to="/generate">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                      <Music className="w-5 h-5 mr-2" />
                      Create Music
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                      <Users className="w-5 h-5 mr-2" />
                      Join Community
                    </Button>
                  </Link>
                  <Link to="/social">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                      <Music className="w-5 h-5 mr-2" />
                      Browse Feed
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Preview for Logged In Users */}
      {user && (
        <section className="py-20 bg-muted/10">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Advanced AI Features
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Unlock the power of AI with our advanced features designed specifically for amapiano production.
                </p>
              </div>

              <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
                <div className="grid lg:grid-cols-2 gap-8">
                  <AIModelMarketplace />
                  
                  <RealTimeCollaboration
                    projectId="demo"
                    currentUser={user}
                    projectData={null}
                    onProjectUpdate={(update) => {
                      console.log('Project update:', update);
                    }}
                  />
                </div>
              </Suspense>
            </div>
          </div>
        </section>
      )}
      
      <Suspense fallback={null}>
        {subscriptionModalOpen && (
          <SubscriptionModal
            open={subscriptionModalOpen}
            onOpenChange={setSubscriptionModalOpen}
            user={user}
          />
        )}
        
        {subscriptionManagementOpen && (
          <SubscriptionManagement
            open={subscriptionManagementOpen}
            onOpenChange={setSubscriptionManagementOpen}
            user={user}
          />
        )}
        
        {marketplaceModalOpen && (
          <MarketplaceModal
            open={marketplaceModalOpen}
            onOpenChange={setMarketplaceModalOpen}
            user={user}
          />
        )}
      </Suspense>
    </div>
  );
};

export default Index;
