import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Wand2, Loader2, Download, Play, Volume2 } from 'lucide-react';

interface SoundEffectGeneratorProps {
  compact?: boolean;
}

const SoundEffectGenerator: React.FC<SoundEffectGeneratorProps> = ({ compact = false }) => {
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState([5]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const examplePrompts = [
    'Thunder rumbling in the distance with rain',
    'Magical spell casting with sparkles',
    'Footsteps on gravel path',
    'Sci-fi laser gun firing',
    'Ocean waves on a beach',
    'A crowded cafeteria with utensils clinking',
    'Car engine revving',
    'Door creaking open slowly',
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe the sound effect you want');
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('sound-effect-generator', {
        body: {
          description: description.trim(),
          duration: duration[0],
        },
      });

      if (error) throw error;

      if (data.success && data.audioContent) {
        // Convert base64 to blob URL
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: data.contentType || 'audio/mpeg' }
        );
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        toast.success('Sound effect generated!');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Sound effect generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate sound effect');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `sound-effect-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Effects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe the sound effect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
            maxLength={199}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="w-full"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Sound
              </>
            )}
          </Button>
          {audioUrl && (
            <audio controls className="w-full h-10" src={audioUrl} />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-6 w-6" />
          AI Sound Effect Generator
        </CardTitle>
        <CardDescription>
          Generate custom sound effects from text descriptions using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe the sound effect you want to generate..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={199}
          />
          <p className="text-xs text-muted-foreground text-right">
            {description.length}/199
          </p>
        </div>

        <div className="space-y-2">
          <Label>Duration: {duration[0]} seconds</Label>
          <Slider
            value={duration}
            onValueChange={setDuration}
            min={1}
            max={22}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Shorter durations generate faster
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick prompts:</Label>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.slice(0, 4).map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setDescription(prompt)}
              >
                {prompt.slice(0, 25)}...
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Sound Effect...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate Sound
            </>
          )}
        </Button>

        {audioUrl && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Generated Sound Effect</h3>
            <audio ref={audioRef} controls className="w-full" src={audioUrl} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => audioRef.current?.play()}>
                <Play className="mr-2 h-4 w-4" /> Play
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SoundEffectGenerator;
