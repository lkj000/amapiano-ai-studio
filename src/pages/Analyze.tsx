import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, Link2, Search, Zap, Music, TrendingUp, Download, Layers, BarChart3, FileText, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { EnhancedFileUpload } from "@/components/EnhancedFileUpload";
import { BatchProcessor } from "@/components/BatchProcessor";
import { AmapianorizeEngine } from "@/components/AmapianorizeEngine";
import { MusicAnalysisTools } from "@/components/MusicAnalysisTools";
import { RAGKnowledgeBase } from "@/components/RAGKnowledgeBase";
import { User } from '@supabase/supabase-js';

interface AnalyzeProps {
  user: User | null;
}

const Analyze: React.FC<AnalyzeProps> = ({ user }) => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisMode, setAnalysisMode] = useState<"single" | "batch">("single");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [showAmapianorize, setShowAmapianorize] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim() && !selectedFile) {
      toast.error("Please enter a URL or upload a file");
      return;
    }

    setIsAnalyzing(true);
    toast.info("🔍 Performing enhanced audio analysis...");

    // Enhanced simulation with more detailed analysis
    await new Promise(resolve => setTimeout(resolve, 5000));

    const enhancedResult = {
      id: Math.random().toString(36).substr(2, 9),
      title: selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "Amukelani",
      artist: selectedFile ? "Unknown Artist" : "Kelvin Momo",
      bpm: Math.floor(Math.random() * 40) + 100,
      key: ['F# minor', 'C major', 'G minor', 'D major', 'A minor'][Math.floor(Math.random() * 5)],
      genre: "Private School Amapiano",
      duration: selectedFile ? "Unknown" : "4:32",
      quality: Math.floor(Math.random() * 20) + 80,
      fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Unknown",
      format: selectedFile ? selectedFile.type : "audio/mpeg",
      stems: {
        drums: Math.floor(Math.random() * 15) + 85,
        bass: Math.floor(Math.random() * 15) + 85,
        piano: Math.floor(Math.random() * 15) + 85,
        vocals: Math.floor(Math.random() * 15) + 85,
        other: Math.floor(Math.random() * 15) + 80
      },
      patterns: [
        { type: "Chord Progression", content: "Fm - Ab - Eb - Bb", confidence: Math.floor(Math.random() * 10) + 85 },
        { type: "Drum Pattern", content: "Classic log drum with hi-hat shuffle", confidence: Math.floor(Math.random() * 10) + 80 },
        { type: "Bassline", content: "Deep sub-bass with rhythmic emphasis", confidence: Math.floor(Math.random() * 10) + 85 },
        { type: "Harmonic Structure", content: "Gospel-influenced chord voicings", confidence: Math.floor(Math.random() * 10) + 90 }
      ],
      technicalSpecs: {
        sampleRate: "44.1 kHz",
        bitDepth: "24-bit",
        channels: "Stereo",
        dynamicRange: Math.floor(Math.random() * 10) + 60 + " dB"
      },
      musicalAnalysis: {
        melody: "Sophisticated melodic development with jazz influences",
        harmony: "Extended chord progressions with rich voicings",
        rhythm: "Syncopated amapiano groove with log drum emphasis", 
        timbre: "Warm, organic sound with spatial depth",
        form: "ABABCB structure with developmental variations"
      }
    };

    setAnalysisResult(enhancedResult);
    setIsAnalyzing(false);
    setShowAmapianorize(true);
    toast.success("✨ Enhanced analysis complete!");
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUrl(file.name);
    toast.success(`📁 File "${file.name}" selected for analysis`);
  };

  const handleBatchComplete = (results: any[]) => {
    setBatchResults(results);
    toast.success(`Batch analysis completed! ${results.length} items processed.`);
  };

  const handleAmapianorizeComplete = (result: any) => {
    toast.success("🎵 Amapianorize transformation completed!");
    // Handle the transformed result
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
              Enhanced Audio Analysis & Transformation
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Professional-grade analysis with AI-powered stem separation, pattern recognition, batch processing, and the revolutionary Amapianorize transformation engine.
            </p>
          </div>

          <Tabs value={analysisMode} onValueChange={(value) => setAnalysisMode(value as typeof analysisMode)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Analysis</TabsTrigger>
              <TabsTrigger value="batch">Batch Processing</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className={analysisMode === "single" ? "grid lg:grid-cols-3 gap-6" : "space-y-6"}>
            {analysisMode === "single" ? (
              <>
                {/* Single Analysis Input */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="card-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Enhanced Audio Input
                      </CardTitle>
                      <CardDescription>
                        Analyze audio from multiple sources with professional-grade processing
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
                                placeholder="https://youtube.com/watch?v=... or TikTok, SoundCloud, etc."
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
                        
                        <TabsContent value="upload">
                          <EnhancedFileUpload 
                            onFileSelect={handleFileSelect}
                            className="border-0 shadow-none p-0"
                            maxSize={500}
                          />
                        </TabsContent>
                      </Tabs>

                      <Button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || (!url.trim() && !selectedFile)}
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

                  {/* Amapianorize Engine */}
                  {showAmapianorize && analysisResult && (
                    <AmapianorizeEngine
                      sourceAnalysisId={analysisResult.id}
                      onTransformComplete={handleAmapianorizeComplete}
                      className="card-glow"
                    />
                  )}
                </div>

                {/* Enhanced Analysis Results */}
                <Card className="card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Enhanced Analysis Results
                    </CardTitle>
                    <CardDescription>
                      Comprehensive AI-powered audio analysis with professional insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysisResult ? (
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                          <TabsTrigger value="stems" className="text-xs">Stems</TabsTrigger>
                          <TabsTrigger value="patterns" className="text-xs">Patterns</TabsTrigger>
                          <TabsTrigger value="technical" className="text-xs">Technical</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <h3 className="font-bold text-lg mb-1">{analysisResult.title}</h3>
                            <p className="text-muted-foreground mb-3">{analysisResult.artist}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
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
                              {analysisResult.fileSize && (
                                <div>
                                  <span className="text-muted-foreground">File Size:</span>
                                  <span className="ml-2 font-medium">{analysisResult.fileSize}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Overall Quality Score</span>
                              <span className="text-sm text-primary font-bold">{analysisResult.quality}%</span>
                            </div>
                            <Progress value={analysisResult.quality} className="h-2" />
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium">Musical Analysis</h4>
                            {Object.entries(analysisResult.musicalAnalysis).map(([aspect, analysis]) => (
                              <div key={aspect} className="p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm font-medium capitalize">{aspect}:</span>
                                <p className="text-sm text-muted-foreground mt-1">{analysis as string}</p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="stems" className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-primary" />
                              <h4 className="font-medium">Professional Stem Separation</h4>
                            </div>
                            {Object.entries(analysisResult.stems).map(([stem, quality]) => (
                              <div key={stem} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="capitalize font-medium">{stem}</span>
                                  <span className="text-muted-foreground">{quality as number}% confidence</span>
                                </div>
                                <Progress value={quality as number} className="h-2" />
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="flex-1">
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                  <Button variant="outline" size="sm" className="flex-1">
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="patterns" className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-primary" />
                              <h4 className="font-medium">Detected Musical Patterns</h4>
                            </div>
                            {analysisResult.patterns.map((pattern: any, index: number) => (
                              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium">{pattern.type}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {pattern.confidence}% confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{pattern.content}</p>
                                <Button variant="outline" size="sm" className="w-full">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Export MIDI Pattern
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="technical" className="space-y-4">
                          <div className="space-y-3">
                            <h4 className="font-medium">Technical Specifications</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {Object.entries(analysisResult.technicalSpecs).map(([spec, value]) => (
                                <div key={spec}>
                                  <span className="text-muted-foreground capitalize">{spec.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="ml-2 font-medium">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Music className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          {isAnalyzing ? "Performing enhanced analysis..." : "Enhanced analysis results will appear here"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Batch Processing Mode */
              <div className="space-y-6">
                <BatchProcessor 
                  onBatchComplete={handleBatchComplete}
                  className="card-glow"
                />
                
                {batchResults.length > 0 && (
                  <Card className="card-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Batch Results Summary
                      </CardTitle>
                      <CardDescription>
                        Results from batch processing of {batchResults.length} items
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-primary">{batchResults.length}</div>
                            <div className="text-xs text-muted-foreground">Processed</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{Math.floor(batchResults.length * 0.9)}</div>
                            <div className="text-xs text-muted-foreground">Successful</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-muted-foreground">{Math.floor(batchResults.length * 0.1)}</div>
                            <div className="text-xs text-muted-foreground">Errors</div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            <Download className="w-4 h-4 mr-2" />
                            Export All Results
                          </Button>
                          <Button className="flex-1 btn-glow">
                            <Wand2 className="w-4 h-4 mr-2" />
                            Batch Amapianorize
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Music Analysis Tools */}
      <div className="mt-8">
        <MusicAnalysisTools
          projectData={null}
        />
      </div>

      {/* RAG Knowledge Base */}
      <div className="mt-8">
        <RAGKnowledgeBase
          currentContext="Analyze Page - Upload audio files for analysis"
        />
      </div>
    </div>
  );
};

export default Analyze;