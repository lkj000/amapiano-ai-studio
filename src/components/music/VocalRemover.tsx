import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mic, MicOff, Loader2, Download, Upload, Music2 } from 'lucide-react';

interface VocalRemoverProps {
  compact?: boolean;
}

const VocalRemover: React.FC<VocalRemoverProps> = ({ compact = false }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    vocalUrl: string | null;
    instrumentalUrl: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/flac', 'audio/ogg'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|flac|ogg)$/i)) {
      toast.error('Please upload a valid audio file (MP3, WAV, M4A, FLAC, OGG)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setAudioFile(file);
    setResult(null);
    toast.success(`Selected: ${file.name}`);
  };

  const handleProcess = async () => {
    if (!audioFile && !audioUrl) {
      toast.error('Please upload an audio file or provide a URL');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      let processUrl = audioUrl;

      // If file is selected, upload to storage first
      if (audioFile) {
        const fileName = `vocal-remover/${Date.now()}-${audioFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('temp-audio')
          .upload(fileName, audioFile);

        if (uploadError) {
          throw new Error('Failed to upload audio file');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('temp-audio')
          .getPublicUrl(fileName);

        processUrl = publicUrl;
      }

      const { data, error } = await supabase.functions.invoke('vocal-remover', {
        body: { audioUrl: processUrl },
      });

      if (error) throw error;

      if (data.success) {
        setResult({
          vocalUrl: data.vocalUrl,
          instrumentalUrl: data.instrumentalUrl,
        });
        toast.success('Vocals and instrumentals separated successfully!');
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Vocal removal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MicOff className="h-5 w-5" />
            Vocal Remover
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="mr-2 h-4 w-4" />
            {audioFile ? audioFile.name : 'Upload Audio'}
          </Button>
          <Button
            onClick={handleProcess}
            disabled={isProcessing || (!audioFile && !audioUrl)}
            className="w-full"
            size="sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Remove Vocals
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MicOff className="h-6 w-6" />
          AI Vocal Remover
        </CardTitle>
        <CardDescription>
          Remove vocals from any song to get clean instrumentals, or extract vocals only
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {audioFile ? audioFile.name : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground">
            MP3, WAV, M4A, FLAC, OGG up to 50MB
          </p>
        </div>

        <Button
          onClick={handleProcess}
          disabled={isProcessing || (!audioFile && !audioUrl)}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing... (1-2 minutes)
            </>
          ) : (
            <>
              <MicOff className="mr-2 h-5 w-5" />
              Remove Vocals
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Results</h3>
            
            {result.vocalUrl && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Vocals Only
                </Label>
                <audio controls className="w-full" src={result.vocalUrl} />
                <Button variant="outline" size="sm" asChild>
                  <a href={result.vocalUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download Vocals
                  </a>
                </Button>
              </div>
            )}

            {result.instrumentalUrl && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Music2 className="h-4 w-4" /> Instrumental Only
                </Label>
                <audio controls className="w-full" src={result.instrumentalUrl} />
                <Button variant="outline" size="sm" asChild>
                  <a href={result.instrumentalUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download Instrumental
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VocalRemover;
