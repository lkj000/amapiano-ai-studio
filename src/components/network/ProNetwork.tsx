/**
 * Pro Network Component
 * LANDR-inspired professional network for connecting with producers
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  MapPin, 
  Music, 
  Star,
  MessageSquare,
  UserPlus,
  Filter,
  Award,
  Mic,
  Piano,
  Drum,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface Professional {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  location: string;
  country: string;
  avatar?: string;
  credits: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
  hourlyRate?: number;
  availability: 'available' | 'busy' | 'unavailable';
}

const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: '1',
    name: 'Kabza De Small',
    role: 'Producer',
    specialties: ['Amapiano', 'Private School', 'Deep House'],
    location: 'Johannesburg',
    country: 'South Africa',
    credits: ['Scorpion Kings', 'DJ Maphorisa', 'Focalistic'],
    rating: 4.9,
    reviewCount: 156,
    isVerified: true,
    isPremium: true,
    hourlyRate: 150,
    availability: 'busy'
  },
  {
    id: '2',
    name: 'MFR Souls',
    role: 'Producer, DJ',
    specialties: ['Amapiano', 'Yanos', 'Groove'],
    location: 'Pretoria',
    country: 'South Africa',
    credits: ['Love You Tonight', 'Amanikiniki'],
    rating: 4.8,
    reviewCount: 89,
    isVerified: true,
    isPremium: false,
    hourlyRate: 100,
    availability: 'available'
  },
  {
    id: '3',
    name: 'Tyler ICU',
    role: 'Producer',
    specialties: ['Amapiano', 'Bacardi', 'Tech Amapiano'],
    location: 'Gauteng',
    country: 'South Africa',
    credits: ['Banyana', 'Mnike', 'Tshwala Bam'],
    rating: 4.9,
    reviewCount: 203,
    isVerified: true,
    isPremium: true,
    hourlyRate: 200,
    availability: 'available'
  },
  {
    id: '4',
    name: 'Vigro Deep',
    role: 'Producer, DJ',
    specialties: ['Baby Boy', 'Amapiano', 'House'],
    location: 'Vereeniging',
    country: 'South Africa',
    credits: ['Baby Boy EP', 'Rise of the Baby Boy'],
    rating: 4.7,
    reviewCount: 67,
    isVerified: true,
    isPremium: false,
    hourlyRate: 80,
    availability: 'available'
  },
  {
    id: '5',
    name: 'Nandipha808',
    role: 'Vocalist, Producer',
    specialties: ['Vocals', 'Amapiano', 'Afro Soul'],
    location: 'Cape Town',
    country: 'South Africa',
    credits: ['Mnike', 'Various Features'],
    rating: 4.8,
    reviewCount: 45,
    isVerified: true,
    isPremium: false,
    hourlyRate: 120,
    availability: 'available'
  },
  {
    id: '6',
    name: 'Oscar Mbo',
    role: 'DJ, Producer',
    specialties: ['Amapiano', 'Afro Tech', 'Deep House'],
    location: 'Durban',
    country: 'South Africa',
    credits: ['Asante Sana', 'Moya Wami'],
    rating: 4.6,
    reviewCount: 78,
    isVerified: true,
    isPremium: true,
    hourlyRate: 90,
    availability: 'busy'
  },
];

const ROLE_FILTERS = [
  'All',
  'Producer',
  'Vocalist',
  'DJ',
  'Mixing Engineer',
  'Mastering Engineer',
  'Songwriter',
  'Instrumentalist'
];

const SPECIALTY_FILTERS = [
  'All',
  'Amapiano',
  'Private School',
  'Bacardi',
  'Yanos',
  'Tech Amapiano',
  'Deep Amapiano',
  'Vocals',
  'Log Drums'
];

export function ProNetwork() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [professionals] = useState<Professional[]>(MOCK_PROFESSIONALS);

  const filteredProfessionals = professionals.filter(pro => {
    const matchesSearch = pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pro.location.toLowerCase().includes(searchQuery.toLowerCase());
    
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
                Connect with top Amapiano producers, vocalists & engineers
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Award className="w-3 h-3" />
            {professionals.length} Pros Available
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
              placeholder="Search by name, specialty, or location..."
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
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProfessionals.map(pro => (
              <Card key={pro.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {pro.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getAvailabilityColor(pro.availability)}`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{pro.name}</h3>
                        {pro.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        {pro.isPremium && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600">
                            PRO
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getRoleIcon(pro.role)}
                        <span>{pro.role}</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{pro.location}, {pro.country}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{pro.rating}</span>
                          <span className="text-xs text-muted-foreground">({pro.reviewCount})</span>
                        </div>
                        {pro.hourlyRate && (
                          <Badge variant="outline" className="text-xs">
                            ${pro.hourlyRate}/hr
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {pro.specialties.slice(0, 3).map(specialty => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {pro.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{pro.specialties.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Credits */}
                  {pro.credits.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      Credits: {pro.credits.join(', ')}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleMessage(pro)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleConnect(pro)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProfessionals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No professionals found matching your criteria</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
