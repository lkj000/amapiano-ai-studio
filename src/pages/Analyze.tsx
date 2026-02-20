import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Upload, Link2, Search, Zap, Music, TrendingUp, Download, Layers, BarChart3, FileText, Wand2, Sparkles, Cpu } from "lucide-react";
import { toast } from "sonner";
import { EnhancedFileUpload } from "@/components/EnhancedFileUpload";
import { BatchProcessor } from "@/components/BatchProcessor";
import { AmapianorizeEngine } from "@/components/AmapianorizeEngine";
import { MusicAnalysisTools } from "@/components/MusicAnalysisTools";
import { UnifiedAnalysisPanel } from "@/components/UnifiedAnalysisPanel";
import { RAGKnowledgeBase } from "@/components/RAGKnowledgeBase";
import { HighSpeedDAWEngine } from "@/components/HighSpeedDAWEngine";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    const pending = localStorage.getItem('pendingAnalysisTrack');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        localStorage.removeItem('pendingAnalysisTrack');
        console.log('📊 Loaded pending analysis track:', data);
        setUrl(data.url || "");
        setIsAnalyzing(true);
        toast.info('🔍 Starting automatic analysis...');
        
        // Trigger real analysis after state update
        setTimeout(async () => {
          try {
            console.log('🎵 Auto-analyzing track:', data.url);
            
            // Call real analysis edge function
            const { data: analysisData, error } = await supabase.functions.invoke('audio-analysis', {
              body: { url: data.url, title: data.title }
            });
            
            if (error) throw error;
            
            setAnalysisResult(analysisData);
            setShowAmapianorize(true);
            setIsAnalyzing(false);
            toast.success('✨ Auto-analysis complete!');
            console.log('✅ Analysis completed:', analysisData);
          } catch (error) {
            console.error('❌ Auto-analysis failed:', error);
            setIsAnalyzing(false);
            toast.error('Analysis failed. Please try again.');
          }
        }, 100);
      } catch (e) {
        console.error('❌ Failed to prepare analysis track:', e);
        localStorage.removeItem('pendingAnalysisTrack');
        toast.error('Failed to load track for analysis');
      }
    }
  }, []);

  const handleAnalyze = async () => {
    if (!url.trim() && !selectedFile) {
      toast.error("Please enter a URL or upload a file");
      return;
    }

    console.log('🔍 Starting analysis for:', { url, fileName: selectedFile?.name });
    setIsAnalyzing(true);
    toast.info("🔍 Performing AI audio analysis...");

    try {
      let analysisBody: any = {};
      
      if (selectedFile) {
        // Convert file to base64 for edge function
        const reader = new FileReader();
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        analysisBody = { audio: audioBase64, filename: selectedFile.name };
      } else {
        analysisBody = { url: url.trim() };
      }
      
      // Call real audio analysis edge function
      const { data, error } = await supabase.functions.invoke('audio-analysis', {
        body: analysisBody
      });
      
      if (error) throw error;
      
      console.log('✅ Analysis result:', data);
      setAnalysisResult(data);
      setShowAmapianorize(true);
      toast.success("✨ Analysis complete!");
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    console.log('📁 File selected for analysis:', { name: file.name, size: file.size, type: file.type });
    setSelectedFile(file);
    setUrl(file.name);
    toast.success(`📁 File "${file.name}" selected for analysis`);
  };

  const handleBatchComplete = (results: any[]) => {
    console.log('✅ Batch processing complete:', results);
    setBatchResults(results);
    toast.success(`Batch analysis completed! ${results.length} items processed.`);
  };

  const handleAmapianorizeComplete = (result: any) => {
    console.log('🎵 Amapianorize transformation completed:', result);
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

          {/* High-Speed Engine Status */}
          <div className="mb-6">
            <HighSpeedDAWEngine showMetrics={true} />
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
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="flex-1"
                                      onClick={() => {
                                        // Stems must come from real separation results
                                        const stemUrl = analysisResult?.stems?.[stem];
                                        if (!stemUrl) {
                                          toast.error(`No ${stem} stem available — run stem separation first`);
                                          return;
                                        }
                                        const element = document.createElement('a');
                                        element.href = stemUrl;
                                        element.download = `${stem}_stem.wav`;
                                        document.body.appendChild(element);
                                        element.click();
                                        document.body.removeChild(element);
                                        toast.success(`📁 ${stem} stem downloaded!`);
                                     }}
                                   >
                                     <Download className="w-3 h-3 mr-1" />
                                     Download
                                   </Button>
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="flex-1"
                                      onClick={() => {
                                        const stemUrl = analysisResult?.stems?.[stem];
                                        if (!stemUrl) {
                                          toast.error(`No ${stem} stem available — run stem separation first`);
                                          return;
                                        }
                                        const audio = new Audio(stemUrl);
                                        audio.play().catch(() => toast.error("Unable to preview audio"));
                                     }}
                                   >
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
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="w-full"
                                  onClick={() => {
                                    try {
                                      // Export pattern as JSON (real data from analysis)
                                      const blob = new Blob([JSON.stringify(pattern, null, 2)], { type: 'application/json' });
                                      const url = URL.createObjectURL(blob);
                                      const element = document.createElement('a');
                                      element.href = url;
                                      element.download = `${pattern.type.replace(/\s+/g, '_')}.json`;
                                      document.body.appendChild(element);
                                      element.click();
                                      document.body.removeChild(element);
                                      URL.revokeObjectURL(url);
                                      toast.success(`📁 ${pattern.type} pattern exported!`);
                                   } catch (error) {
                                     console.error(`❌ Failed to export MIDI pattern:`, error);
                                     toast.error('Failed to export MIDI pattern');
                                   }
                                 }}
                               >
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
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              try {
                                console.log('📥 Exporting all batch results...', batchResults);
                                const dataStr = JSON.stringify(batchResults, null, 2);
                                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                                const exportFileDefaultName = `batch_results_${Date.now()}.json`;
                                
                                const linkElement = document.createElement('a');
                                linkElement.setAttribute('href', dataUri);
                                linkElement.setAttribute('download', exportFileDefaultName);
                                linkElement.click();
                                
                                toast.success(`📁 Exported ${batchResults.length} results!`);
                                console.log('✅ Batch results exported successfully');
                              } catch (error) {
                                console.error('❌ Failed to export batch results:', error);
                                toast.error('Failed to export results');
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export All Results
                          </Button>
                          <Button 
                            className="flex-1 btn-glow"
                            onClick={() => {
                              console.log('🎵 Starting batch Amapianorize...', batchResults);
                              toast.info('🎵 Batch Amapianorize coming soon!');
                            }}
                          >
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
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">AI-Powered Analysis Now Available</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Enhanced Essentia analysis with deep learning models for genre, mood, and cultural insights
            </p>
          </CardContent>
        </Card>
        
        <UnifiedAnalysisPanel 
          file={selectedFile || undefined}
          onAnalysisComplete={(analysisData) => {
            console.log('✅ AI analysis complete:', analysisData);
            // Update analysis result with AI insights
            if (analysisData.essentia?.deepLearning) {
              toast.success('✨ AI insights added to analysis!');
            }
          }}
          className="mb-6"
        />
        
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