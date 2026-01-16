import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Mic2, 
  Play, 
  Pause, 
  Search, 
  Star, 
  Sparkles,
  Volume2,
  Music,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoicePersona {
  id: string;
  name: string;
  description: string;
  style: string;
  gender: 'male' | 'female' | 'neutral';
  language: string[];
  previewUrl?: string;
  isPopular?: boolean;
  isNew?: boolean;
  tags: string[];
}

interface PersonaVoiceSelectorProps {
  selectedVoiceId: string | null;
  onSelectVoice: (voiceId: string) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'nkosazana-daughter',
    name: 'Nkosazana Daughter',
    description: 'Soulful Amapiano vocals with rich harmonics',
    style: 'Amapiano Queen',
    gender: 'female',
    language: ['Zulu', 'English'],
    isPopular: true,
    tags: ['soulful', 'melodic', 'powerful']
  },
  {
    id: 'dj-maphorisa',
    name: 'Madumane Style',
    description: 'Deep, resonant male vocals with Amapiano flair',
    style: 'Producer Voice',
    gender: 'male',
    language: ['Zulu', 'Sotho', 'English'],
    isPopular: true,
    tags: ['deep', 'rhythmic', 'commanding']
  },
  {
    id: 'young-stunna',
    name: 'Stunna Flow',
    description: 'Youthful, energetic vocal delivery',
    style: 'New Wave',
    gender: 'male',
    language: ['Zulu', 'English'],
    isNew: true,
    tags: ['energetic', 'fresh', 'catchy']
  },
  {
    id: 'kamo-mphela',
    name: 'Mphela Energy',
    description: 'High-energy female vocals with dance vibes',
    style: 'Dance Captain',
    gender: 'female',
    language: ['Zulu', 'Sotho'],
    isPopular: true,
    tags: ['energetic', 'danceable', 'powerful']
  },
  {
    id: 'focalistic',
    name: 'Pitori Flow',
    description: 'Rapid-fire delivery with Pretoria swagger',
    style: 'Pitori Maradona',
    gender: 'male',
    language: ['Sepedi', 'Zulu', 'English'],
    tags: ['fast', 'rhythmic', 'swagger']
  },
  {
    id: 'elaine',
    name: 'R&B Soul',
    description: 'Smooth R&B-influenced vocals',
    style: 'Neo-Soul',
    gender: 'female',
    language: ['English', 'Zulu'],
    tags: ['smooth', 'soulful', 'melodic']
  },
  {
    id: 'kabza-de-small',
    name: 'Piano King Style',
    description: 'Producer ad-libs and hooks',
    style: 'Producer Tags',
    gender: 'male',
    language: ['Zulu', 'English'],
    isPopular: true,
    tags: ['hooks', 'ad-libs', 'signature']
  },
  {
    id: 'musa-keys',
    name: 'Keys Voice',
    description: 'Jazzy, sophisticated vocal style',
    style: 'Jazz Piano',
    gender: 'male',
    language: ['Zulu', 'English'],
    isNew: true,
    tags: ['jazzy', 'sophisticated', 'smooth']
  },
  {
    id: 'lady-du',
    name: 'Lady Style',
    description: 'Powerful female MC vocals',
    style: 'Gqom-Piano Fusion',
    gender: 'female',
    language: ['Zulu', 'Xhosa'],
    tags: ['powerful', 'MC', 'commanding']
  },
  {
    id: 'custom-neutral',
    name: 'AI Neutral',
    description: 'Versatile AI voice that adapts to any style',
    style: 'Adaptive',
    gender: 'neutral',
    language: ['All'],
    tags: ['versatile', 'adaptive', 'clean']
  }
];

export function PersonaVoiceSelector({
  selectedVoiceId,
  onSelectVoice,
  pitch,
  onPitchChange,
  speed,
  onSpeedChange
}: PersonaVoiceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'male' | 'female'>('all');

  const filteredVoices = VOICE_PERSONAS.filter(voice => {
    const matchesSearch = 
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filter === 'all' || voice.gender === filter;
    
    return matchesSearch && matchesFilter;
  });

  const togglePlay = (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(voiceId);
      // Simulate preview playback
      setTimeout(() => setPlayingVoiceId(null), 3000);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Mic2 className="h-5 w-5 text-primary" />
          Voice Personas
        </CardTitle>
        <CardDescription>
          Choose an AI voice style for your track
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search voices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'male' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('male')}
            >
              Male
            </Button>
            <Button
              variant={filter === 'female' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('female')}
            >
              Female
            </Button>
          </div>
        </div>

        {/* Voice List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {filteredVoices.map((voice) => (
              <div
                key={voice.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedVoiceId === voice.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => onSelectVoice(voice.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{voice.name}</span>
                      {voice.isPopular && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          <Star className="h-2.5 w-2.5 mr-0.5" />
                          Popular
                        </Badge>
                      )}
                      {voice.isNew && (
                        <Badge className="text-[10px] px-1.5 bg-green-500">
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {voice.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {voice.style}
                      </Badge>
                      {voice.language.slice(0, 2).map((lang) => (
                        <Badge key={lang} variant="outline" className="text-[10px]">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {selectedVoiceId === voice.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay(voice.id);
                      }}
                    >
                      {playingVoiceId === voice.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Voice Controls */}
        {selectedVoiceId && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Pitch</Label>
                <span className="text-xs text-muted-foreground">
                  {pitch > 0 ? `+${pitch}` : pitch} semitones
                </span>
              </div>
              <Slider
                value={[pitch + 12]}
                onValueChange={([v]) => onPitchChange(v - 12)}
                min={0}
                max={24}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Speed</Label>
                <span className="text-xs text-muted-foreground">
                  {speed.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[speed * 100]}
                onValueChange={([v]) => onSpeedChange(v / 100)}
                min={50}
                max={150}
                step={5}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
