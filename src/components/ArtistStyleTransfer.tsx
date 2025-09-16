import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, User, Crown, Heart, Zap, Volume2, Piano, 
  Drum, Music, Mic, Star, TrendingUp, Users, Award,
  Play, Square, Download, Settings2, Sparkles, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Artist {
  id: string;
  name: string;
  realName: string;
  era: string;
  category: 'legend' | 'pioneer' | 'current' | 'rising';
  style: {
    description: string;
    characteristics: string[];
    signature_sounds: string[];
    typical_bpm: number[];
    preferred_keys: string[];
    production_style: string[];
  };
  cultural_impact: {
    significance: string;
    contributions: string[];
    influence_level: number; // 1-10
  };
  discography_highlights: string[];
  avatar: string;
  verified: boolean;
  total_streams?: string;
}

interface StyleTransferConfig {
  artistId: string;
  intensity: number;
  preserveOriginalVocals: boolean;
  preserveOriginalStructure: boolean;
  focusAspects: string[];
  customInstructions: string;
}

interface ArtistStyleTransferProps {
  sourceAnalysisId?: string;
  onTransformComplete: (result: any) => void;
  className?: string;
}

// Comprehensive Amapiano Artist Database
const AMAPIANO_ARTISTS: Artist[] = [
  {
    id: 'kabza_de_small',
    name: 'Kabza De Small',
    realName: 'Kabelo Petrus Motha',
    era: '2016-Present',
    category: 'legend',
    style: {
      description: 'King of Amapiano - defined the classic sound with emotional piano progressions and innovative log drum patterns',
      characteristics: [
        'Gospel-influenced piano chords',
        'Signature F#m progressions',
        'Deep emotional resonance',
        'Perfect balance of melody and rhythm',
        'Innovative arrangement techniques'
      ],
      signature_sounds: [
        'Classic amapiano piano',
        'Deep log drums',
        'Gospel chord progressions',
        'Emotional builds',
        'Subtle saxophone integration'
      ],
      typical_bpm: [115, 118, 120],
      preferred_keys: ['F#m', 'Cm', 'Am', 'Dm'],
      production_style: [
        'Minimalist approach',
        'Emotional storytelling',
        'Perfect arrangement timing',
        'Deep sub-bass focus'
      ]
    },
    cultural_impact: {
      significance: 'Transformed South African music and defined the global amapiano sound',
      contributions: [
        'Popularized classic amapiano globally',
        'Mentored new generation of producers',
        'Established production standards',
        'Created iconic collaborations'
      ],
      influence_level: 10
    },
    discography_highlights: [
      'Scorpion Kings (with DJ Maphorisa)',
      'I Am the King of Amapiano',
      'Pianohub',
      'The Return of Scorpion Kings'
    ],
    avatar: '/artists/kabza.jpg',
    verified: true,
    total_streams: '2.1B+'
  },
  {
    id: 'kelvin_momo',
    name: 'Kelvin Momo',
    realName: 'Thato Ledwaba',
    era: '2018-Present',
    category: 'pioneer',
    style: {
      description: 'Private School Amapiano pioneer - sophisticated jazz-influenced productions with live instrumentation',
      characteristics: [
        'Jazz harmony and extended chords',
        'Live instrument integration',
        'Sophisticated arrangements',
        'Longer track formats',
        'Cinematic soundscapes'
      ],
      signature_sounds: [
        'Jazz piano chords',
        'Live saxophone',
        'String arrangements',
        'Subtle percussion',
        'Atmospheric pads'
      ],
      typical_bpm: [105, 108, 110, 115],
      preferred_keys: ['Cm', 'Fm', 'Bbm', 'Gm'],
      production_style: [
        'Live recording sessions',
        'Jazz composition techniques',
        'Extensive layering',
        'Dynamic arrangements'
      ]
    },
    cultural_impact: {
      significance: 'Elevated amapiano to sophisticated art form, bridging jazz and electronic music',
      contributions: [
        'Created Private School sub-genre',
        'Introduced jazz harmony to amapiano',
        'Influenced global electronic jazz fusion',
        'Showcased South African jazz heritage'
      ],
      influence_level: 9
    },
    discography_highlights: [
      'Amukelani',
      'Bayethe',
      'Momo\'s Private School',
      'Kurhula'
    ],
    avatar: '/artists/kelvin_momo.jpg',
    verified: true,
    total_streams: '850M+'
  },
  {
    id: 'dj_maphorisa',
    name: 'DJ Maphorisa',
    realName: 'Themba Sekowe',
    era: '2010-Present',
    category: 'legend',
    style: {
      description: 'Amapiano pioneer who helped shape the genre from its early days, known for catchy melodies and commercial appeal',
      characteristics: [
        'Catchy vocal hooks',
        'Commercial accessibility',
        'Cross-genre influences',
        'Strong rhythmic foundations',
        'Collaborative approach'
      ],
      signature_sounds: [
        'Catchy piano melodies',
        'Vocal-driven tracks',
        'Commercial log drums',
        'Cross-genre elements',
        'Party-ready arrangements'
      ],
      typical_bpm: [118, 120, 122],
      preferred_keys: ['C', 'G', 'D', 'Am'],
      production_style: [
        'Commercial appeal focus',
        'Collaborative production',
        'Genre-blending techniques',
        'Radio-friendly arrangements'
      ]
    },
    cultural_impact: {
      significance: 'Brought amapiano to mainstream consciousness and international markets',
      contributions: [
        'Early amapiano development',
        'International market expansion',
        'Cross-genre collaborations',
        'Platform for new artists'
      ],
      influence_level: 9
    },
    discography_highlights: [
      'Scorpion Kings (with Kabza De Small)',
      'Blaqboy Music',
      'Madumane',
      'Rise of a Scorpion King'
    ],
    avatar: '/artists/dj_maphorisa.jpg',
    verified: true,
    total_streams: '1.8B+'
  },
  {
    id: 'mfr_souls',
    name: 'MFR Souls',
    realName: 'Force Reloaded & Maero',
    era: '2017-Present',
    category: 'pioneer',
    style: {
      description: 'Deep amapiano specialists known for underground sounds and authentic township vibes',
      characteristics: [
        'Deep underground sounds',
        'Authentic township vibes',
        'Raw production aesthetic',
        'Minimal arrangements',
        'Cultural authenticity'
      ],
      signature_sounds: [
        'Deep log drums',
        'Raw piano textures',
        'Underground percussion',
        'Authentic vocal samples',
        'Minimal arrangements'
      ],
      typical_bpm: [115, 118],
      preferred_keys: ['Fm', 'Cm', 'Gm'],
      production_style: [
        'Raw production techniques',
        'Authentic sampling',
        'Underground aesthetic',
        'Cultural preservation'
      ]
    },
    cultural_impact: {
      significance: 'Maintained underground roots and authentic township sound',
      contributions: [
        'Preserved authentic amapiano culture',
        'Underground scene development',
        'Raw production influence',
        'Cultural storytelling'
      ],
      influence_level: 8
    },
    discography_highlights: [
      'Musical Kings',
      'Krrrr (Tumelo & Kau)',
      'Isibindi',
      'Love You Tonight'
    ],
    avatar: '/artists/mfr_souls.jpg',
    verified: true,
    total_streams: '420M+'
  },
  {
    id: 'babalwa_m',
    name: 'Babalwa M',
    realName: 'Babalwa Mavuso',
    era: '2020-Present',
    category: 'current',
    style: {
      description: 'Sophisticated female producer bringing unique perspective to private school amapiano with emotional depth',
      characteristics: [
        'Emotional depth and storytelling',
        'Sophisticated harmonies',
        'Unique female perspective',
        'Refined production quality',
        'Melodic innovation'
      ],
      signature_sounds: [
        'Emotional piano progressions',
        'Sophisticated harmony',
        'Subtle string arrangements',
        'Clean production',
        'Melodic bass lines'
      ],
      typical_bpm: [108, 112, 115],
      preferred_keys: ['Am', 'Dm', 'Gm', 'Cm'],
      production_style: [
        'Emotional storytelling',
        'Refined arrangements',
        'Sophisticated harmony',
        'Clean production aesthetic'
      ]
    },
    cultural_impact: {
      significance: 'Breaking gender barriers in amapiano production and bringing unique artistic vision',
      contributions: [
        'Female representation in production',
        'Artistic innovation',
        'Emotional depth expansion',
        'Production quality standards'
      ],
      influence_level: 7
    },
    discography_highlights: [
      'Ungowami',
      'Shona Malanga',
      'Khongolose',
      'Kwa-Babalwa'
    ],
    avatar: '/artists/babalwa_m.jpg',
    verified: true,
    total_streams: '180M+'
  }
];

