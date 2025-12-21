import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { SA_LANGUAGES } from '@/constants/languages';

interface LyricsGeneratorProps {
  onLyricsGenerated?: (lyrics: string) => void;
  compact?: boolean;
}

interface GeneratedLyrics {
  versionA: { title: string; lyrics: string };
  versionB: { title: string; lyrics: string };
}

const LyricsGenerator: React.FC<LyricsGeneratorProps> = ({ onLyricsGenerated, compact = false }) => {
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [mood, setMood] = useState('uplifting');
  const [language, setLanguage] = useState('zulu');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<GeneratedLyrics | null>(null);
  const [copiedVersion, setCopiedVersion] = useState<'A' | 'B' | null>(null);

  const genres = ['Pop', 'R&B', 'Hip Hop', 'Amapiano', 'Afrobeats', 'Rock', 'Country', 'Jazz', 'Gospel', 'Electronic'];
  const moods = ['uplifting', 'melancholic', 'romantic', 'energetic', 'chill', 'nostalgic', 'empowering', 'dreamy'];

  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error('Please enter a theme or story idea');
      return;
    }

    setIsGenerating(true);
    setGeneratedLyrics(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: { theme, genre, mood, language },
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedLyrics({
          versionA: data.versionA,
          versionB: data.versionB,
        });
        toast.success('Lyrics generated!');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Lyrics generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate lyrics');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLyrics = async (version: 'A' | 'B') => {
    const lyrics = version === 'A' ? generatedLyrics?.versionA.lyrics : generatedLyrics?.versionB.lyrics;
    if (lyrics) {
      await navigator.clipboard.writeText(lyrics);
      setCopiedVersion(version);
      toast.success('Lyrics copied to clipboard!');
      setTimeout(() => setCopiedVersion(null), 2000);
    }
  };

  const useLyrics = (version: 'A' | 'B') => {
    const lyrics = version === 'A' ? generatedLyrics?.versionA.lyrics : generatedLyrics?.versionB.lyrics;
    if (lyrics && onLyricsGenerated) {
      onLyricsGenerated(lyrics);
      toast.success('Lyrics added!');
    }
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Lyrics Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Describe your song's theme or story..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="min-h-[80px]"
            maxLength={200}
          />
          <div className="flex gap-2">
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SA_LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={isGenerating || !theme.trim()}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
          {generatedLyrics && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => useLyrics('A')} className="flex-1">
                  Use Version A
                </Button>
                <Button size="sm" variant="outline" onClick={() => useLyrics('B')} className="flex-1">
                  Use Version B
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Lyrical Assistant
        </CardTitle>
        <CardDescription>
          Let AI help craft your perfect lyrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Your Theme or Story Idea</Label>
          <Textarea
            placeholder="Share your song's theme or story idea... (e.g., 'A love story about reconnecting after years apart')"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="min-h-[100px]"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">{theme.length}/200</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moods.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SA_LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>
                    <div className="flex flex-col">
                      <span>{l.label}</span>
                      <span className="text-xs text-muted-foreground">{l.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !theme.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Lyrics...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>

        {generatedLyrics && (
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Version A</CardTitle>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copyLyrics('A')}>
                      {copiedVersion === 'A' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    {onLyricsGenerated && (
                      <Button size="sm" variant="outline" onClick={() => useLyrics('A')}>
                        Use
                      </Button>
                    )}
                  </div>
                </div>
                {generatedLyrics.versionA.title && (
                  <p className="text-sm text-muted-foreground">{generatedLyrics.versionA.title}</p>
                )}
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto">
                  {generatedLyrics.versionA.lyrics || 'Lyrics will appear here'}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Version B</CardTitle>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => copyLyrics('B')}>
                      {copiedVersion === 'B' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    {onLyricsGenerated && (
                      <Button size="sm" variant="outline" onClick={() => useLyrics('B')}>
                        Use
                      </Button>
                    )}
                  </div>
                </div>
                {generatedLyrics.versionB.title && (
                  <p className="text-sm text-muted-foreground">{generatedLyrics.versionB.title}</p>
                )}
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto">
                  {generatedLyrics.versionB.lyrics || 'Lyrics will appear here'}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LyricsGenerator;
