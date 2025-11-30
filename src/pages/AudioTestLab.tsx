import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, Pause, Download, Volume2, Music, Wand2 } from 'lucide-react';
import { AmapianorizeSettings } from '@/lib/audio/audioProcessor';
import { amapianorizeAudio } from '@/lib/audio/audioProcessor';
import { LOG_DRUM_SAMPLES } from '@/lib/audio/logDrumLibrary';
import { PERCUSSION_SAMPLES } from '@/lib/audio/percussionLibrary';
import { SampleGenerator } from '@/lib/audio/sampleGenerator';

export default function AudioTestLab() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [generatedSamples, setGeneratedSamples] = useState<Map<string, Blob>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [settings, setSettings] = useState<AmapianorizeSettings>({
    addLogDrum: true,
    logDrumIntensity: 0.7,
    addPercussion: true,
    percussionDensity: 0.6,
    addPianoChords: false,
    pianoComplexity: 0.5,
    addBassline: false,
    bassDepth: 0.5,
    addVocalChops: false,
    vocalChopRate: 0.5,
    sidechainCompression: true,
    sidechainAmount: 0.6,
    filterSweeps: true,
    sweepFrequency: 0.5,
    culturalAuthenticity: 'modern' as const,
    regionalStyle: 'johannesburg' as const,
  });

  const testAudioProcess = async () => {
    setIsProcessing(true);
    try {
      toast.info('Starting audio processing test...');
      
      // Create mock stems for testing
      const mockStems = {
        vocals: null,
        drums: null,
        bass: null,
        other: null,
      };

      const result = await amapianorizeAudio(mockStems, settings);
      
      if (result.processedAudio?.url) {
        setProcessedAudioUrl(result.processedAudio.url);
        toast.success(`Processing complete! Authenticity: ${result.authenticityScore}%`);
      } else {
        toast.error('Processing failed - no audio URL returned');
      }
    } catch (error) {
      console.error('Audio processing test failed:', error);
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !processedAudioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const downloadAudio = () => {
    if (!processedAudioUrl) return;
    const a = document.createElement('a');
    a.href = processedAudioUrl;
    a.download = 'amapianorized-test.wav';
    a.click();
  };

  const generateSampleLibrary = async () => {
    setIsGeneratingSamples(true);
    toast.info('Generating synthetic sample library...');

    try {
      const generator = new SampleGenerator();
      
      // Generate log drum library
      toast.info('Generating log drum samples...');
      const logDrumLib = generator.generateLogDrumLibrary();
      console.log(`Generated ${logDrumLib.size} log drum samples`);
      
      // Generate percussion library
      toast.info('Generating percussion samples...');
      const percussionLib = generator.generatePercussionLibrary();
      console.log(`Generated ${percussionLib.size} percussion samples`);
      
      // Combine libraries
      const combined = new Map([...logDrumLib, ...percussionLib]);
      setGeneratedSamples(combined);
      
      toast.success(`Generated ${combined.size} audio samples ready for testing`);
      
    } catch (error) {
      console.error('Error generating samples:', error);
      toast.error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingSamples(false);
    }
  };

  const downloadSampleLibrary = () => {
    if (generatedSamples.size === 0) {
      toast.error('Generate samples first');
      return;
    }

    toast.info(`Downloading ${generatedSamples.size} samples...`);
    
    // Download each sample individually
    generatedSamples.forEach((blob, filename) => {
      setTimeout(() => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Music className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Audio Test Lab</h1>
            <p className="text-muted-foreground">
              Test WebAudio processing with log drums and percussion
            </p>
          </div>
        </div>

        {/* Sample Library Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Library Generator</CardTitle>
            <CardDescription>
              Generate synthetic audio samples for testing audio processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Log Drums Defined:</span>
                <Badge className="ml-2" variant="secondary">{LOG_DRUM_SAMPLES.length}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Percussion Defined:</span>
                <Badge className="ml-2" variant="secondary">{PERCUSSION_SAMPLES.length}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Generated Samples:</span>
                <Badge className="ml-2">{generatedSamples.size}</Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={generateSampleLibrary}
                disabled={isGeneratingSamples}
                className="flex-1"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {isGeneratingSamples ? 'Generating...' : 'Generate Sample Library'}
              </Button>
              
              {generatedSamples.size > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadSampleLibrary}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sample Library Status */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log Drum Library</CardTitle>
              <CardDescription>Available samples across regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Samples:</span>
                  <Badge variant="secondary">{LOG_DRUM_SAMPLES.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Johannesburg:</span>
                  <Badge>{LOG_DRUM_SAMPLES.filter(s => s.region === 'johannesburg').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pretoria:</span>
                  <Badge>{LOG_DRUM_SAMPLES.filter(s => s.region === 'pretoria').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Durban:</span>
                  <Badge>{LOG_DRUM_SAMPLES.filter(s => s.region === 'durban').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cape Town:</span>
                  <Badge>{LOG_DRUM_SAMPLES.filter(s => s.region === 'cape-town').length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Percussion Library</CardTitle>
              <CardDescription>Available percussion elements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Samples:</span>
                  <Badge variant="secondary">{PERCUSSION_SAMPLES.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Shakers:</span>
                  <Badge>{PERCUSSION_SAMPLES.filter(s => s.type === 'shaker').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Congas:</span>
                  <Badge>{PERCUSSION_SAMPLES.filter(s => s.type === 'conga').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Other:</span>
                  <Badge>{PERCUSSION_SAMPLES.filter(s => !['shaker', 'conga'].includes(s.type)).length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Amapianorization Settings</CardTitle>
            <CardDescription>Configure audio processing parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Log Drum Intensity</label>
                  <span className="text-sm text-muted-foreground">{settings.logDrumIntensity.toFixed(2)}</span>
                </div>
                <Slider
                  value={[settings.logDrumIntensity]}
                  onValueChange={([value]) => setSettings({ ...settings, logDrumIntensity: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  disabled={isProcessing}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Percussion Density</label>
                  <span className="text-sm text-muted-foreground">{settings.percussionDensity.toFixed(2)}</span>
                </div>
                <Slider
                  value={[settings.percussionDensity]}
                  onValueChange={([value]) => setSettings({ ...settings, percussionDensity: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  disabled={isProcessing}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Sidechain Amount</label>
                  <span className="text-sm text-muted-foreground">{settings.sidechainAmount.toFixed(2)}</span>
                </div>
                <Slider
                  value={[settings.sidechainAmount]}
                  onValueChange={([value]) => setSettings({ ...settings, sidechainAmount: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Regional Style</label>
                <div className="flex gap-2">
                  {(['johannesburg', 'pretoria', 'durban', 'cape-town'] as const).map(region => (
                    <Button
                      key={region}
                      variant={settings.regionalStyle === region ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettings({ ...settings, regionalStyle: region })}
                      disabled={isProcessing}
                    >
                      {region.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={testAudioProcess} 
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing...' : 'Test Audio Processing'}
            </Button>
          </CardContent>
        </Card>

        {/* Playback Controls */}
        {processedAudioUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Processed Audio</CardTitle>
              <CardDescription>Preview and download the processed audio</CardDescription>
            </CardHeader>
            <CardContent>
              <audio
                ref={audioRef}
                src={processedAudioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex gap-3">
                <Button onClick={togglePlayback} variant="outline">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
                </Button>
                <Button onClick={downloadAudio} variant="outline">
                  <Download className="w-4 h-4" />
                  <span className="ml-2">Download</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
