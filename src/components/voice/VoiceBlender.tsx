import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Blend, Plus, X, Play, Pause, Download, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceModel {
  id: string;
  name: string;
  type: 'pretrained' | 'custom';
  description?: string;
}

interface BlendSlot {
  id: string;
  modelId: string | null;
  weight: number;
}

const AVAILABLE_MODELS: VoiceModel[] = [
  { id: 'male-deep', name: 'Deep Male', type: 'pretrained', description: 'Deep, resonant male voice' },
  { id: 'male-tenor', name: 'Tenor Male', type: 'pretrained', description: 'Clear, mid-range male voice' },
  { id: 'female-soprano', name: 'Soprano Female', type: 'pretrained', description: 'High, bright female voice' },
  { id: 'female-alto', name: 'Alto Female', type: 'pretrained', description: 'Warm, rich female voice' },
  { id: 'amapiano-vocal', name: 'Amapiano Vocal', type: 'pretrained', description: 'Authentic SA vocal style' },
  { id: 'afrobeats-vocal', name: 'Afrobeats Vocal', type: 'pretrained', description: 'West African vocal style' },
];

export const VoiceBlender = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<BlendSlot[]>([
    { id: '1', modelId: null, weight: 50 },
    { id: '2', modelId: null, weight: 50 },
  ]);
  const [blendName, setBlendName] = useState('');
  const [isBlending, setIsBlending] = useState(false);
  const [blendProgress, setBlendProgress] = useState(0);
  const [blendedModel, setBlendedModel] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const addSlot = () => {
    if (slots.length >= 4) {
      toast({
        title: 'Maximum Reached',
        description: 'You can blend up to 4 voice models',
        variant: 'destructive',
      });
      return;
    }

    const newWeight = Math.floor(100 / (slots.length + 1));
    const updatedSlots = slots.map((s) => ({ ...s, weight: newWeight }));
    setSlots([...updatedSlots, { id: crypto.randomUUID(), modelId: null, weight: newWeight }]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 2) {
      toast({
        title: 'Minimum Required',
        description: 'At least 2 voice models are required for blending',
        variant: 'destructive',
      });
      return;
    }

    const remaining = slots.filter((s) => s.id !== id);
    const newWeight = Math.floor(100 / remaining.length);
    setSlots(remaining.map((s) => ({ ...s, weight: newWeight })));
  };

  const updateSlotModel = (id: string, modelId: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, modelId } : s))
    );
  };

  const updateSlotWeight = (id: string, weight: number) => {
    const otherSlots = slots.filter((s) => s.id !== id);
    const totalOtherWeight = 100 - weight;
    const otherWeightEach = totalOtherWeight / otherSlots.length;

    setSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, weight } : { ...s, weight: otherWeightEach }
      )
    );
  };

  const normalizeWeights = () => {
    const total = slots.reduce((acc, s) => acc + s.weight, 0);
    if (total !== 100) {
      setSlots((prev) =>
        prev.map((s) => ({ ...s, weight: (s.weight / total) * 100 }))
      );
    }
  };

  const startBlending = async () => {
    const filledSlots = slots.filter((s) => s.modelId);
    if (filledSlots.length < 2) {
      toast({
        title: 'Select Models',
        description: 'Please select at least 2 voice models to blend',
        variant: 'destructive',
      });
      return;
    }

    if (!blendName) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your blended voice',
        variant: 'destructive',
      });
      return;
    }

    setIsBlending(true);
    setBlendProgress(0);

    try {
      // Call real voice blending edge function
      const { data, error } = await supabase.functions.invoke('voice-blend', {
        body: {
          name: blendName,
          models: slots.filter(s => s.modelId).map(s => ({ modelId: s.modelId, weight: s.weight })),
        }
      });

      if (error) throw error;
      setBlendProgress(100);
      setBlendedModel(blendName);
      toast({ title: 'Blend Complete!', description: `Voice model "${blendName}" has been created` });
    } catch (err) {
      console.error('Voice blend failed:', err);
      toast({ title: 'Blend Failed', description: 'Voice blending service unavailable', variant: 'destructive' });
    } finally {
      setIsBlending(false);
    }
  };

  const getModelById = (id: string) => AVAILABLE_MODELS.find((m) => m.id === id);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blend className="h-5 w-5 text-primary" />
            Voice Blender
          </CardTitle>
          <CardDescription>
            Combine multiple voice models to create unique hybrid voices with custom characteristics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blend Name */}
          <div className="space-y-2">
            <Label htmlFor="blendName">Blended Voice Name</Label>
            <Input
              id="blendName"
              placeholder="e.g., Deep Alto Blend"
              value={blendName}
              onChange={(e) => setBlendName(e.target.value)}
            />
          </div>

          {/* Voice Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Voice Models</h3>
              <Button variant="outline" size="sm" onClick={addSlot}>
                <Plus className="h-4 w-4 mr-1" />
                Add Voice
              </Button>
            </div>

            {slots.map((slot, index) => {
              const model = slot.modelId ? getModelById(slot.modelId) : null;
              return (
                <Card key={slot.id} className="bg-muted/30">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Voice {index + 1}</Badge>
                      {slots.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(slot.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Select
                      value={slot.modelId || ''}
                      onValueChange={(v) => updateSlotModel(slot.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice model" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-2">
                              <span>{m.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {m.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {model && (
                      <p className="text-xs text-muted-foreground">
                        {model.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Weight</span>
                        <span className="font-medium">{slot.weight.toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[slot.weight]}
                        onValueChange={([v]) => updateSlotWeight(slot.id, v)}
                        min={10}
                        max={90}
                        step={5}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Weight Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Blend Ratio</span>
              <Button variant="ghost" size="sm" onClick={normalizeWeights}>
                Normalize
              </Button>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden">
              {slots.map((slot, index) => {
                const colors = [
                  'bg-primary',
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-orange-500',
                ];
                return (
                  <div
                    key={slot.id}
                    className={`${colors[index]} transition-all duration-300`}
                    style={{ width: `${slot.weight}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              {slots.map((slot, index) => {
                const model = slot.modelId ? getModelById(slot.modelId) : null;
                return (
                  <span key={slot.id}>
                    {model?.name || `Voice ${index + 1}`}: {slot.weight.toFixed(0)}%
                  </span>
                );
              })}
            </div>
          </div>

          {/* Blend Progress */}
          {isBlending && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Blending voices...</span>
              </div>
              <Progress value={blendProgress} className="h-2" />
            </div>
          )}

          {/* Blended Result */}
          {blendedModel && !isBlending && (
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{blendedModel}</p>
                      <p className="text-xs text-muted-foreground">
                        Blended from {slots.filter((s) => s.modelId).length} voices
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blend Button */}
          <Button
            onClick={startBlending}
            disabled={isBlending}
            className="w-full"
            size="lg"
          >
            {isBlending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Blending...
              </>
            ) : (
              <>
                <Blend className="h-4 w-4 mr-2" />
                Create Blended Voice
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
