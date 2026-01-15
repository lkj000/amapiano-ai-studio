import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Cpu, Play, Download, Loader2, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ModalGPUGeneratorProps {
  onTrackGenerated?: (track: GeneratedTrack) => void;
}

interface GeneratedTrack {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  bpm: number;
  genre: string;
  key: string;
  mood: string;
  processingTime?: number;
}

export function ModalGPUGenerator({ onTrackGenerated }: ModalGPUGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("amapiano");
  const [bpm, setBpm] = useState([118]);
  const [duration, setDuration] = useState([30]);
  const [key, setKey] = useState("Am");
  const [mood, setMood] = useState("energetic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<GeneratedTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt describing your track");
      return;
    }

    setIsGenerating(true);
    setError(null);
    toast.info("🚀 Generating with Modal GPU backend...");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("modal-generate", {
        body: {
          prompt: prompt.trim(),
          genre,
          bpm: bpm[0],
          duration: duration[0],
          key,
          mood,
        },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        throw new Error(data.error);
      }

      const track: GeneratedTrack = {
        id: data.track_id || `modal-${Date.now()}`,
        title: data.title || `Generated: ${prompt.substring(0, 30)}...`,
        audioUrl: data.audio_url || data.audioUrl,
        duration: data.duration || duration[0],
        bpm: data.bpm || bpm[0],
        genre: data.genre || genre,
        key: data.key || key,
        mood: data.mood || mood,
        processingTime: data.processing_time_ms,
      };

      setGeneratedTrack(track);
      onTrackGenerated?.(track);
      
      toast.success(`✅ GPU-accelerated track generated in ${track.processingTime}ms!`);
    } catch (err) {
      console.error("Modal generate error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate track";
      setError(message);
      toast.error(`Generation failed: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const moods = ["energetic", "chill", "melancholic", "uplifting", "dark", "groovy"];
  const keys = ["C", "Cm", "D", "Dm", "E", "Em", "F", "Fm", "G", "Gm", "A", "Am", "B", "Bm"];

  return (
    <Card className="card-glow border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          Modal GPU Generation
          <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
            <Zap className="w-3 h-3 mr-1" />
            GPU Accelerated
          </Badge>
        </CardTitle>
        <CardDescription>
          Generate music using Modal's GPU infrastructure for faster, higher-quality results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt</label>
          <Textarea
            placeholder="Describe your track... e.g., 'Deep amapiano with jazzy piano, punchy log drums, and a groovy bassline'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Genre</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amapiano">Amapiano</SelectItem>
                <SelectItem value="deep-amapiano">Deep Amapiano</SelectItem>
                <SelectItem value="private-school">Private School</SelectItem>
                <SelectItem value="afrobeat">Afrobeat</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Key</label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keys.map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mood</label>
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => (
              <Badge
                key={m}
                variant={mood === m ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
                onClick={() => setMood(m)}
              >
                {m}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">BPM</label>
              <span className="text-sm text-muted-foreground">{bpm[0]}</span>
            </div>
            <Slider
              value={bpm}
              onValueChange={setBpm}
              min={80}
              max={160}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Duration</label>
              <span className="text-sm text-muted-foreground">{duration[0]}s</span>
            </div>
            <Slider
              value={duration}
              onValueChange={setDuration}
              min={10}
              max={120}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating on GPU...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate with Modal GPU
            </>
          )}
        </Button>

        {generatedTrack && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{generatedTrack.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {generatedTrack.genre} • {generatedTrack.bpm} BPM • {generatedTrack.key} • {generatedTrack.duration}s
                  {generatedTrack.processingTime && ` • ${generatedTrack.processingTime}ms`}
                </p>
              </div>
                <div className="flex gap-2">
                  {generatedTrack.audioUrl && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href={generatedTrack.audioUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={generatedTrack.audioUrl} download>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
