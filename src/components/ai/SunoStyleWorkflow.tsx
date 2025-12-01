import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Music, 
  Mic2, 
  Split, 
  Layers, 
  Wand2, 
  Check, 
  ChevronRight,
  Download,
  Edit,
  Save
} from 'lucide-react';
import LyricsGenerator from './LyricsGenerator';
import AmapianorizationControls, { AmapianorizationSettings } from './AmapianorizationControls';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AmapianorizationEngine } from '@/lib/audio/amapianorizationEngine';

interface WorkflowStep {
  id: number;
  title: string;
  icon: any;
  completed: boolean;
}

interface SunoStyleWorkflowProps {
  onComplete?: (result: any) => void;
}

export default function SunoStyleWorkflow({ onComplete }: SunoStyleWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [lyrics, setLyrics] = useState('');
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [voiceType, setVoiceType] = useState('male');
  const [voiceStyle, setVoiceStyle] = useState('smooth');
  const [genre, setGenre] = useState('amapiano');
  const [bpm, setBpm] = useState(112);
  const [energy, setEnergy] = useState(75);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [stems, setStems] = useState<any>(null);
  const [enhancedStems, setEnhancedStems] = useState<any>(null);
  const [authenticityScore, setAuthenticityScore] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const steps: WorkflowStep[] = [
    { id: 1, title: 'Generate Lyrics', icon: Music, completed: !!lyrics },
    { id: 2, title: 'Voice & Style', icon: Mic2, completed: false },
    { id: 3, title: 'Generate Song', icon: Wand2, completed: !!generatedAudio },
    { id: 4, title: 'Stem Separation', icon: Split, completed: !!stems },
    { id: 5, title: 'Amapianorize', icon: Layers, completed: false }
  ];

  const handleLyricsGenerated = (generatedLyrics: string) => {
    setLyrics(generatedLyrics);
    setCurrentStep(2);
    toast({
      title: "Lyrics Ready! ✓",
      description: "Proceed to voice selection"
    });
  };

  const generateSong = async () => {
    setIsProcessing(true);
    try {
      toast({
        title: "Generating Song...",
        description: "Creating vocals with ElevenLabs TTS"
      });

      // Call the new song generation edge function with real vocals
      const { data, error } = await supabase.functions.invoke('generate-song-with-vocals', {
        body: {
          lyrics,
          voiceType,
          voiceStyle,
          bpm,
          genre,
          energy
        }
      });

      if (error) throw error;

      if (data?.success && data?.audioUrl) {
        setGeneratedAudio(data.audioUrl);
        setCurrentStep(4);
        
        // Pass generated track to parent
        if (onComplete) {
          onComplete({
            audioUrl: data.audioUrl,
            title: `${voiceType.charAt(0).toUpperCase() + voiceType.slice(1)} Amapiano Song`,
            genre,
            bpm,
            type: 'full',
            duration: 180,
            metadata: {
              voiceType,
              voiceStyle,
              energy,
              lyrics: lyrics.substring(0, 100) + '...'
            }
          });
        }
        
        toast({
          title: "Song Generated! 🎵",
          description: "Ready for stem separation"
        });
      } else {
        throw new Error('No audio URL returned');
      }
    } catch (error) {
      console.error('Error generating song:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const separateStems = async () => {
    setIsProcessing(true);
    try {
      toast({
        title: "Separating Stems...",
        description: "This may take 1-2 minutes"
      });

      let publicUrl = generatedAudio!;

      // Check if it's a base64 data URL and needs to be uploaded
      if (generatedAudio!.startsWith('data:')) {
        const base64Data = generatedAudio!.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });

        // Upload to Supabase Storage
        const fileName = `generated-song-${Date.now()}.mp3`;
        const { error: uploadError } = await supabase.storage
          .from('samples')
          .upload(fileName, audioBlob, {
            contentType: 'audio/mpeg',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data } = supabase.storage
          .from('samples')
          .getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      console.log('[STEM-SEP] Using public URL:', publicUrl);

      const response = await fetch(
        `https://mywijmtszelyutssormy.supabase.co/functions/v1/stem-separation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioUrl: publicUrl,
            quality: 'high'
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stem separation failed');
      }

      const data = await response.json();

      if (data?.success && data?.stems) {
        setStems(data.stems);
        setCurrentStep(5);
        
        toast({
          title: "Stems Separated! ✓",
          description: "Ready for DAW import and Amapianorization"
        });
      } else {
        throw new Error('Stem separation returned no data');
      }
    } catch (error) {
      console.error('Error separating stems:', error);
      toast({
        title: "Separation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportAllAssets = async () => {
    if (!stems) {
      toast({
        title: "No Assets to Export",
        description: "Please generate and separate stems first",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      toast({
        title: "Preparing Export...",
        description: "Creating zip archive of stems"
      });

      // Prepare stems for export
      const stemUrls = Object.entries(stems)
        .filter(([_, url]) => url && typeof url === 'string')
        .map(([type, url]) => ({
          name: `${type}.wav`,
          url: url as string
        }));

      if (stemUrls.length === 0) {
        throw new Error('No valid stems available for export');
      }

      // Call zip-stems function
      const { data, error } = await supabase.functions.invoke('zip-stems', {
        body: {
          stems: stemUrls,
          projectName: `amapiano-stems-${Date.now()}`
        }
      });

      if (error) throw error;
      if (!data?.zipData) throw new Error('No zip data returned');

      // Convert base64 to blob
      const binaryString = atob(data.zipData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/zip' });
      
      // Download the zip file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || `amapiano-stems-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful! ✓",
        description: "Your stems have been downloaded to Downloads folder"
      });
    } catch (error) {
      console.error('Error exporting assets:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openInDAW = () => {
    if (onComplete) {
      onComplete({ lyrics, stems, generatedAudio });
    }
    navigate('/daw');
    toast({
      title: "Opening DAW...",
      description: "Load your stems and start enhancing!"
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center min-w-fit">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : step.completed
                  ? 'bg-green-500/10 border-green-500 text-green-500'
                  : 'bg-muted border-muted-foreground/20'
              }`}
            >
              {step.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <LyricsGenerator onLyricsGenerated={handleLyricsGenerated} />
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Voice & Style Configuration</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voice Type</label>
                    <Select value={voiceType} onValueChange={setVoiceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male Voice</SelectItem>
                        <SelectItem value="female">Female Voice</SelectItem>
                        <SelectItem value="duet">Male & Female Duet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Voice Style</label>
                    <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smooth">Smooth & Melodic</SelectItem>
                        <SelectItem value="powerful">Powerful & Energetic</SelectItem>
                        <SelectItem value="raspy">Raspy & Soulful</SelectItem>
                        <SelectItem value="soft">Soft & Intimate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">BPM: {bpm}</label>
                  <Slider
                    value={[bpm]}
                    onValueChange={(value) => setBpm(value[0])}
                    min={90}
                    max={130}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Energy Level: {energy}%</label>
                  <Slider
                    value={[energy]}
                    onValueChange={(value) => setEnergy(value[0])}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      <strong>Lyrics:</strong>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingLyrics(!isEditingLyrics)}
                    >
                      {isEditingLyrics ? (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                  {isEditingLyrics ? (
                    <Textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="Edit your lyrics..."
                    />
                  ) : (
                    <div className="text-sm mt-2 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {lyrics}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back to Lyrics
                </Button>
                <Button onClick={() => setCurrentStep(3)} className="flex-1">
                  Continue to Generation
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Generate Full Song</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Voice</p>
                    <Badge variant="secondary">{voiceType} - {voiceStyle}</Badge>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Music</p>
                    <Badge variant="secondary">{genre} @ {bpm} BPM</Badge>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    🎵 Your song will be generated with authentic {genre} instrumentals,
                    {voiceType} vocals, and the lyrics you created. This process takes 1-2 minutes.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={generateSong} 
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Generating...' : 'Generate Song'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Stem Separation</h3>
                
                <p className="text-sm text-muted-foreground">
                  Separate your generated song into individual stems for detailed mixing and processing.
                </p>

                {generatedAudio && !stems && (
                  <Button 
                    onClick={separateStems}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Separating Stems...' : 'Separate into Stems'}
                  </Button>
                )}

                {stems && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-500">✓ Stems separated successfully!</p>
                    <div className="grid gap-2">
                      {Object.keys(stems).map((stemType) => (
                        <div key={stemType} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="capitalize">{stemType}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {stems && (
                <div className="flex gap-2">
                  <Button onClick={() => setCurrentStep(5)} className="flex-1">
                    Continue to Amapianorize
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Amapianorize & Enhance
                </h3>
                
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    🎹 Transform your song with authentic Amapiano elements:
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>Log drum patterns with regional variations</li>
                    <li>Deep sub-basslines</li>
                    <li>Jazz-influenced piano chords</li>
                    <li>Layered percussive elements</li>
                    <li>Sidechain compression & filter sweeps</li>
                    <li>Vocal chops and effects</li>
                  </ul>
                </div>

                {/* Amapianorization Engine Integration */}
                <AmapianorizationControls
                  onApply={async (settings: AmapianorizationSettings) => {
                    setIsProcessing(true);
                    try {
                      toast({
                        title: "Applying Amapianorization...",
                        description: "Injecting authentic amapiano elements"
                      });

                      // Apply amapianorization to stems
                      const engine = new AmapianorizationEngine();
                      const result = await engine.amapianorize(
                        stems.vocals || '', // Pass actual stem URLs
                        {
                          region: settings.region,
                          intensity: settings.intensity / 100,
                          elements: {
                            logDrums: settings.logDrums,
                            percussion: settings.percussion,
                            piano: settings.piano,
                            bass: settings.bass,
                            sidechain: settings.sidechain,
                            filterSweeps: settings.filterSweeps,
                          }
                        }
                      );

                      setEnhancedStems(result.stems);
                      setAuthenticityScore(result.authenticityScore);

                      toast({
                        title: "Amapianorization Complete! ✓",
                        description: `Authenticity Score: ${result.authenticityScore.toFixed(1)}%`
                      });
                    } catch (error) {
                      console.error('Amapianorization error:', error);
                      toast({
                        title: "Enhancement Failed",
                        description: error instanceof Error ? error.message : "Please try again",
                        variant: "destructive"
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  isProcessing={isProcessing}
                />

                {/* Authenticity Score Display */}
                {authenticityScore !== null && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Authenticity Score</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        {authenticityScore.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your track has been enhanced with authentic amapiano elements
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={exportAllAssets}
                  disabled={isExporting || !stems}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export All Assets'}
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={openInDAW}
                  disabled={!stems}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Open in DAW
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
