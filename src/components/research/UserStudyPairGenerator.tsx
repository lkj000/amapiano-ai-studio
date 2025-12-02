import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserStudyAudioPersistence, AudioQualityMetrics } from '@/hooks/useUserStudyAudioPersistence';
import { Play, Pause, Upload, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const REGIONS = [
  { value: 'johannesburg', label: 'Johannesburg', description: 'Heavy log drums, aggressive bass' },
  { value: 'pretoria', label: 'Pretoria', description: 'Melodic keys, smooth bass' },
  { value: 'durban', label: 'Durban', description: 'Gqom-influenced, heavy percussion' },
  { value: 'cape_town', label: 'Cape Town', description: 'Deep house fusion, atmospheric' },
];

interface GeneratedPair {
  region: string;
  baseline: { url: string; metrics: AudioQualityMetrics };
  amapianorized: { url: string; metrics: AudioQualityMetrics };
  savedAt: string;
}

export function UserStudyPairGenerator() {
  const { toast } = useToast();
  const { saveStudyPair, loadStudyPairs, audioBufferToWav, calculateAudioMetrics } = useUserStudyAudioPersistence();
  
  const [selectedRegion, setSelectedRegion] = useState('johannesburg');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedPairs, setGeneratedPairs] = useState<GeneratedPair[]>([]);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: 'Invalid File',
          description: 'Please upload an audio file (WAV, MP3)',
          variant: 'destructive',
        });
        return;
      }
      setUploadedFile(file);
      toast({
        title: 'File Uploaded',
        description: `${file.name} ready for processing`,
      });
    }
  }, [toast]);

  const processAudio = useCallback(async () => {
    if (!uploadedFile) {
      toast({
        title: 'No File',
        description: 'Please upload an audio file first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Load audio file
      setProgress(10);
      const audioContext = new AudioContext();
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setProgress(30);

      // Step 2: Create baseline (copy of original)
      const baselineBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        originalBuffer.length,
        originalBuffer.sampleRate
      );
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        baselineBuffer.copyToChannel(originalBuffer.getChannelData(channel), channel);
      }
      
      setProgress(50);

      // Step 3: Apply Amapianorization (simulated processing for demo)
      // In production, this would call the actual Amapianorization engine
      const amapianorizedBuffer = await applySimulatedAmapianorization(
        originalBuffer,
        audioContext,
        selectedRegion
      );
      
      setProgress(70);

      // Step 4: Convert to WAV blobs
      const baselineBlob = audioBufferToWav(baselineBuffer);
      const amapianorizedBlob = audioBufferToWav(amapianorizedBuffer);
      
      setProgress(85);

      // Step 5: Save to storage with metrics
      const result = await saveStudyPair(
        selectedRegion,
        { blob: baselineBlob, buffer: baselineBuffer },
        { blob: amapianorizedBlob, buffer: amapianorizedBuffer }
      );
      
      setProgress(100);

      // Add to local state
      setGeneratedPairs(prev => [...prev, {
        region: selectedRegion,
        baseline: result.baseline,
        amapianorized: result.amapianorized,
        savedAt: new Date().toISOString(),
      }]);

      toast({
        title: 'Pair Generated',
        description: `Audio pair for ${selectedRegion} saved successfully`,
      });

      audioContext.close();
    } catch (error) {
      console.error('Processing failed:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process audio',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [uploadedFile, selectedRegion, saveStudyPair, audioBufferToWav, toast]);

  const playAudio = useCallback((url: string) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    if (playingUrl === url) {
      setPlayingUrl(null);
      setAudioElement(null);
      return;
    }

    const audio = new Audio(url);
    audio.onended = () => {
      setPlayingUrl(null);
      setAudioElement(null);
    };
    audio.play();
    setPlayingUrl(url);
    setAudioElement(audio);
  }, [playingUrl, audioElement]);

  const loadExistingPairs = useCallback(async () => {
    try {
      const pairs = await loadStudyPairs();
      setGeneratedPairs(pairs.map(p => ({
        region: p.region,
        baseline: { url: p.baseline_url, metrics: p.baseline_metrics },
        amapianorized: { url: p.amapianorized_url, metrics: p.amapianorized_metrics },
        savedAt: p.created_at,
      })));
      toast({
        title: 'Pairs Loaded',
        description: `Found ${pairs.length} existing study pairs`,
      });
    } catch (error) {
      console.error('Load failed:', error);
    }
  }, [loadStudyPairs, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            User Study Pair Generator
          </CardTitle>
          <CardDescription>
            Generate A/B audio pairs for user study validation with quality metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Region Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Regional Style</label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(region => (
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

          {/* File Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Source Audio</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
              />
            </div>
            {uploadedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {progress < 30 ? 'Loading audio...' :
                 progress < 50 ? 'Creating baseline...' :
                 progress < 70 ? 'Applying Amapianorization...' :
                 progress < 85 ? 'Converting to WAV...' :
                 'Saving to storage...'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={processAudio} 
              disabled={!uploadedFile || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Generate Pair
                </>
              )}
            </Button>
            <Button variant="outline" onClick={loadExistingPairs}>
              <Download className="h-4 w-4 mr-2" />
              Load Existing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Pairs */}
      {generatedPairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Study Pairs ({generatedPairs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedPairs.map((pair, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{pair.region}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(pair.savedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Baseline */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Baseline (A)</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => playAudio(pair.baseline.url)}
                        >
                          {playingUrl === pair.baseline.url ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs space-y-1">
                        <p>SNR: {pair.baseline.metrics.snr.toFixed(1)} dB</p>
                        <p>Peak: {pair.baseline.metrics.peakLevel.toFixed(1)} dB</p>
                        <p>RMS: {pair.baseline.metrics.rmsLevel.toFixed(1)} dB</p>
                      </div>
                    </div>

                    {/* Amapianorized */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Amapianorized (B)</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => playAudio(pair.amapianorized.url)}
                        >
                          {playingUrl === pair.amapianorized.url ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs space-y-1">
                        <p>SNR: {pair.amapianorized.metrics.snr.toFixed(1)} dB</p>
                        <p>Peak: {pair.amapianorized.metrics.peakLevel.toFixed(1)} dB</p>
                        <p>RMS: {pair.amapianorized.metrics.rmsLevel.toFixed(1)} dB</p>
                      </div>
                    </div>
                  </div>

                  {/* Quality Comparison */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {pair.amapianorized.metrics.snr >= pair.baseline.metrics.snr * 0.9 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        Quality {pair.amapianorized.metrics.snr >= pair.baseline.metrics.snr * 0.9 ? 'maintained' : 'slightly reduced'} after processing
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Simulated Amapianorization for demo purposes
 * In production, this would use the actual WebAudio processing engine
 */
async function applySimulatedAmapianorization(
  inputBuffer: AudioBuffer,
  audioContext: AudioContext,
  region: string
): Promise<AudioBuffer> {
  const outputBuffer = audioContext.createBuffer(
    inputBuffer.numberOfChannels,
    inputBuffer.length,
    inputBuffer.sampleRate
  );

  // Apply region-specific processing (simplified)
  for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
    const inputData = inputBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);

    // Copy with slight modifications based on region
    for (let i = 0; i < inputData.length; i++) {
      let sample = inputData[i];

      // Add subtle region-specific character
      switch (region) {
        case 'johannesburg':
          // Slight bass boost simulation
          sample *= 1.05;
          break;
        case 'pretoria':
          // Slight mid-range emphasis
          sample *= 1.02;
          break;
        case 'durban':
          // Slight high-end emphasis
          sample *= 1.03;
          break;
        case 'cape_town':
          // Slight compression effect
          sample = Math.tanh(sample * 1.1);
          break;
      }

      // Ensure no clipping
      outputData[i] = Math.max(-1, Math.min(1, sample));
    }
  }

  return outputBuffer;
}
