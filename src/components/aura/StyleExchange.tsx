import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Palette, 
  Upload, 
  Download, 
  Star, 
  DollarSign, 
  Play, 
  ShoppingCart,
  Filter,
  Search,
  Sparkles,
  Music
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface StyleExchangeProps {
  user: User | null;
}

interface StyleProfile {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  style_data: any;
  genre_tags: string[];
  price_cents: number;
  is_public: boolean;
  download_count: number;
  rating: number;
  preview_url: string | null;
  created_at: string;
}

export const StyleExchange: React.FC<StyleExchangeProps> = ({ user }) => {
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [myProfiles, setMyProfiles] = useState<StyleProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Create form state
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    genre_tags: '',
    price_cents: 0,
    is_public: true,
    style_config: {
      tempo_range: [100, 130],
      key_preferences: ['C', 'G', 'Am', 'F'],
      rhythm_patterns: ['deep_house', 'amapiano_signature'],
      instrument_weights: {
        piano: 0.8,
        log_drum: 0.9,
        bass: 0.7,
        percussion: 0.6
      },
      effects_chain: ['reverb', 'delay', 'compression'],
      cultural_elements: ['south_african_rhythms', 'township_jazz']
    }
  });

  useEffect(() => {
    fetchPublicProfiles();
    if (user) {
      fetchMyProfiles();
    }
  }, [user]);

  const fetchPublicProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('is_public', true)
        .order('download_count', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchMyProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyProfiles(data || []);
    } catch (error) {
      console.error('Error fetching my profiles:', error);
    }
  };

  const createStyleProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('style_profiles')
        .insert([{
          creator_id: user.id,
          name: newProfile.name,
          description: newProfile.description,
          style_data: newProfile.style_config,
          genre_tags: newProfile.genre_tags.split(',').map(tag => tag.trim()),
          price_cents: newProfile.price_cents,
          is_public: newProfile.is_public
        }]);

      if (error) throw error;

      await fetchMyProfiles();
      if (newProfile.is_public) await fetchPublicProfiles();
      
      setNewProfile({
        name: '',
        description: '',
        genre_tags: '',
        price_cents: 0,
        is_public: true,
        style_config: {
          tempo_range: [100, 130],
          key_preferences: ['C', 'G', 'Am', 'F'],
          rhythm_patterns: ['deep_house', 'amapiano_signature'],
          instrument_weights: {
            piano: 0.8,
            log_drum: 0.9,
            bass: 0.7,
            percussion: 0.6
          },
          effects_chain: ['reverb', 'delay', 'compression'],
          cultural_elements: ['south_african_rhythms', 'township_jazz']
        }
      });
      setShowCreateForm(false);

      toast({
        title: "Style Profile Created",
        description: "Your style profile is now available in the exchange",
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create style profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadProfile = async (profile: StyleProfile) => {
    try {
      // Update download count
      await supabase
        .from('style_profiles')
        .update({ download_count: profile.download_count + 1 })
        .eq('id', profile.id);

      // In a real implementation, this would download the actual style file
      const styleData = JSON.stringify(profile.style_data, null, 2);
      const blob = new Blob([styleData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.name}.aura-style`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Style Downloaded",
        description: `${profile.name} style profile downloaded successfully`,
      });

      fetchPublicProfiles();
    } catch (error) {
      console.error('Error downloading profile:', error);
      toast({
        title: "Error",
        description: "Failed to download style profile",
        variant: "destructive",
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           profile.genre_tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Style Exchange
          </CardTitle>
          <CardDescription>
            Please sign in to access the style marketplace
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
            <Palette className="w-8 h-8 text-primary" />
            Style Exchange
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              AI Style Marketplace
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Share, discover, and monetize AI-generated musical style profiles
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Create Style Profile
        </Button>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="my-profiles">My Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search style profiles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Categories</option>
                  <option value="amapiano">Amapiano</option>
                  <option value="private_school">Private School</option>
                  <option value="deep_house">Deep House</option>
                  <option value="afro_house">Afro House</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Style Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{profile.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {profile.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Genre Tags */}
                  <div className="flex flex-wrap gap-1">
                    {profile.genre_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Style Configuration Preview */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Tempo: {profile.style_data.tempo_range?.[0]}-{profile.style_data.tempo_range?.[1]} BPM</div>
                    <div>Keys: {profile.style_data.key_preferences?.join(', ')}</div>
                    <div>Downloads: {profile.download_count}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {profile.preview_url && (
                      <Button variant="outline" size="sm">
                        <Play className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => downloadProfile(profile)}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      {profile.price_cents > 0 ? `$${(profile.price_cents / 100).toFixed(2)}` : 'Free'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No style profiles found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or create the first profile in this category
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-profiles" className="space-y-6">
          {/* Create Style Profile Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Style Profile</CardTitle>
                <CardDescription>
                  Define a unique musical style that others can use in their productions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Style profile name"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                />
                <Textarea
                  placeholder="Describe this style profile and its characteristics..."
                  value={newProfile.description}
                  onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                />
                <Input
                  placeholder="Genre tags (comma separated)"
                  value={newProfile.genre_tags}
                  onChange={(e) => setNewProfile({...newProfile, genre_tags: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Price in cents (0 for free)"
                  value={newProfile.price_cents}
                  onChange={(e) => setNewProfile({...newProfile, price_cents: parseInt(e.target.value) || 0})}
                />
                
                <div className="flex gap-2">
                  <Button onClick={createStyleProfile} disabled={loading}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Profile
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Profiles List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProfiles.map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <Badge variant={profile.is_public ? "default" : "secondary"}>
                      {profile.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {profile.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Downloads: {profile.download_count}</span>
                    <span>Rating: {profile.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Price: ${(profile.price_cents / 100).toFixed(2)}</span>
                    <span>Revenue: ${((profile.download_count * profile.price_cents) / 100).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {myProfiles.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No style profiles yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first style profile to start sharing and monetizing your unique musical styles
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Your First Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};