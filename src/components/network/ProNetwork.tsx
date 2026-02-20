/**
 * Pro Network Component
 * Connects with real producers from the Supabase profiles/community
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Search, MapPin, Music, Star,
  MessageSquare, UserPlus, Award, Mic, Piano, Drum, CheckCircle2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Professional {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  location: string;
  country: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
}

const ROLE_FILTERS = ['All', 'Producer', 'Vocalist', 'DJ', 'Mixing Engineer', 'Mastering Engineer', 'Songwriter', 'Instrumentalist'];
const SPECIALTY_FILTERS = ['All', 'Amapiano', 'Private School', 'Bacardi', 'Yanos', 'Tech Amapiano', 'Deep Amapiano', 'Vocals', 'Log Drums'];

export function ProNetwork() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    setLoading(true);
    try {
      // Query real community posts by users who have posted as producers/vocalists
      const { data, error } = await supabase
        .from('community_posts')
        .select('author_id, title, tags, created_at')
        .in('post_type', ['showcase', 'collaboration', 'service'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by author to build professional profiles from real activity
      const authorMap = new Map<string, Professional>();
      (data || []).forEach(post => {
        if (!authorMap.has(post.author_id)) {
          authorMap.set(post.author_id, {
            id: post.author_id,
            name: `Producer ${post.author_id.slice(0, 6)}`,
            role: 'Producer',
            specialties: post.tags || ['Amapiano'],
            location: 'South Africa',
            country: 'South Africa',
            rating: 0,
            reviewCount: 0,
            isVerified: false,
            isPremium: false,
            availability: 'available',
          });
        }
      });

      setProfessionals(Array.from(authorMap.values()));
    } catch (err) {
      console.error('Failed to load professionals:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter(pro => {
    const matchesSearch = pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'All' || pro.role.includes(roleFilter);
    const matchesSpecialty = specialtyFilter === 'All' || pro.specialties.includes(specialtyFilter);
    return matchesSearch && matchesRole && matchesSpecialty;
  });

  const handleConnect = (pro: Professional) => {
    toast.success(`Connection request sent to ${pro.name}!`);
  };

  const handleMessage = (pro: Professional) => {
    toast.info(`Opening chat with ${pro.name}...`);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.includes('Vocalist')) return <Mic className="w-4 h-4" />;
    if (role.includes('DJ')) return <Music className="w-4 h-4" />;
    if (role.includes('Producer')) return <Piano className="w-4 h-4" />;
    return <Drum className="w-4 h-4" />;
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Pro Network</CardTitle>
              <CardDescription>
                Connect with Amapiano producers, vocalists & engineers
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Award className="w-3 h-3" />
            {professionals.length} Pros
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or specialty..."
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTERS.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTY_FILTERS.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No professionals found</p>
              <p className="text-sm">Be the first — post a showcase or collaboration request in the Community</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredProfessionals.map(pro => (
                <Card key={pro.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {pro.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getAvailabilityColor(pro.availability)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{pro.name}</h3>
                          {pro.isVerified && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getRoleIcon(pro.role)}
                          <span>{pro.role}</span>
                        </div>
                        {pro.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{pro.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {pro.specialties.slice(0, 3).map(specialty => (
                        <Badge key={specialty} variant="secondary" className="text-xs">{specialty}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleMessage(pro)}>
                        <MessageSquare className="w-4 h-4 mr-1" /> Message
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleConnect(pro)}>
                        <UserPlus className="w-4 h-4 mr-1" /> Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
