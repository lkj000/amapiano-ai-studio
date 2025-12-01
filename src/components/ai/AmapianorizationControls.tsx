import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';

interface AmapianorizationControlsProps {
  onApply: (settings: AmapianorizationSettings) => Promise<void>;
  isProcessing?: boolean;
}

export interface AmapianorizationSettings {
  region: 'johannesburg' | 'pretoria' | 'durban' | 'cape-town';
  intensity: number;
  logDrums: boolean;
  percussion: boolean;
  piano: boolean;
  bass: boolean;
  sidechain: boolean;
  filterSweeps: boolean;
}

export default function AmapianorizationControls({ onApply, isProcessing = false }: AmapianorizationControlsProps) {
  const [region, setRegion] = useState<AmapianorizationSettings['region']>('johannesburg');
  const [intensity, setIntensity] = useState([80]);
  const [logDrums, setLogDrums] = useState(true);
  const [percussion, setPercussion] = useState(true);
  const [piano, setPiano] = useState(true);
  const [bass, setBass] = useState(true);
  const [sidechain, setSidechain] = useState(true);
  const [filterSweeps, setFilterSweeps] = useState(true);

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
    });
  };

  const regionDescriptions: Record<string, string> = {
    johannesburg: 'Urban, energetic, fast-paced log drums',
    pretoria: 'Smooth, jazzy, sophisticated piano chords',
    durban: 'Deep, groovy, heavy basslines',
    'cape-town': 'Melodic, atmospheric, layered textures',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Amapianorization Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Region Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Regional Style</label>
          <Select value={region} onValueChange={(value) => setRegion(value as typeof region)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="johannesburg">Johannesburg</SelectItem>
              <SelectItem value="pretoria">Pretoria</SelectItem>
              <SelectItem value="durban">Durban</SelectItem>
              <SelectItem value="cape-town">Cape Town</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {regionDescriptions[region]}
          </p>
        </div>

        {/* Intensity */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Enhancement Intensity</label>
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
          <label className="text-sm font-medium">Elements to Add</label>
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
