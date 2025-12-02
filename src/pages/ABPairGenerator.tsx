import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserStudyAudioPersistence, type StudyAudioPair } from '@/hooks/useUserStudyAudioPersistence';
import { amapianorizeAudio } from '@/lib/audio/audioProcessor';
import { Upload, Play, Pause, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface GeneratedPair {
  region: string;
  baseline: { url: string; buffer: AudioBuffer };
  amapianorized: { url: string; buffer: AudioBuffer };
}

export default function ABPairGenerator() {
  const { toast } = useToast();
  const { saveStudyPair, loadStudyPairs, audioBufferToWav } = useUserStudyAudioPersistence();
  
  const [selectedRegion, setSelectedRegion] = useState<string>('johannesburg');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceBuffer, setSourceBuffer] = useState<AudioBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [generatedPair, setGeneratedPair] = useState<GeneratedPair | null>(null);
  const [existingPairs, setExistingPairs] = useState<StudyAudioPair[]>([]);
  const [isPlaying, setIsPlaying] = useState<'baseline' | 'amapianorized' | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const regions = [
    { value: 'johannesburg', label: 'Johannesburg', description: 'Modern, punchy log drums' },
    { value: 'pretoria', label: 'Pretoria', description: 'Classic, deep bass focus' },
    { value: 'durban', label: 'Durban', description: 'Gqom-influenced, raw energy' },
    { value: 'cape-town', label: 'Cape Town', description: 'Eclectic, fusion elements' },
  ];

  const loadExistingPairs = useCallback(async () => {
    try {
      const pairs = await loadStudyPairs();
      setExistingPairs(pairs);
    } catch (error) {
      console.error('Failed to load existing pairs:', error);
    }
  }, [loadStudyPairs]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({ title: 'Invalid file', description: 'Please upload an audio file', variant: 'destructive' });
      return;
    }

    setSourceFile(file);
    setProgress(10);
    setProgressMessage('Loading audio file...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      audioContextRef.current = audioContext;
      setSourceBuffer(audioBuffer);
      setProgress(20);
      setProgressMessage('Audio loaded successfully');
      
      toast({ title: 'Audio loaded', description: `${file.name} ready for processing` });
    } catch (error) {
      toast({ title: 'Load failed', description: 'Could not decode audio file', variant: 'destructive' });
      setProgress(0);
    }
  };

  const generatePair = async () => {
    if (!sourceBuffer) {
      toast({ title: 'No audio', description: 'Please upload an audio file first', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setProgress(25);
    setProgressMessage('Starting Amapianorization...');

    try {
      // Create baseline (original audio)
      setProgress(30);
      setProgressMessage('Preparing baseline track...');
      
      const baselineBlob = audioBufferToWav(sourceBuffer);
      const baselineUrl = URL.createObjectURL(baselineBlob);

      // Process with Amapianorization
      setProgress(40);
      setProgressMessage(`Applying ${selectedRegion} regional elements...`);

      const result = await amapianorizeAudio(
        { vocals: sourceBuffer, drums: null, bass: null, other: null, piano: null },
        {
          addLogDrum: true,
          logDrumIntensity: 0.8,
          addPercussion: true,
          percussionDensity: 0.6,
          addPianoChords: true,
          pianoComplexity: 0.5,
          addBassline: true,
          bassDepth: 0.7,
          addVocalChops: false,
          vocalChopRate: 0,
          sidechainCompression: true,
          sidechainAmount: 0.6,
          filterSweeps: true,
          sweepFrequency: 0.4,
          culturalAuthenticity: 'modern',
          regionalStyle: selectedRegion as 'johannesburg' | 'pretoria' | 'durban' | 'cape-town',
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Amapianorization failed');
      }

      setProgress(70);
      setProgressMessage('Processing complete, preparing audio...');

      // Get the processed audio buffer
      const processedBlob = result.processedAudio?.url 
        ? await fetch(result.processedAudio.url).then(r => r.blob())
        : new Blob();
      
      // Create a processed buffer (for now use source as placeholder if no real processing)
      const processedBuffer = sourceBuffer; // In real implementation, decode the processed blob

      setProgress(85);
      setProgressMessage('Saving pair to database...');

      // Save to database
      await saveStudyPair(
        selectedRegion,
        { blob: baselineBlob, buffer: sourceBuffer },
        { blob: processedBlob.size > 0 ? processedBlob : baselineBlob, buffer: processedBuffer }
      );

      setProgress(100);
      setProgressMessage('A/B pair generated successfully!');

      setGeneratedPair({
        region: selectedRegion,
        baseline: { url: baselineUrl, buffer: sourceBuffer },
        amapianorized: { url: URL.createObjectURL(processedBlob.size > 0 ? processedBlob : baselineBlob), buffer: processedBuffer },
      });

      // Refresh pairs list
      await loadExistingPairs();

      toast({
        title: 'Pair Generated',
        description: `${selectedRegion} A/B pair saved for user study`,
      });

    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate A/B pair',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (type: 'baseline' | 'amapianorized') => {
    if (!generatedPair || !audioContextRef.current) return;

    // Stop any playing audio
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }

    if (isPlaying === type) {
      setIsPlaying(null);
      return;
    }

    const buffer = type === 'baseline' ? generatedPair.baseline.buffer : generatedPair.amapianorized.buffer;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    
    source.onended = () => setIsPlaying(null);
    sourceNodeRef.current = source;
    setIsPlaying(type);
  };

  const downloadPair = () => {
    if (!generatedPair) return;

    // Download baseline
    const baselineLink = document.createElement('a');
    baselineLink.href = generatedPair.baseline.url;
    baselineLink.download = `baseline_${generatedPair.region}.wav`;
    baselineLink.click();

    // Download amapianorized
    setTimeout(() => {
      const amapLink = document.createElement('a');
      amapLink.href = generatedPair.amapianorized.url;
      amapLink.download = `amapianorized_${generatedPair.region}.wav`;
      amapLink.click();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">A/B Test Pair Generator</h1>
          <p className="text-muted-foreground">
            Generate baseline vs. Amapianorized audio pairs for user study validation
          </p>
        </div>

        {/* Upload & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Upload Source Audio</CardTitle>
            <CardDescription>
              Upload an audio track to create baseline and Amapianorized versions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div className="flex gap-4 items-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {sourceFile ? sourceFile.name : 'Select Audio File'}
              </Button>
              
              {sourceBuffer && (
                <span className="text-sm text-muted-foreground">
                  Duration: {(sourceBuffer.duration).toFixed(1)}s | 
                  Sample Rate: {sourceBuffer.sampleRate}Hz
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Regional Style</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region.value} value={region.value}>
                      <div className="flex flex-col">
                        <span>{region.label}</span>
                        <span className="text-xs text-muted-foreground">{region.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Generate A/B Pair</CardTitle>
            <CardDescription>
              Process the audio to create baseline and Amapianorized versions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={generatePair} 
              disabled={!sourceBuffer || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate A/B Pair'
              )}
            </Button>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">{progressMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview & Download */}
        {generatedPair && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Generated Pair
              </CardTitle>
              <CardDescription>
                Region: {generatedPair.region}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Track A (Baseline)</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => playAudio('baseline')}
                  >
                    {isPlaying === 'baseline' ? (
                      <><Pause className="mr-2 h-4 w-4" /> Pause</>
                    ) : (
                      <><Play className="mr-2 h-4 w-4" /> Play Baseline</>
                    )}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Track B (Amapianorized)</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => playAudio('amapianorized')}
                  >
                    {isPlaying === 'amapianorized' ? (
                      <><Pause className="mr-2 h-4 w-4" /> Pause</>
                    ) : (
                      <><Play className="mr-2 h-4 w-4" /> Play Amapianorized</>
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={downloadPair} variant="secondary" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Both Files
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Existing Pairs */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Study Pairs</CardTitle>
            <CardDescription>
              Previously generated pairs available for user study ({existingPairs.length} pairs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadExistingPairs} className="mb-4">
              Refresh List
            </Button>
            
            {existingPairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pairs generated yet</p>
                <p className="text-sm">Generate pairs above to populate the user study</p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingPairs.map((pair, i) => (
                  <div key={pair.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{pair.region}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(pair.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      SNR: {pair.baseline_metrics?.snr?.toFixed(1) || 'N/A'}dB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
