import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LyricsGeneratorProps {
  onLyricsGenerated?: (lyrics: string, language: string, theme: string) => void;
}

export default function LyricsGenerator({ onLyricsGenerated }: LyricsGeneratorProps) {
  const [theme, setTheme] = useState('');
  const [language, setLanguage] = useState('english');
  const [style, setStyle] = useState('amapiano');
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateLyrics = async () => {
    if (!theme.trim()) {
      toast({
        title: "Theme Required",
        description: "Please enter a theme or topic for your lyrics",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate ${language} lyrics for an ${style} song about: ${theme}. 
      
Requirements:
- Authentic ${language} expressions and cultural references
- ${style} song structure (intro, verses, chorus, bridge)
- Catchy and memorable hooks
- Appropriate for ${language === 'zulu' ? 'Zulu/South African' : language} audience
- Include phonetic guidance if not in English

Format as:
[Intro]
[Verse 1]
[Chorus]
[Verse 2]
[Chorus]
[Bridge]
[Chorus]
[Outro]`;

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [
            { role: 'system', content: 'You are a creative lyricist specializing in Amapiano and African music. Generate authentic, culturally-aware lyrics.' },
            { role: 'user', content: prompt }
          ]
        }
      });

      if (error) throw error;

      const lyrics = data.response || data.message || 'Unable to generate lyrics';
      setGeneratedLyrics(lyrics);
      
      if (onLyricsGenerated) {
        onLyricsGenerated(lyrics, language, theme);
      }

      toast({
        title: "Lyrics Generated! 🎵",
        description: `${language} lyrics created successfully`
      });
    } catch (error) {
      console.error('Error generating lyrics:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate lyrics",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Lyrics copied to clipboard"
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Lyrics Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="zulu">Zulu (isiZulu)</SelectItem>
              <SelectItem value="xhosa">Xhosa (isiXhosa)</SelectItem>
              <SelectItem value="sotho">Sotho (Sesotho)</SelectItem>
              <SelectItem value="tswana">Tswana (Setswana)</SelectItem>
              <SelectItem value="afrikaans">Afrikaans</SelectItem>
              <SelectItem value="multilingual">Multilingual Mix</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Music Style</label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amapiano">Amapiano</SelectItem>
              <SelectItem value="afrobeat">Afrobeat</SelectItem>
              <SelectItem value="gqom">Gqom</SelectItem>
              <SelectItem value="kwaito">Kwaito</SelectItem>
              <SelectItem value="afro-house">Afro House</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Theme / Topic</label>
          <Textarea
            placeholder="e.g., 'Love and romance', 'Celebration and joy', 'Heartbreak', 'Township life'..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={generateLyrics} 
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
              Generate Lyrics
            </>
          )}
        </Button>

        {generatedLyrics && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Generated Lyrics</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={generatedLyrics}
              onChange={(e) => setGeneratedLyrics(e.target.value)}
              rows={16}
              className="font-mono text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
