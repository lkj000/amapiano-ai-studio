import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Download, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Generate = () => {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("classic");
  const [bpm, setBpm] = useState([118]);
  const [duration, setDuration] = useState([180]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description for your track");
      return;
    }

    setIsGenerating(true);
    toast.info("🎵 Generating your amapiano track...");

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    setGeneratedTrack("sample-track-id");
    setIsGenerating(false);
    toast.success("🎉 Track generated successfully!");
  };

  const artistStyles = [
    "Kabza De Small",
    "Kelvin Momo", 
    "Babalwa M",
    "MFR Souls",
    "Mas MusiQ"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">
              AI Music Generation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create authentic amapiano tracks with our advanced AI. Describe your vision and let our AI bring it to life with cultural authenticity.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Generation Controls */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  Track Generation
                </CardTitle>
                <CardDescription>
                  Describe your amapiano track and customize the generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Track Description</label>
                  <Textarea
                    placeholder="Describe your amapiano track... e.g., 'A soulful private school amapiano track with jazzy piano chords, subtle log drums, and deep bass'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                {/* Genre Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amapiano Style</label>
                  <Select value={genre} onValueChange={setGenre}>
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
                </div>

                {/* BPM Slider */}
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

                {/* Duration Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Duration</label>
                    <span className="text-sm text-muted-foreground">{Math.floor(duration[0] / 60)}:{String(duration[0] % 60).padStart(2, '0')}</span>
                  </div>
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    min={30}
                    max={600}
                    step={30}
                    className="w-full"
                  />
                </div>

                {/* Artist Styles */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Artist Style Inspiration (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {artistStyles.map((artist) => (
                      <Badge key={artist} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        {artist}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full btn-glow"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4 mr-2" />
                      Generate Track
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Track */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  Generated Track
                </CardTitle>
                <CardDescription>
                  Your AI-generated amapiano track will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedTrack ? (
                  <div className="space-y-4">
                    {/* Track Info */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Soulful Amapiano Journey</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span>Style: {genre === "classic" ? "Classic Amapiano" : "Private School Amapiano"}</span>
                        <span>•</span>
                        <span>BPM: {bpm[0]}</span>
                        <span>•</span>
                        <span>Duration: {Math.floor(duration[0] / 60)}:{String(duration[0] % 60).padStart(2, '0')}</span>
                      </div>
                    </div>

                    {/* Audio Player Placeholder */}
                    <div className="bg-gradient-primary p-6 rounded-lg text-center">
                      <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <p className="text-primary-foreground/80 mb-4">Audio Player</p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="secondary" size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Play
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Stems */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Individual Stems</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {["Drums", "Bass", "Piano", "Other"].map((stem) => (
                          <Button key={stem} variant="outline" size="sm" className="justify-start">
                            <Download className="w-3 h-3 mr-2" />
                            {stem}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Music className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      {isGenerating ? "Generating your track..." : "Your generated track will appear here"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;