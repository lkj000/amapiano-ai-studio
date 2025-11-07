import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Zap, Volume2, Radio, Gauge, Waves } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Effect {
  id: string;
  name: string;
  category: string;
  icon: any;
  parameters: {
    name: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
  }[];
}

const EFFECTS_LIBRARY: Effect[] = [
  {
    id: "reverb",
    name: "Reverb",
    category: "spatial",
    icon: Waves,
    parameters: [
      { name: "Room Size", value: 50, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Damping", value: 50, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Wet/Dry", value: 30, min: 0, max: 100, step: 1, unit: "%" }
    ]
  },
  {
    id: "delay",
    name: "Delay",
    category: "spatial",
    icon: Radio,
    parameters: [
      { name: "Time", value: 500, min: 10, max: 2000, step: 10, unit: "ms" },
      { name: "Feedback", value: 40, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Wet/Dry", value: 30, min: 0, max: 100, step: 1, unit: "%" }
    ]
  },
  {
    id: "distortion",
    name: "Distortion",
    category: "dynamics",
    icon: Zap,
    parameters: [
      { name: "Drive", value: 30, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Tone", value: 50, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Output", value: 70, min: 0, max: 100, step: 1, unit: "%" }
    ]
  },
  {
    id: "compressor",
    name: "Compressor",
    category: "dynamics",
    icon: Gauge,
    parameters: [
      { name: "Threshold", value: -20, min: -60, max: 0, step: 1, unit: "dB" },
      { name: "Ratio", value: 4, min: 1, max: 20, step: 0.5, unit: ":1" },
      { name: "Attack", value: 10, min: 0, max: 100, step: 1, unit: "ms" },
      { name: "Release", value: 100, min: 10, max: 1000, step: 10, unit: "ms" }
    ]
  },
  {
    id: "eq",
    name: "Equalizer",
    category: "filter",
    icon: Volume2,
    parameters: [
      { name: "Low", value: 0, min: -12, max: 12, step: 0.5, unit: "dB" },
      { name: "Mid", value: 0, min: -12, max: 12, step: 0.5, unit: "dB" },
      { name: "High", value: 0, min: -12, max: 12, step: 0.5, unit: "dB" }
    ]
  },
  {
    id: "chorus",
    name: "Chorus",
    category: "modulation",
    icon: Wand2,
    parameters: [
      { name: "Rate", value: 2, min: 0.1, max: 10, step: 0.1, unit: "Hz" },
      { name: "Depth", value: 50, min: 0, max: 100, step: 1, unit: "%" },
      { name: "Wet/Dry", value: 40, min: 0, max: 100, step: 1, unit: "%" }
    ]
  }
];

interface EffectsLibraryProps {
  onApplyEffect?: (effect: Effect) => void;
}

export const EffectsLibrary = ({ onApplyEffect }: EffectsLibraryProps) => {
  const { toast } = useToast();
  const [effects, setEffects] = useState<Effect[]>(EFFECTS_LIBRARY);
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);

  const updateParameter = (effectId: string, paramName: string, value: number) => {
    setEffects(effects.map(effect => {
      if (effect.id === effectId) {
        return {
          ...effect,
          parameters: effect.parameters.map(param =>
            param.name === paramName ? { ...param, value } : param
          )
        };
      }
      return effect;
    }));

    if (selectedEffect?.id === effectId) {
      setSelectedEffect({
        ...selectedEffect,
        parameters: selectedEffect.parameters.map(param =>
          param.name === paramName ? { ...param, value } : param
        )
      });
    }
  };

  const applyEffect = (effect: Effect) => {
    onApplyEffect?.(effect);
    toast({
      title: "Effect Applied",
      description: `${effect.name} has been applied to the audio`,
    });
  };

  const categories = Array.from(new Set(effects.map(e => e.category)));

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Effects Library</h3>
          <Badge variant="secondary">{effects.length} Effects</Badge>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length + 1}, 1fr)` }}>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {effects.map(effect => (
                <Card
                  key={effect.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedEffect?.id === effect.id ? 'border-primary ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedEffect(effect)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <effect.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{effect.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {effect.category}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyEffect(effect);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {effects
                  .filter(e => e.category === category)
                  .map(effect => (
                    <Card
                      key={effect.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedEffect?.id === effect.id ? 'border-primary ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedEffect(effect)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <effect.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{effect.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {effect.category}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyEffect(effect);
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Effect parameters editor */}
        {selectedEffect && (
          <Card className="p-4 mt-4 bg-secondary/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <selectedEffect.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{selectedEffect.name}</h4>
                  <div className="text-xs text-muted-foreground capitalize">
                    {selectedEffect.category}
                  </div>
                </div>
              </div>
              <Button onClick={() => applyEffect(selectedEffect)}>
                Apply Effect
              </Button>
            </div>

            <div className="space-y-4">
              {selectedEffect.parameters.map(param => (
                <div key={param.name}>
                  <Label className="flex justify-between">
                    <span>{param.name}</span>
                    <span className="text-muted-foreground">
                      {param.value.toFixed(param.step < 1 ? 1 : 0)}{param.unit}
                    </span>
                  </Label>
                  <Slider
                    value={[param.value]}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    onValueChange={([value]) =>
                      updateParameter(selectedEffect.id, param.name, value)
                    }
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};
