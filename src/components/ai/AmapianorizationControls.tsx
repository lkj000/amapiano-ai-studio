import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Sparkles, ChevronDown, Music2, Waves, Mic2 } from 'lucide-react';
import { REGIONAL_SWING_PROFILES } from '@/lib/dsp/regionalSwingProfiles';
import { AFRICAN_EUCLIDEAN_PATTERNS } from '@/lib/dsp/euclideanRhythm';
import { GASP_PATTERNS } from '@/lib/audio/amapianoGasp';

interface AmapianorizationControlsProps {
  onApply: (settings: AmapianorizationSettings) => Promise<void>;
  isProcessing?: boolean;
}

export interface AmapianorizationSettings {
  // Basic
  region: string;
  intensity: number;
  logDrums: boolean;
  percussion: boolean;
  piano: boolean;
  bass: boolean;
  sidechain: boolean;
  filterSweeps: boolean;
  
  // Advanced: Swing
  swingProfile?: string;
  customSwingPercentage?: number;
  
  // Advanced: Beat-1 Silence
  beat1Silence?: {
    enabled: boolean;
    preset?: 'drop-impact' | 'verse-subtle' | 'bridge-dramatic' | 'breakdown-sparse' | 'build-tension';
    duration?: 1 | 2 | 3 | 4;
    probability?: number;
  };
  
  // Advanced: Euclidean Patterns
  euclideanPatterns?: {
    logDrum?: string;
    percussion?: string;
    hihat?: string;
  };
  
  // Advanced: Vocal Settings
  vocalSettings?: {
    language?: string;
    adlibDensity?: 'minimal' | 'sparse' | 'moderate' | 'frequent' | 'dense';
    callResponse?: boolean;
  };
}

const swingProfiles = Object.entries(REGIONAL_SWING_PROFILES).map(([key, profile]) => ({
  key,
  name: profile.name,
  region: profile.region,
  swingPercentage: profile.swingPercentage,
  description: profile.description
}));

const euclideanPatterns = Object.entries(AFRICAN_EUCLIDEAN_PATTERNS).map(([key, pattern]) => ({
  key,
  description: pattern.description,
  pulses: pattern.pulses,
  steps: pattern.steps
}));

const beat1Presets = Object.entries(GASP_PATTERNS).map(([key, preset]) => ({
  key,
  name: preset.name,
  description: preset.description
}));

const vocalLanguages = [
  { key: 'zulu', name: 'isiZulu' },
  { key: 'xhosa', name: 'isiXhosa' },
  { key: 'sotho', name: 'Sesotho' },
  { key: 'tswana', name: 'Setswana' },
  { key: 'pedi', name: 'Sepedi' },
  { key: 'venda', name: 'Tshivenda' },
  { key: 'tsonga', name: 'Xitsonga' },
  { key: 'swati', name: 'siSwati' },
  { key: 'ndebele', name: 'isiNdebele' },
  { key: 'afrikaans', name: 'Afrikaans' },
  { key: 'english', name: 'English' }
];

