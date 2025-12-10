/**
 * ML Quantize Page
 * SVDQuant-Audio phase-coherent quantization via Modal GPU backend
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, Play, Pause, Download, Cpu, Zap, 
  CheckCircle2, XCircle, AlertTriangle, Music
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QuantizationResult {
  success: boolean;
  snr_db?: number;
  fad?: number;
  compression_ratio?: number;
  rank_used?: number;
  quantized_url?: string;
  phase_coherence?: number;
  transient_preservation?: number;
  stereo_imaging?: number;
  dynamic_range?: number;
}

export default function MLQuantize() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [publicAudioUrl, setPublicAudioUrl] = useState<string | null>(null);
  const [bitDepth, setBitDepth] = useState(8);
  const [isQuantizing, setIsQuantizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<QuantizationResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload audio to Supabase Storage for public URL
  const uploadToStorage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('temp-audio')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('temp-audio')
        .getPublicUrl(data.path);

      toast.success('Audio uploaded to cloud storage');
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload audio to storage');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setResult(null);

    // Create local blob URL for playback
    const localUrl = URL.createObjectURL(file);
    setAudioUrl(localUrl);

    // Upload to Supabase Storage for Modal GPU access
    const publicUrl = await uploadToStorage(file);
    setPublicAudioUrl(publicUrl);
  };

  const runQuantization = async () => {
    if (!publicAudioUrl) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsQuantizing(true);
    setResult(null);

    try {
      toast.info(`Calling Modal A10G GPU with ${bitDepth}-bit quantization...`);

      const { data, error } = await supabase.functions.invoke('modal-quantize', {
        body: {
          audio_url: publicAudioUrl,
          target_bits: bitDepth,
        },
      });

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast.success(`Quantization complete: SNR=${data.snr_db?.toFixed(2)}dB`);
      } else {
        toast.warning('Quantization completed with warnings');
      }
    } catch (error) {
      console.error('Modal quantization failed:', error);
      toast.error(`Quantization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResult({ success: false });
    } finally {
      setIsQuantizing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const getQualityBadge = (snr: number) => {
    if (snr >= 40) return { label: 'Excellent', variant: 'default' as const, color: 'text-green-500' };
    if (snr >= 30) return { label: 'Good', variant: 'secondary' as const, color: 'text-blue-500' };
    if (snr >= 20) return { label: 'Fair', variant: 'outline' as const, color: 'text-yellow-500' };
    return { label: 'Poor', variant: 'destructive' as const, color: 'text-red-500' };
  };

  const getFADStatus = (fad: number, bits: number) => {
    const threshold = bits === 4 ? 0.25 : bits === 8 ? 0.15 : 0.05;
    const passed = fad < threshold;
    return { passed, threshold: threshold * 100 };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Cpu className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">SVDQuant-Audio</h1>
            <p className="text-muted-foreground">
              Phase-coherent quantization via Modal A10G GPU
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Audio Input
            </CardTitle>
            <CardDescription>
              Upload audio for GPU-accelerated quantization. File will be uploaded to cloud storage for Modal access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload">
                <Button variant="outline" asChild disabled={isUploading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Choose Audio File'}
                  </span>
                </Button>
              </label>
              
              {audioFile && (
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{audioFile.name}</span>
                  {publicAudioUrl && (
                    <Badge variant="secondary">Cloud Ready</Badge>
                  )}
                </div>
              )}
            </div>

            {audioUrl && (
              <div className="flex items-center gap-3">
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                <Button variant="ghost" size="icon" onClick={togglePlayback}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground">Preview original audio</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quantization Settings
            </CardTitle>
            <CardDescription>
              Configure bit depth for SVDQuant compression. Lower bits = smaller size but more quality loss.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Target Bit Depth</span>
                <Badge variant={bitDepth <= 4 ? 'destructive' : bitDepth <= 8 ? 'secondary' : 'default'}>
                  {bitDepth}-bit
                </Badge>
              </div>
              <Slider
                value={[bitDepth]}
                onValueChange={(v) => setBitDepth(v[0])}
                min={4}
                max={16}
                step={4}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>4-bit (Aggressive)</span>
                <span>8-bit (Balanced)</span>
                <span>16-bit (Conservative)</span>
              </div>
            </div>

            {bitDepth === 4 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  4-bit quantization is experimental. Uses Mid/Side processing and TPDF dithering for quality preservation.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={runQuantization} 
              disabled={!publicAudioUrl || isQuantizing}
              className="w-full"
              size="lg"
            >
              {isQuantizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Processing on Modal GPU...
                </>
              ) : (
                <>
                  <Cpu className="mr-2 h-4 w-4" />
                  Run SVDQuant on A10G GPU
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                Quantization Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.snr_db !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Signal-to-Noise Ratio</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono ${getQualityBadge(result.snr_db).color}`}>
                        {result.snr_db.toFixed(2)} dB
                      </span>
                      <Badge variant={getQualityBadge(result.snr_db).variant}>
                        {getQualityBadge(result.snr_db).label}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(100, result.snr_db * 2)} />
                </div>
              )}

              {result.fad !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fréchet Audio Distance</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{(result.fad * 100).toFixed(2)}%</span>
                      {getFADStatus(result.fad, bitDepth).passed ? (
                        <Badge variant="default">Passed</Badge>
                      ) : (
                        <Badge variant="destructive">Failed (&lt;{getFADStatus(result.fad, bitDepth).threshold}%)</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {result.phase_coherence !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">Phase Coherence</span>
                    <p className="font-mono">{(result.phase_coherence * 100).toFixed(1)}%</p>
                  </div>
                )}
                {result.transient_preservation !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">Transient Preservation</span>
                    <p className="font-mono">{(result.transient_preservation * 100).toFixed(1)}%</p>
                  </div>
                )}
                {result.stereo_imaging !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">Stereo Imaging</span>
                    <p className="font-mono">{(result.stereo_imaging * 100).toFixed(1)}%</p>
                  </div>
                )}
                {result.compression_ratio !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">Compression Ratio</span>
                    <p className="font-mono">{result.compression_ratio.toFixed(2)}x</p>
                  </div>
                )}
                {result.rank_used !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">SVD Rank Used</span>
                    <p className="font-mono">{result.rank_used}</p>
                  </div>
                )}
              </div>

              {result.quantized_url && (
                <div className="pt-4 border-t">
                  <Button variant="outline" asChild>
                    <a href={result.quantized_url} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download Quantized Audio
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>SVDQuant-Audio</strong> uses Singular Value Decomposition for phase-coherent audio quantization.</p>
              <p>Quality targets: 4-bit &lt;25% FAD, 8-bit &lt;15% FAD, 16-bit &lt;5% FAD</p>
              <p>Processing runs on Modal A10G GPU with PyTorch for accelerated inference.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
