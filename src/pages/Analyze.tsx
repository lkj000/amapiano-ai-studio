import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Link2, Search, Zap, Music, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";

const Analyze = () => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL or upload a file");
      return;
    }

    setIsAnalyzing(true);
    toast.info("🔍 Analyzing audio...");

    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 4000));

    setAnalysisResult({
      title: "Amukelani",
      artist: "Kelvin Momo",
      bpm: 118,
      key: "F# minor",
      genre: "Private School Amapiano",
      duration: "4:32",
      quality: 95,
      stems: {
        drums: 92,
        bass: 88,
        piano: 96,
        vocals: 90,
        other: 85
      },
      patterns: [
        { type: "Chord Progression", content: "Fm - Ab - Eb - Bb", confidence: 94 },
        { type: "Drum Pattern", content: "Classic log drum with hi-hat shuffle", confidence: 89 },
        { type: "Bassline", content: "Deep sub-bass with rhythmic emphasis", confidence: 91 }
      ]
    });

    setIsAnalyzing(false);
    toast.success("✨ Analysis complete!");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.info(`📁 File "${file.name}" selected for analysis`);
      setUrl(file.name);
    }
  };

  const supportedPlatforms = [
    "YouTube", "SoundCloud", "TikTok", "Instagram", "Spotify", "Apple Music"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">
              Universal Audio Analysis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Analyze any audio from YouTube, SoundCloud, TikTok, or upload your own files. Get professional stem separation and pattern recognition.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Analysis Input */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Audio Input
                </CardTitle>
                <CardDescription>
                  Provide a URL or upload an audio file for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="url" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">URL Input</TabsTrigger>
                    <TabsTrigger value="upload">File Upload</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Paste URL</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon">
                          <Link2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Supported Platforms</label>
                      <div className="flex flex-wrap gap-2">
                        {supportedPlatforms.map((platform) => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Click to upload or drag and drop
                      </p>
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" className="cursor-pointer">
                          Choose File
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports audio and video files up to 500MB
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !url.trim()}
                  className="w-full btn-glow"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze Audio
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of the analyzed audio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult ? (
                  <div className="space-y-6">
                    {/* Track Info */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-bold text-lg mb-1">{analysisResult.title}</h3>
                      <p className="text-muted-foreground">{analysisResult.artist}</p>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">BPM:</span>
                          <span className="ml-2 font-medium">{analysisResult.bpm}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Key:</span>
                          <span className="ml-2 font-medium">{analysisResult.key}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Genre:</span>
                          <span className="ml-2 font-medium">{analysisResult.genre}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-2 font-medium">{analysisResult.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quality Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Overall Quality</span>
                        <span className="text-sm text-primary font-bold">{analysisResult.quality}%</span>
                      </div>
                      <Progress value={analysisResult.quality} className="h-2" />
                    </div>

                    {/* Stem Separation */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Stem Separation Quality</h4>
                      {Object.entries(analysisResult.stems).map(([stem, quality]) => (
                        <div key={stem} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{stem}</span>
                            <span className="text-muted-foreground">{quality as number}%</span>
                          </div>
                          <Progress value={quality as number} className="h-1" />
                        </div>
                      ))}
                    </div>

                    {/* Detected Patterns */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Detected Patterns</h4>
                      <div className="space-y-2">
                        {analysisResult.patterns.map((pattern: any, index: number) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium">{pattern.type}</span>
                              <Badge variant="secondary" className="text-xs">
                                {pattern.confidence}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{pattern.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Stems
                      </Button>
                      <Button className="w-full btn-glow">
                        <Zap className="w-4 h-4 mr-2" />
                        Amapianorize This Track
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Music className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      {isAnalyzing ? "Analyzing your audio..." : "Analysis results will appear here"}
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

export default Analyze;