export default function AmapianorizationControls({ onApply, isProcessing = false }: AmapianorizationControlsProps) {
  // Basic settings
  const [region, setRegion] = useState<string>('johannesburg');
  const [intensity, setIntensity] = useState([80]);
  const [logDrums, setLogDrums] = useState(true);
  const [percussion, setPercussion] = useState(true);
  const [piano, setPiano] = useState(true);
  const [bass, setBass] = useState(true);
  const [sidechain, setSidechain] = useState(true);
  const [filterSweeps, setFilterSweeps] = useState(true);
  
  // Advanced: Swing
  const [swingProfile, setSwingProfile] = useState<string>('johannesburg-deep');
  const [useCustomSwing, setUseCustomSwing] = useState(false);
  const [customSwingPercentage, setCustomSwingPercentage] = useState([58]);
  
  // Advanced: Beat-1 Silence
  const [beat1Enabled, setBeat1Enabled] = useState(true);
  const [beat1Preset, setBeat1Preset] = useState<string>('drop-impact');
  const [beat1Probability, setBeat1Probability] = useState([70]);
  
  // Advanced: Euclidean
  const [useEuclidean, setUseEuclidean] = useState(false);
  const [logDrumPattern, setLogDrumPattern] = useState<string>('log-drum-basic');
  const [percussionPattern, setPercussionPattern] = useState<string>('shaker-dense');
  const [hihatPattern, setHihatPattern] = useState<string>('hihat-offbeat');
  
  // Advanced: Vocals
  const [vocalLanguage, setVocalLanguage] = useState<string>('zulu');
  const [adlibDensity, setAdlibDensity] = useState<string>('moderate');
  const [callResponse, setCallResponse] = useState(true);
  
  // Advanced panel state
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selectedSwingProfile = useMemo(() => {
    return swingProfiles.find(p => p.key === swingProfile);
  }, [swingProfile]);

  const handleApply = async () => {
    await onApply({
      region,
      intensity: intensity[0],
      logDrums,
      percussion,
      piano,
      bass,
      sidechain,
      filterSweeps,
      swingProfile,
      customSwingPercentage: useCustomSwing ? customSwingPercentage[0] : undefined,
      beat1Silence: {
        enabled: beat1Enabled,
        preset: beat1Preset as any,
        probability: beat1Probability[0] / 100
      },
      euclideanPatterns: useEuclidean ? {
        logDrum: logDrumPattern,
        percussion: percussionPattern,
        hihat: hihatPattern
      } : undefined,
      vocalSettings: {
        language: vocalLanguage,
        adlibDensity: adlibDensity as any,
        callResponse
      }
    });
  };

  const regionDescriptions: Record<string, string> = {
    johannesburg: 'Urban, energetic, 58% Gauteng swing',
    pretoria: 'Bouncy, precise, jazzy undertones',
    durban: 'Gqom-influenced, aggressive, heavy bass',
    'cape-town': 'Jazz-influenced, atmospheric, deep',
    soweto: 'Raw township feel, heavy swing'
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Amapianorization Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Region Selection */}
        <div className="space-y-2">
          <Label>Regional Style</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="johannesburg">Johannesburg</SelectItem>
              <SelectItem value="pretoria">Pretoria</SelectItem>
              <SelectItem value="durban">Durban</SelectItem>
              <SelectItem value="cape-town">Cape Town</SelectItem>
              <SelectItem value="soweto">Soweto</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {regionDescriptions[region]}
          </p>
        </div>

        {/* Intensity */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Enhancement Intensity</Label>
            <span className="text-sm text-muted-foreground">{intensity[0]}%</span>
          </div>
          <Slider
            value={intensity}
            onValueChange={setIntensity}
            min={0}
            max={100}
            step={5}
          />
        </div>

        {/* Element Toggles */}
        <div className="space-y-3">
          <Label>Elements to Add</Label>
          <div className="grid grid-cols-2 gap-2">
            <Badge
              variant={logDrums ? "default" : "outline"}
              className="cursor-pointer justify-center py-2"
              onClick={() => setLogDrums(!logDrums)}
            >
              Log Drums
            </Badge>
            <Badge
              variant={percussion ? "default" : "outline"}
              className="cursor-pointer justify-center py-2"
              onClick={() => setPercussion(!percussion)}
            >
              Percussion
            </Badge>
            <Badge
              variant={piano ? "default" : "outline"}
              className="cursor-pointer justify-center py-2"
              onClick={() => setPiano(!piano)}
            >
              Piano
            </Badge>
            <Badge
              variant={bass ? "default" : "outline"}
              className="cursor-pointer justify-center py-2"
              onClick={() => setBass(!bass)}
            >
              Bass
            </Badge>
            <Badge
              variant={sidechain ? "default" : "outline"}
              className="cursor-pointer justify-center py-2"
              onClick={() => setSidechain(!sidechain)}
            >
              Sidechain
            </Badge>
            <Badge
              variant={filterSweeps ? "default" : "outline"}
              className="cursor-pointer justify-center py-2"
              onClick={() => setFilterSweeps(!filterSweeps)}
            >
              Filter Sweeps
            </Badge>
          </div>
        </div>

        {/* Advanced Settings */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              Advanced Settings
              <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <Tabs defaultValue="swing" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="swing" className="flex items-center gap-1">
                  <Waves className="w-3 h-3" />
                  Swing
                </TabsTrigger>
                <TabsTrigger value="rhythm" className="flex items-center gap-1">
                  <Music2 className="w-3 h-3" />
                  Rhythm
                </TabsTrigger>
                <TabsTrigger value="vocals" className="flex items-center gap-1">
                  <Mic2 className="w-3 h-3" />
                  Vocals
                </TabsTrigger>
              </TabsList>
              
              {/* Swing Tab */}
              <TabsContent value="swing" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Swing Profile</Label>
                  <Select value={swingProfile} onValueChange={setSwingProfile}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {swingProfiles.map(profile => (
                        <SelectItem key={profile.key} value={profile.key}>
                          <div className="flex flex-col">
                            <span>{profile.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {profile.swingPercentage}% swing
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSwingProfile && (
                    <p className="text-xs text-muted-foreground">
                      {selectedSwingProfile.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-swing">Custom Swing Override</Label>
                  <Switch
                    id="custom-swing"
                    checked={useCustomSwing}
                    onCheckedChange={setUseCustomSwing}
                  />
                </div>

                {useCustomSwing && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Swing Percentage</Label>
                      <span className="text-sm font-mono">{customSwingPercentage[0]}%</span>
                    </div>
                    <Slider
                      value={customSwingPercentage}
                      onValueChange={setCustomSwingPercentage}
                      min={50}
                      max={70}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">
                      50% = straight, 58.3% = Gauteng authentic, 66.7% = triplet swing
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Beat-1 Silence (Amapiano Gasp)</Label>
                      <p className="text-xs text-muted-foreground">
                        Characteristic silence on beat 1
                      </p>
                    </div>
                    <Switch
                      checked={beat1Enabled}
                      onCheckedChange={setBeat1Enabled}
                    />
                  </div>

                  {beat1Enabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Gasp Style</Label>
                        <Select value={beat1Preset} onValueChange={setBeat1Preset}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {beat1Presets.map(preset => (
                              <SelectItem key={preset.key} value={preset.key}>
                                {preset.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Probability</Label>
                          <span className="text-sm">{beat1Probability[0]}%</span>
                        </div>
                        <Slider
                          value={beat1Probability}
                          onValueChange={setBeat1Probability}
                          min={20}
                          max={100}
                          step={10}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              {/* Rhythm Tab */}
              <TabsContent value="rhythm" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Euclidean Rhythm Patterns</Label>
                    <p className="text-xs text-muted-foreground">
                      African polyrhythmic patterns
                    </p>
                  </div>
                  <Switch
                    checked={useEuclidean}
                    onCheckedChange={setUseEuclidean}
                  />
                </div>

                {useEuclidean && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Log Drum Pattern</Label>
                      <Select value={logDrumPattern} onValueChange={setLogDrumPattern}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {euclideanPatterns.map(pattern => (
                            <SelectItem key={pattern.key} value={pattern.key}>
                              <span>{pattern.key}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({pattern.pulses}/{pattern.steps})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Percussion Pattern</Label>
                      <Select value={percussionPattern} onValueChange={setPercussionPattern}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {euclideanPatterns.map(pattern => (
                            <SelectItem key={pattern.key} value={pattern.key}>
                              <span>{pattern.key}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({pattern.pulses}/{pattern.steps})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Hi-Hat Pattern</Label>
                      <Select value={hihatPattern} onValueChange={setHihatPattern}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {euclideanPatterns.map(pattern => (
                            <SelectItem key={pattern.key} value={pattern.key}>
                              <span>{pattern.key}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({pattern.pulses}/{pattern.steps})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Vocals Tab */}
              <TabsContent value="vocals" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Primary Language</Label>
                  <Select value={vocalLanguage} onValueChange={setVocalLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vocalLanguages.map(lang => (
                        <SelectItem key={lang.key} value={lang.key}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ad-lib Density</Label>
                  <Select value={adlibDensity} onValueChange={setAdlibDensity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="sparse">Sparse</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="frequent">Frequent</SelectItem>
                      <SelectItem value="dense">Dense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Call & Response</Label>
                    <p className="text-xs text-muted-foreground">
                      Traditional African pattern
                    </p>
                  </div>
                  <Switch
                    checked={callResponse}
                    onCheckedChange={setCallResponse}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CollapsibleContent>
        </Collapsible>

        {/* Apply Button */}
        <Button
          onClick={handleApply}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Applying Amapianorization...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Apply Amapianorization
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
