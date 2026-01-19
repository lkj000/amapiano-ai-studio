import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Music, Sparkles, Headphones } from 'lucide-react';
import { AmapianorizationEngine } from '@/components/ai/AmapianorizationEngine';
import { SourceSeparationEngine } from '@/components/ai/SourceSeparationEngine';
import { StemPlaybackPanel } from '@/components/audio/StemPlaybackPanel';
import { toast } from 'sonner';

interface StemData {
  id: string;
  name: string;
  audioUrl: string;
  category?: string;
}

export default function Amapianorize() {
  const [activeTab, setActiveTab] = useState<'upload' | 'separate' | 'enhance' | 'listen'>('upload');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);
  const [separatedStems, setSeparatedStems] = useState<any>(null);
  const [rawStemsList, setRawStemsList] = useState<StemData[]>([]);
  const [enhancedStems, setEnhancedStems] = useState<any>(null);
  const [enhancedAudioUrl, setEnhancedAudioUrl] = useState<string | null>(null);

  // Clean up object URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (audioObjectUrl) {
        URL.revokeObjectURL(audioObjectUrl);
      }
    };
  }, [audioObjectUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Please select a valid audio file');
        return;
      }
      // Clean up previous URL
      if (audioObjectUrl) {
        URL.revokeObjectURL(audioObjectUrl);
      }
      setAudioFile(file);
      setAudioObjectUrl(URL.createObjectURL(file));
      setSeparatedStems(null);
      setRawStemsList([]);
      setEnhancedStems(null);
      setEnhancedAudioUrl(null);
      setActiveTab('separate');
      toast.success(`File "${file.name}" ready for separation`);
    }
  };

  const handleSeparationComplete = (stems: any) => {
    console.log('[Amapianorize] handleSeparationComplete called with stems:', stems);
    
    // Store raw stems list for playback panel
    if (Array.isArray(stems)) {
      const stemsList: StemData[] = stems.map((stem: any) => ({
        id: stem.id || stem.instrument || 'unknown',
        name: stem.name || stem.instrument || stem.id || 'Unknown Stem',
        audioUrl: stem.audioUrl,
        category: stem.category || stem.id?.toLowerCase() || 'other'
      }));
      console.log('[Amapianorize] Setting rawStemsList:', stemsList);
      setRawStemsList(stemsList);
    }

    // Convert SeparatedStem[] to the format AmapianorizationEngine expects
    const stemUrls: Record<string, string> = {};
    if (Array.isArray(stems)) {
      stems.forEach((stem: any) => {
        if (stem.audioUrl) {
          // Map to standard keys
          const keyMap: Record<string, string> = {
            'vocals': 'vocals',
            'vocal': 'vocals',
            'drums': 'drums',
            'percussion': 'drums',
            'bass': 'bass',
            'piano': 'piano',
            'keys': 'piano',
            'other': 'other',
            'synth': 'other',
            'strings': 'other',
            'guitar': 'other',
          };
          const mappedKey = keyMap[stem.id?.toLowerCase()] || keyMap[stem.instrument?.toLowerCase()] || 'other';
          stemUrls[mappedKey] = stem.audioUrl;
        }
      });
    } else if (stems && typeof stems === 'object') {
      // Already in correct format
      Object.assign(stemUrls, stems);
    }
    
    console.log('[Amapianorize] Setting separatedStems:', stemUrls);
    console.log('[Amapianorize] Has stems keys:', Object.keys(stemUrls));
    
    setSeparatedStems(stemUrls);
    setActiveTab('enhance');
    toast.success('Stems separated! Ready for Amapianorization');
  };

  const handleEnhancementComplete = (enhanced: any) => {
    setEnhancedStems(enhanced);
    // Check if there's an output URL
    if (enhanced?.outputUrl) {
      setEnhancedAudioUrl(enhanced.outputUrl);
    }
    toast.success('Enhancement complete! Your track is now authentically Amapiano');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Amapianorize</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transform any track into authentic Amapiano with AI-powered cultural element enhancement
            </p>
          </div>

          {/* Workflow Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="separate" disabled={!audioFile && activeTab === 'upload'}>
                <Music className="w-4 h-4 mr-2" />
                Separate
              </TabsTrigger>
              <TabsTrigger value="enhance" disabled={!separatedStems}>
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance
              </TabsTrigger>
              <TabsTrigger value="listen" disabled={rawStemsList.length === 0}>
                <Headphones className="w-4 h-4 mr-2" />
                Listen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Track</CardTitle>
                  <CardDescription>
                    Upload the audio file you want to transform into authentic Amapiano
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 hover:border-primary/50 transition-colors">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop or click to upload
                    </p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload">
                      <Button asChild>
                        <span>Select Audio File</span>
                      </Button>
                    </label>
                    {audioFile && (
                      <div className="mt-4 text-sm text-center">
                        <p className="font-medium">{audioFile.name}</p>
                        <p className="text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="separate" className="space-y-6">
              {audioFile && audioObjectUrl && (
                <SourceSeparationEngine
                  initialAudioUrl={audioObjectUrl}
                  autoStart={true}
                  onSeparationComplete={handleSeparationComplete}
                />
              )}
            </TabsContent>

            <TabsContent value="enhance" className="space-y-6">
              {separatedStems ? (
                <AmapianorizationEngine
                  stems={separatedStems}
                  onEnhancementComplete={handleEnhancementComplete}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Waiting for Stems</h3>
                  <p className="text-muted-foreground text-sm">
                    Complete the stem separation process first to enable enhancement.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="listen" className="space-y-6">
              <StemPlaybackPanel
                originalAudioUrl={audioObjectUrl || undefined}
                originalFileName={audioFile?.name}
                stems={rawStemsList}
                enhancedAudioUrl={enhancedAudioUrl || undefined}
                title="Your Audio Files"
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Download Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Downloaded stems will be saved to your browser's default <strong>Downloads</strong> folder. 
                    Use the "Download All" button to get a ZIP file with all stems, or download individual stems 
                    using the download button next to each track.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cultural Authenticity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Inject authentic log drums, percussion, and piano elements based on regional South African styles
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Professional Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI-powered stem separation and enhancement using industry-standard Demucs models
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regional Styles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choose from Johannesburg, Pretoria, Durban, or Cape Town production styles
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