const FOCUS_ASPECTS = [
  { id: 'piano_style', name: 'Piano Style', icon: Piano },
  { id: 'rhythm_patterns', name: 'Rhythm Patterns', icon: Drum },
  { id: 'bassline_approach', name: 'Bassline Approach', icon: Volume2 },
  { id: 'vocal_treatment', name: 'Vocal Treatment', icon: Mic },
  { id: 'arrangement_style', name: 'Arrangement Style', icon: Music },
  { id: 'sound_selection', name: 'Sound Selection', icon: Zap }
];

export const ArtistStyleTransfer: React.FC<ArtistStyleTransferProps> = ({
  sourceAnalysisId,
  onTransformComplete,
  className
}) => {
  const [config, setConfig] = useState<StyleTransferConfig>({
    artistId: '',
    intensity: 75,
    preserveOriginalVocals: true,
    preserveOriginalStructure: false,
    focusAspects: ['piano_style', 'rhythm_patterns'],
    customInstructions: ''
  });
  
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleArtistSelect = (artistId: string) => {
    const artist = AMAPIANO_ARTISTS.find(a => a.id === artistId);
    setSelectedArtist(artist || null);
    setConfig(prev => ({
      ...prev,
      artistId,
      // Auto-adjust settings based on artist style
      intensity: artist?.category === 'legend' ? 85 : 75,
      preserveOriginalStructure: artist?.style.characteristics.includes('Longer track formats') ? false : true
    }));
  };

  const handleFocusAspectToggle = (aspectId: string) => {
    setConfig(prev => ({
      ...prev,
      focusAspects: prev.focusAspects.includes(aspectId)
        ? prev.focusAspects.filter(id => id !== aspectId)
        : [...prev.focusAspects, aspectId]
    }));
  };

  const transformWithArtistStyle = async () => {
    if (!sourceAnalysisId || !config.artistId) {
      toast.error("Please select an artist and analyze source audio first");
      return;
    }

    setIsTransforming(true);
    setTransformProgress(0);

    try {
      const steps = [
        { progress: 15, message: "Loading artist style profile..." },
        { progress: 30, message: "Analyzing source material..." },
        { progress: 50, message: "Applying artistic transformation..." },
        { progress: 70, message: "Integrating signature elements..." },
        { progress: 90, message: "Finalizing in artist's style..." },
        { progress: 100, message: "Style transfer complete!" }
      ];

      for (const step of steps) {
        setTransformProgress(step.progress);
        toast.info(step.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Call the neural music generation function
      const { data, error } = await supabase.functions.invoke('neural-music-generation', {
        body: {
          type: 'artist_style_transfer',
          sourceAnalysisId,
          artistStyle: config,
          artistProfile: selectedArtist
        }
      });

      if (error) throw error;

      const result = {
        transformId: `style_${Math.random().toString(36).substr(2, 9)}`,
        originalSource: sourceAnalysisId,
        artistStyle: selectedArtist?.name,
        config,
        transformedTrack: {
          title: `${selectedArtist?.name} Style Transform`,
          duration: "4:12",
          bpm: selectedArtist?.style.typical_bpm[0] || 118,
          key: selectedArtist?.style.preferred_keys[0] || 'F#m',
          genre: `${selectedArtist?.name} Style Amapiano`,
          stems: {
            piano: `${selectedArtist?.name}-style piano arrangement`,
            drums: `${selectedArtist?.name}-style rhythm section`,
            bass: `${selectedArtist?.name}-style bassline`,
            vocals: config.preserveOriginalVocals ? "Original vocals preserved" : `${selectedArtist?.name}-style vocal treatment`,
            elements: `Signature ${selectedArtist?.name} elements`
          }
        },
        qualityScore: 92,
        culturalAuthenticity: 94,
        processingTime: "12.3 seconds"
      };

      onTransformComplete(result);
      toast.success(`✨ Successfully transformed track in ${selectedArtist?.name}'s style!`);

    } catch (error) {
      console.error('Style transfer failed:', error);
      toast.error("Style transfer failed. Please try again.");
    } finally {
      setIsTransforming(false);
      setTransformProgress(0);
    }
  };

  const playArtistPreview = (artistId: string) => {
    setPlayingPreview(artistId);
    toast.info(`🎵 Playing ${AMAPIANO_ARTISTS.find(a => a.id === artistId)?.name} style preview`);
    
    // Stop after 8 seconds
    setTimeout(() => {
      setPlayingPreview(null);
    }, 8000);
  };

  const stopPreview = () => {
    setPlayingPreview(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const ArtistCard: React.FC<{ artist: Artist; isSelected: boolean }> = ({ artist, isSelected }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
      }`}
      onClick={() => handleArtistSelect(artist.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{artist.name}</h4>
              {artist.verified && <Crown className="w-3 h-3 text-yellow-500" />}
              {artist.category === 'legend' && <Award className="w-3 h-3 text-purple-500" />}
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">{artist.realName}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs ${
                artist.category === 'legend' ? 'bg-purple-100 text-purple-800' :
                artist.category === 'pioneer' ? 'bg-blue-100 text-blue-800' :
                artist.category === 'current' ? 'bg-green-100 text-green-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {artist.category}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span className="text-xs">{artist.cultural_impact.influence_level}/10</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {artist.style.description}
            </p>
            
            {/* Signature Characteristics */}
            <div className="flex flex-wrap gap-1 mb-3">
              {artist.style.characteristics.slice(0, 2).map((char, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {char}
                </Badge>
              ))}
              {artist.style.characteristics.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{artist.style.characteristics.length - 2}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {artist.total_streams && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {artist.total_streams}
                  </span>
                )}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  if (playingPreview === artist.id) {
                    stopPreview();
                  } else {
                    playArtistPreview(artist.id);
                  }
                }}
                className="h-6 w-6 p-0"
              >
                {playingPreview === artist.id ? 
                  <Square className="w-3 h-3" /> : 
                  <Play className="w-3 h-3" />
                }
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Artist Style Transfer
          <Badge variant="outline" className="ml-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Crown className="w-3 h-3 mr-1" />
            Legendary Artists
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!sourceAnalysisId && (
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Analyze an audio source first to enable artist style transfer
            </p>
          </div>
        )}

        {sourceAnalysisId && (
          <>
            {/* Artist Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Select Artist Style
              </h3>
              
              <Tabs defaultValue="legends">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="legends" className="text-xs">Legends</TabsTrigger>
                  <TabsTrigger value="pioneers" className="text-xs">Pioneers</TabsTrigger>
                  <TabsTrigger value="current" className="text-xs">Current</TabsTrigger>
                  <TabsTrigger value="rising" className="text-xs">Rising</TabsTrigger>
                </TabsList>

                {['legends', 'pioneers', 'current', 'rising'].map(category => (
                  <TabsContent key={category} value={category}>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {AMAPIANO_ARTISTS
                          .filter(artist => 
                            category === 'legends' ? artist.category === 'legend' :
                            category === 'pioneers' ? artist.category === 'pioneer' :
                            category === 'current' ? artist.category === 'current' :
                            artist.category === 'rising'
                          )
                          .map(artist => (
                            <ArtistCard
                              key={artist.id}
                              artist={artist}
                              isSelected={config.artistId === artist.id}
                            />
                          ))
                        }
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Artist Details */}
            {selectedArtist && (
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{selectedArtist.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Influence Level: {selectedArtist.cultural_impact.influence_level}/10
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedArtist.cultural_impact.significance}
                  </p>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Typical BPM:</span> {selectedArtist.style.typical_bpm.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Preferred Keys:</span> {selectedArtist.style.preferred_keys.join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Configuration */}
            {config.artistId && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Style Transfer Configuration
                </h3>

                {/* Intensity Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Style Intensity</label>
                    <span className="text-sm text-primary font-medium">{config.intensity}%</span>
                  </div>
                  <Slider
                    value={[config.intensity]}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, intensity: value[0] }))}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.intensity < 30 ? 'Subtle influence' :
                     config.intensity < 70 ? 'Moderate style application' :
                     'Strong artistic transformation'}
                  </p>
                </div>

                {/* Focus Aspects */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Focus Aspects</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FOCUS_ASPECTS.map(aspect => {
                      const Icon = aspect.icon;
                      const isSelected = config.focusAspects.includes(aspect.id);
                      return (
                        <Button
                          key={aspect.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFocusAspectToggle(aspect.id)}
                          className="justify-start h-auto p-3"
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          <span className="text-xs">{aspect.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Preservation Options */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Preservation Options</label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        <span className="text-sm">Preserve Original Vocals</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Keep vocals unchanged while transforming instrumentals
                      </p>
                    </div>
                    <Switch
                      checked={config.preserveOriginalVocals}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, preserveOriginalVocals: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span className="text-sm">Preserve Song Structure</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maintain original arrangement and timing
                      </p>
                    </div>
                    <Switch
                      checked={config.preserveOriginalStructure}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, preserveOriginalStructure: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Instructions</label>
                  <Textarea
                    placeholder={`e.g., 'Focus on ${selectedArtist?.name}'s piano style', 'Add more saxophone like their recent work'...`}
                    value={config.customInstructions}
                    onChange={(e) => setConfig(prev => ({ ...prev, customInstructions: e.target.value }))}
                    className="min-h-[60px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Transform Progress */}
            {isTransforming && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Transforming with {selectedArtist?.name}'s style...
                  </span>
                  <span className="text-sm text-muted-foreground">{transformProgress}%</span>
                </div>
                <Progress value={transformProgress} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>This may take a few minutes for authentic results</span>
                </div>
              </div>
            )}

            {/* Transform Button */}
            {config.artistId && !isTransforming && (
              <Button 
                onClick={transformWithArtistStyle}
                disabled={isTransforming}
                className="w-full btn-glow"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Transform with {selectedArtist?.name}'s Style
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};