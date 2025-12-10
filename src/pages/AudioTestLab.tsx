import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, Pause, Download, Volume2, Music, Wand2, Upload, Zap, BarChart3, Cloud } from 'lucide-react';
import { AmapianorizeSettings } from '@/lib/audio/audioProcessor';
import { amapianorizeAudio } from '@/lib/audio/audioProcessor';
import { LOG_DRUM_SAMPLES } from '@/lib/audio/logDrumLibrary';
import { PERCUSSION_SAMPLES } from '@/lib/audio/percussionLibrary';
import { SampleGenerator } from '@/lib/audio/sampleGenerator';
import { SVDQuantAudio, QuantizationResult } from '@/lib/audio/svdQuantAudio';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

export default function AudioTestLab() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const [generatedSamples, setGeneratedSamples] = useState<Map<string, Blob>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Quantization state
  const [quantBitDepth, setQuantBitDepth] = useState<4 | 8 | 16>(8);
  const [isQuantizing, setIsQuantizing] = useState(false);
  const [quantResult, setQuantResult] = useState<QuantizationResult | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [quantizedAudioUrl, setQuantizedAudioUrl] = useState<string | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingQuantized, setPlayingQuantized] = useState(false);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const quantizedAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Modal GPU state
  const [isModalQuantizing, setIsModalQuantizing] = useState(false);
  const [modalResult, setModalResult] = useState<{
    snr_db: number;
    compression_ratio: number;
    rank_used: number;
    success: boolean;
  } | null>(null);
  
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

  // Quantization handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      setOriginalAudioUrl(url);
      setQuantizedAudioUrl(null);
      setQuantResult(null);
      toast.success(`Loaded: ${file.name}`);
    } catch (error) {
      toast.error('Failed to load audio file');
    }
  };

  const runQuantization = async () => {
    if (!originalAudioUrl) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsQuantizing(true);
    try {
      toast.info(`Applying ${quantBitDepth}-bit quantization...`);
      
      // Fetch and decode the audio
      const response = await fetch(originalAudioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Run quantization
      const quantizer = new SVDQuantAudio({
        bitDepth: quantBitDepth,
        preservePhase: true,
        preserveTransients: true,
        preserveStereoImaging: true,
        // targetFAD is adaptive: 4-bit=25%, 8-bit=15%, 16-bit=5%
      });
      
      const { quantizedBuffer, result } = await quantizer.quantize(audioBuffer);
      setQuantResult(result);
      
      // Convert quantized buffer to blob URL
      const wavData = audioBufferToWav(quantizedBuffer);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const quantUrl = URL.createObjectURL(blob);
      setQuantizedAudioUrl(quantUrl);
      
      toast.success(`Quantization complete! Degradation: ${result.degradation.toFixed(1)}%`);
      await audioContext.close();
    } catch (error) {
      console.error('Quantization failed:', error);
      toast.error(`Quantization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsQuantizing(false);
    }
  };

  // Helper to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = buffer.length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Interleave channels and write samples
    let offset = 44;
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  const toggleOriginalPlayback = () => {
    if (!originalAudioRef.current) return;
    if (playingOriginal) {
      originalAudioRef.current.pause();
    } else {
      quantizedAudioRef.current?.pause();
      setPlayingQuantized(false);
      originalAudioRef.current.play();
    }
    setPlayingOriginal(!playingOriginal);
  };

  const toggleQuantizedPlayback = () => {
    if (!quantizedAudioRef.current) return;
    if (playingQuantized) {
      quantizedAudioRef.current.pause();
    } else {
      originalAudioRef.current?.pause();
      setPlayingOriginal(false);
      quantizedAudioRef.current.play();
    }
    setPlayingQuantized(!playingQuantized);
  };

  // Modal GPU Quantization
  const runModalQuantization = async () => {
    if (!originalAudioUrl) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsModalQuantizing(true);
    try {
      toast.info(`Calling Modal GPU with ${quantBitDepth}-bit quantization...`);
      
      // Fetch audio and convert to base64 (chunked to avoid stack overflow)
      const response = await fetch(originalAudioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get float32 samples from first channel
      const samples = audioBuffer.getChannelData(0);
      const uint8Array = new Uint8Array(samples.buffer);
      
      // Chunked base64 encoding to avoid "Maximum call stack size exceeded"
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      
      // Call Modal via edge function
      const { data, error } = await supabase.functions.invoke('modal-quantize', {
        body: {
          audio_base64: base64,
          target_bits: quantBitDepth,
          sample_rate: audioBuffer.sampleRate,
        },
      });

      if (error) throw error;
      
      setModalResult(data);
      toast.success(`Modal GPU: SNR=${data.snr_db?.toFixed(2)}dB, rank=${data.rank_used}`);
      await audioContext.close();
    } catch (error) {
      console.error('Modal quantization failed:', error);
      toast.error(`Modal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsModalQuantizing(false);
    }
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

        {/* SVDQuant-Audio Test Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle>SVDQuant-Audio Test (WP1)</CardTitle>
            </div>
            <CardDescription>
              Phase-aware quantization preserving transients, stereo imaging, and rhythmic integrity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Audio File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {originalAudioUrl ? 'Change Audio File' : 'Select Audio File'}
              </Button>
              {originalAudioUrl && (
                <p className="text-xs text-muted-foreground text-center">Audio loaded ✓</p>
              )}
            </div>

            {/* Bit Depth Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantization Bit Depth</label>
              <div className="flex gap-2">
                {([4, 8, 16] as const).map(bits => (
                  <Button
                    key={bits}
                    variant={quantBitDepth === bits ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuantBitDepth(bits)}
                    disabled={isQuantizing}
                    className="flex-1"
                  >
                    {bits}-bit
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {quantBitDepth === 4 && 'Aggressive compression, target <25% FAD degradation'}
                {quantBitDepth === 8 && 'Balanced quality/size, target <15% FAD degradation'}
                {quantBitDepth === 16 && 'High quality, target <5% FAD degradation'}
              </p>
            </div>

            {/* Run Quantization */}
            <Button
              onClick={runQuantization}
              disabled={!originalAudioUrl || isQuantizing}
              className="w-full"
              size="lg"
            >
              <Zap className="mr-2 h-4 w-4" />
              {isQuantizing ? 'Quantizing...' : 'Run Phase-Aware Quantization'}
            </Button>

            {/* Quality Metrics */}
            {quantResult && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="font-medium">Quality Metrics</span>
                  <Badge variant={quantResult.success ? 'default' : 'destructive'}>
                    {quantResult.success ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>FAD Score</span>
                      <span className={quantResult.success ? 'text-green-500' : 'text-destructive'}>
                        {(quantResult.qualityMetrics.fadScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(1 - quantResult.qualityMetrics.fadScore) * 100} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Phase Coherence</span>
                      <span>{(quantResult.qualityMetrics.phaseCoherence * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={quantResult.qualityMetrics.phaseCoherence * 100} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Transient Preservation</span>
                      <span>{(quantResult.qualityMetrics.transientPreservation * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={quantResult.qualityMetrics.transientPreservation * 100} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Stereo Imaging</span>
                      <span>{(quantResult.qualityMetrics.stereoImageWidth * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={quantResult.qualityMetrics.stereoImageWidth * 100} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Dynamic Range</span>
                      <span>{(quantResult.qualityMetrics.dynamicRange * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, quantResult.qualityMetrics.dynamicRange * 100)} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Compression Ratio</span>
                      <span>{quantResult.compressionRatio.toFixed(1)}x</span>
                    </div>
                    <Progress value={Math.min(100, (quantResult.compressionRatio / 4) * 100)} className="h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Original: {(quantResult.originalSize / 1024).toFixed(0)} KB</div>
                  <div>Quantized: {(quantResult.quantizedSize / 1024).toFixed(0)} KB</div>
                </div>
              </div>
            )}

            {/* A/B Comparison Playback */}
            {originalAudioUrl && quantizedAudioUrl && (
              <div className="space-y-3 pt-4 border-t">
                <span className="text-sm font-medium">A/B Comparison</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <audio
                      ref={originalAudioRef}
                      src={originalAudioUrl}
                      onEnded={() => setPlayingOriginal(false)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={toggleOriginalPlayback}
                      className="w-full"
                    >
                      {playingOriginal ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      Original
                    </Button>
                  </div>
                  <div>
                    <audio
                      ref={quantizedAudioRef}
                      src={quantizedAudioUrl}
                      onEnded={() => setPlayingQuantized(false)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={toggleQuantizedPlayback}
                      className="w-full"
                    >
                      {playingQuantized ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      Quantized
                    </Button>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (quantizedAudioUrl) {
                      const a = document.createElement('a');
                      a.href = quantizedAudioUrl;
                      a.download = `quantized-${quantBitDepth}bit.wav`;
                      a.click();
                    }
                  }}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Quantized Audio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal GPU Test Section */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-green-500" />
              <CardTitle>Modal GPU Quantization</CardTitle>
              <Badge variant="outline" className="text-green-500 border-green-500">
                A10G GPU
              </Badge>
            </div>
            <CardDescription>
              Run SVDQuant-Audio on Modal's A10G GPU (PyTorch + CUDA)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This calls your deployed Modal backend at <code className="text-xs bg-muted px-1 py-0.5 rounded">aura-x-backend</code> for 
              GPU-accelerated quantization with Hann window and phase preservation.
            </p>
            
            <Button
              onClick={runModalQuantization}
              disabled={!originalAudioUrl || isModalQuantizing}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Cloud className="mr-2 h-4 w-4" />
              {isModalQuantizing ? 'Processing on GPU...' : `Run ${quantBitDepth}-bit on Modal GPU`}
            </Button>

            {modalResult && (
              <div className="space-y-3 pt-4 border-t border-green-500/20">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Modal GPU Results</span>
                  <Badge variant={modalResult.success ? 'default' : 'destructive'} className="bg-green-600">
                    {modalResult.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{modalResult.snr_db?.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">SNR (dB)</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{modalResult.compression_ratio?.toFixed(1)}x</div>
                    <div className="text-xs text-muted-foreground">Compression</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{modalResult.rank_used}</div>
                    <div className="text-xs text-muted-foreground">SVD Rank</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
