/**
 * Producer DNA Panel
 * Switchable producer profiles with style morphing
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  User, Zap, Music, Waves, Settings2, 
  ArrowRight, Sparkles, Volume2
} from 'lucide-react';
import { 
  PRODUCER_DNA_PRESETS, 
  ProducerDNAProfile,
  morphProducerDNA,
  calculateCulturalScore
} from '@/lib/audio/ProducerDNA';

interface ProducerDNAPanelProps {
  selectedProfileId: string;
  onProfileChange: (profileId: string) => void;
  currentSettings?: Partial<ProducerDNAProfile>;
  onApplyMorph?: (morphedProfile: ProducerDNAProfile) => void;
}

const STYLE_COLORS: Record<string, string> = {
  quantum: 'bg-purple-500',
  soulful: 'bg-blue-500',
  tech: 'bg-green-500',
  sgija: 'bg-red-500',
  private_school: 'bg-cyan-500',
};

const REGION_LABELS: Record<string, string> = {
  gauteng: '🇿🇦 Gauteng',
  durban: '🌊 Durban',
  cape_town: '🏔️ Cape Town',
  mpumalanga: '🌿 Mpumalanga',
};

export const ProducerDNAPanel: React.FC<ProducerDNAPanelProps> = ({
  selectedProfileId,
  onProfileChange,
  currentSettings,
  onApplyMorph,
}) => {
  const [morphMode, setMorphMode] = useState(false);
  const [morphTarget, setMorphTarget] = useState<string | null>(null);
  const [morphBlend, setMorphBlend] = useState(0.5);
  
  const selectedProfile = PRODUCER_DNA_PRESETS.find(p => p.id === selectedProfileId) || PRODUCER_DNA_PRESETS[0];
  const targetProfile = morphTarget ? PRODUCER_DNA_PRESETS.find(p => p.id === morphTarget) : null;
  
  // Calculate cultural authenticity
  const culturalScore = calculateCulturalScore(selectedProfile, currentSettings || {});
  
  // Generate morphed profile
  const morphedProfile = targetProfile 
    ? morphProducerDNA(selectedProfile, targetProfile, morphBlend)
    : null;
  
  const handleApplyMorph = () => {
    if (morphedProfile && onApplyMorph) {
      onApplyMorph(morphedProfile);
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Producer DNA
          <Badge variant="outline" className="ml-auto">
            {selectedProfile.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Producer Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">SELECT PROFILE</span>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCER_DNA_PRESETS.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => onProfileChange(profile.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      selectedProfileId === profile.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("w-2 h-2 rounded-full", STYLE_COLORS[profile.style])} />
                      <span className="text-sm font-medium">{profile.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{REGION_LABELS[profile.region]}</span>
                      <span>•</span>
                      <span>{profile.bpmRange.sweet} BPM</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Profile Details */}
            <div className="space-y-3">
              <span className="text-xs font-medium text-muted-foreground">PROFILE DETAILS</span>
              
              <p className="text-xs text-muted-foreground">
                {selectedProfile.description}
              </p>
              
              {/* Key Parameters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground">Log Drum</div>
                  <div className="font-medium">
                    Distortion: {Math.round(selectedProfile.logDrum.distortion * 100)}%
                  </div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground">Groove</div>
                  <div className="font-medium">
                    Micro-timing: {selectedProfile.groove.microTiming}ms
                  </div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground">Bass</div>
                  <div className="font-medium">
                    Sidechain: {Math.round(selectedProfile.bass.sidechainDepth * 100)}%
                  </div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-muted-foreground">Drop</div>
                  <div className="font-medium">
                    Intensity: {Math.round(selectedProfile.arrangement.dropIntensity * 100)}%
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Cultural Authenticity Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">AUTHENTICITY SCORE</span>
                <Badge 
                  variant={culturalScore.score >= 80 ? 'default' : culturalScore.score >= 60 ? 'secondary' : 'outline'}
                >
                  {culturalScore.score}%
                </Badge>
              </div>
              
              {/* Score breakdown */}
              <div className="space-y-1">
                {Object.entries(culturalScore.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-20 capitalize">{key}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-[10px] w-8 text-right">{value}%</span>
                  </div>
                ))}
              </div>
              
              {/* Suggestions */}
              {culturalScore.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {culturalScore.suggestions.slice(0, 2).map((suggestion, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                      <Sparkles className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Style Morph */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">STYLE MORPH</span>
                <Button
                  variant={morphMode ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setMorphMode(!morphMode)}
                >
                  <Waves className="h-3 w-3 mr-1" />
                  {morphMode ? 'Active' : 'Enable'}
                </Button>
              </div>
              
              {morphMode && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{selectedProfile.name}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <select
                      value={morphTarget || ''}
                      onChange={(e) => setMorphTarget(e.target.value)}
                      className="flex-1 h-7 text-xs bg-muted border border-border rounded px-2"
                    >
                      <option value="">Select target...</option>
                      {PRODUCER_DNA_PRESETS.filter(p => p.id !== selectedProfileId).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {morphTarget && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{selectedProfile.name}</span>
                          <span>{Math.round(morphBlend * 100)}%</span>
                          <span>{targetProfile?.name}</span>
                        </div>
                        <Slider
                          value={[morphBlend * 100]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={([v]) => setMorphBlend(v / 100)}
                        />
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full h-8"
                        onClick={handleApplyMorph}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Apply Morphed Style
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
