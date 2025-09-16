import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Music, Search, Headphones, Grid3X3, Volume2, Sparkles, Users, BookOpen, Zap, Crown, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { User } from '@supabase/supabase-js';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { SubscriptionManagement } from '@/components/SubscriptionManagement';
import { MarketplaceModal } from '@/components/MarketplaceModal';
import { AIModelMarketplace } from '@/components/AIModelMarketplace';
import { RealTimeCollaboration } from '@/components/RealTimeCollaboration';
import { toast } from 'sonner';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';

interface IndexProps {
  user: User | null;
  showSubscription?: boolean;
  showMarketplace?: boolean;
}

const Index: React.FC<IndexProps> = ({ user, showSubscription = false, showMarketplace = false }) => {
  const { subscribed } = useSubscription(user);
  
  // Show subscription management for existing subscribers, subscription modal for new users
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(showSubscription && !subscribed);
  const [subscriptionManagementOpen, setSubscriptionManagementOpen] = useState(showSubscription && subscribed);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(showMarketplace);
  const { subscription_tier, hasFeature } = useSubscription(user);
  const features = [
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
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              World's First Amapiano AI Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Create Authentic{" "}
              <span className="text-gradient-primary">Amapiano</span>{" "}
              with AI
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Democratize amapiano music production while preserving South African musical heritage through cutting-edge AI technology and cultural authenticity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <>
                  <Link to="/generate">
                    <Button size="lg" className="btn-glow text-lg px-8 py-6">
                      <Music className="w-5 h-5 mr-2" />
                      Start Creating
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6"
                    onClick={() => setMarketplaceModalOpen(true)}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Explore Marketplace
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="btn-glow text-lg px-8 py-6">
                      <Music className="w-5 h-5 mr-2" />
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6"
                    onClick={() => setSubscriptionModalOpen(true)}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    View Plans
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Complete Amapiano Production Suite
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create, learn, and master authentic amapiano music with cultural accuracy and professional quality.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} to={feature.href}>
                    <Card className="card-glow hover:shadow-xl transition-all duration-300 h-full group">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 ${feature.color}`}>
                          <Icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                          Explore feature
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Ready to Create Authentic Amapiano?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of producers, educators, and music lovers exploring the world of amapiano with AI assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/generate">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating Now
                </Button>
              </Link>
              <Link to="/patterns">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Learn Amapiano
                </Button>
              </Link>
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
            </div>
          </div>
        </section>
      )}
      
      <SubscriptionModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
        user={user}
      />
      
      <SubscriptionManagement
        open={subscriptionManagementOpen}
        onOpenChange={setSubscriptionManagementOpen}
        user={user}
      />
      
      <MarketplaceModal
        open={marketplaceModalOpen}
        onOpenChange={setMarketplaceModalOpen}
        user={user}
      />
    </div>
  );
};

export default Index;
