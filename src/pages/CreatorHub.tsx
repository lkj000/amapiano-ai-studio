import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CreatorDashboard from '@/components/CreatorDashboard';
import SubscriptionManager from '@/components/SubscriptionManager';
import { useSubscription } from '@/hooks/useSubscription';
import { User } from '@supabase/supabase-js';
import { 
  DollarSign, 
  Crown, 
  BarChart3, 
  Settings, 
  Music, 
  Users,
  TrendingUp,
  Star
} from 'lucide-react';

interface CreatorHubProps {
  user: User | null;
}

const CreatorHub: React.FC<CreatorHubProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { subscription_tier } = useSubscription(user);

  const features = [
    {
      icon: DollarSign,
      title: "Micro-Royalties",
      description: "Earn from every play with our AI-native royalty system"
    },
    {
      icon: Users,
      title: "Remix Revenue Sharing", 
      description: "Get paid when others remix your tracks"
    },
    {
      icon: Star,
      title: "Direct Fan Support",
      description: "Receive tips and donations from your audience"
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Track your earnings and audience engagement"
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-4xl font-bold">Creator Hub</h1>
          <p className="text-xl text-muted-foreground">
            Join the new economy of AI music creation
          </p>
          <p className="text-muted-foreground">
            Sign in to access your creator dashboard, manage earnings, and explore monetization features.
          </p>
          <Button size="lg" asChild>
            <a href="/auth">Sign In to Get Started</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Creator Hub</h1>
          <p className="text-xl text-muted-foreground">
            Your central command for AI music monetization
          </p>
          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Crown className="w-4 h-4 mr-1" />
              {subscription_tier} Plan
            </Badge>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <CreatorDashboard userId={user.id} />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionManager 
              currentTier={subscription_tier || 'Free'}
              onUpgrade={(tier) => {
                console.log('Upgraded to:', tier);
                // Handle subscription upgrade
              }}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Creator Profile</CardTitle>
                  <CardDescription>Manage your public creator information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" variant="outline">
                    <Music className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Social Links
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monetization Settings</CardTitle>
                  <CardDescription>Configure how you earn from your music</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Tips</h4>
                      <p className="text-sm text-muted-foreground">Allow fans to tip your tracks</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Remix Royalties</h4>
                      <p className="text-sm text-muted-foreground">15% from remixes of your tracks</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorHub;