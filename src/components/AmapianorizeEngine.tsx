import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Wand2, 
  Music, 
  Settings, 
  Play, 
  Download, 
  Mic, 
  Volume2, 
  Sliders,
  Sparkles,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface AmapianorizeProps {
  sourceAnalysisId?: string;
  onTransformComplete: (result: any) => void;
  className?: string;
}

export const AmapianorizeEngine = ({ sourceAnalysisId, onTransformComplete, className }: AmapianorizeProps) => {
  const [targetGenre, setTargetGenre] = useState("classic");
  const [intensity, setIntensity] = useState([50]);
  const [preserveVocals, setPreserveVocals] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");
  const [preserveMelody, setPreserveMelody] = useState(true);
  const [tempoAdjust, setTempoAdjust] = useState([0]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const intensityLabels = {
    0: "Preserve Original",
    25: "Subtle Transformation", 
    50: "Moderate Amapiano Style",
    75: "Heavy Transformation",
    100: "Full Amapiano Conversion"
  };

  const getIntensityLabel = (value: number) => {
    const closest = Object.keys(intensityLabels).reduce((prev, curr) => 
      Math.abs(Number(curr) - value) < Math.abs(Number(prev) - value) ? curr : prev
    );
    return intensityLabels[Number(closest) as keyof typeof intensityLabels];
  };

  const handleTransform = async () => {
    if (!sourceAnalysisId) {
      toast.error("Please analyze an audio source first");
      return;
    }

    setIsTransforming(true);
    setTransformProgress(0);
    toast.info("🎵 Starting Amapianorize transformation...");

    // Simulate transformation progress
    const steps = [
      { progress: 10, message: "Loading source analysis..." },
      { progress: 25, message: "Extracting musical elements..." },
      { progress: 40, message: "Applying amapiano style patterns..." },
      { progress: 60, message: "Integrating log drums and piano..." },
      { progress: 80, message: "Mixing and mastering..." },
      { progress: 100, message: "Transformation complete!" }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransformProgress(step.progress);
      toast.info(step.message);
    }

    // Mock transformation result
    const result = {
      transformId: `amapiano_${Math.random().toString(36).substr(2, 9)}`,
      originalSource: sourceAnalysisId,
      targetGenre,
      intensity: intensity[0],
      preservedElements: {
        vocals: preserveVocals,
        melody: preserveMelody
      },
      transformedTrack: {
        title: "Amapianorized Track",
        duration: "3:45",
        bpm: 118 + tempoAdjust[0],
        key: "F# minor",
        stems: {
          drums: "Signature amapiano log drums",
          bass: "Deep sub-bass with rhythmic emphasis", 
          piano: "Gospel-influenced piano chords",
          vocals: preserveVocals ? "Original vocals preserved" : "Amapiano vocal processing",
          other: "Additional amapiano elements"
        }
      },
      qualityScore: 95,
      processingTime: "4.2 seconds"
    };

    setIsTransforming(false);
    onTransformComplete(result);
    toast.success("✨ Amapianorize transformation completed successfully!");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Amapianorize Engine
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
        <CardDescription>
          Transform any analyzed audio into authentic amapiano style with advanced controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!sourceAnalysisId && (
          <div className="p-4 bg-muted rounded-lg text-center">
            <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Analyze an audio source first to enable Amapianorize transformation
            </p>
          </div>
        )}

        {sourceAnalysisId && (
          <>
            {/* Target Genre */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Amapiano Style</label>
              <Select value={targetGenre} onValueChange={setTargetGenre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic Amapiano</SelectItem>
                  <SelectItem value="private-school">Private School Amapiano</SelectItem>
                  <SelectItem value="vocal">Vocal Amapiano</SelectItem>
                  <SelectItem value="deep">Deep Amapiano</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {targetGenre === "classic" && "Traditional amapiano with log drums and soulful piano"}
                {targetGenre === "private-school" && "Sophisticated, jazz-influenced with live instrumentation"}
                {targetGenre === "vocal" && "Emphasizes vocal elements and harmonies"}
                {targetGenre === "deep" && "Underground sound with deeper, darker elements"}
              </p>
            </div>

            {/* Transformation Intensity */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Transformation Intensity</label>
                <span className="text-sm text-primary font-medium">{intensity[0]}%</span>
              </div>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {getIntensityLabel(intensity[0])}
              </p>
            </div>

            {/* Quick Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Preservation Options</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm font-medium">Preserve Original Vocals</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep vocals unchanged while transforming instrumentals
                  </p>
                </div>
                <Switch
                  checked={preserveVocals}
                  onCheckedChange={setPreserveVocals}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    <span className="text-sm font-medium">Preserve Main Melody</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maintain the core melodic structure
                  </p>
                </div>
                <Switch
                  checked={preserveMelody}
                  onCheckedChange={setPreserveMelody}
                />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </Button>
            </div>

            {showAdvanced && (
              <>
                <Separator />
                
                {/* Tempo Adjustment */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Tempo Adjustment</label>
                    <span className="text-sm text-muted-foreground">
                      {tempoAdjust[0] > 0 ? '+' : ''}{tempoAdjust[0]} BPM
                    </span>
                  </div>
                  <Slider
                    value={tempoAdjust}
                    onValueChange={setTempoAdjust}
                    min={-20}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fine-tune the tempo for better amapiano feel
                  </p>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Instructions</label>
                  <Textarea
                    placeholder="e.g., 'add more saxophone elements', 'emphasize the log drums', 'make it more soulful'..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide specific guidance for the transformation
                  </p>
                </div>
              </>
            )}

            {/* Transform Progress */}
            {isTransforming && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transforming Audio...</span>
                  <span className="text-sm text-muted-foreground">{transformProgress}%</span>
                </div>
                <Progress value={transformProgress} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Estimated time: 2-5 minutes</span>
                </div>
              </div>
            )}

            {/* Transform Button */}
            <Button 
              onClick={handleTransform}
              disabled={isTransforming}
              className="w-full btn-glow"
              size="lg"
            >
              {isTransforming ? (
                <>
                  <Sliders className="w-4 h-4 mr-2 animate-pulse" />
                  Transforming...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Amapianorize This Track
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};