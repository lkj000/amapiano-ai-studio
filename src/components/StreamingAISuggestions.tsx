import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamingAISuggestionsProps {
  context?: {
    genre?: string;
    bpm?: number;
    key?: string;
    existing_elements?: string[];
  };
  onSuggestionReceived?: (suggestion: any) => void;
}

export const StreamingAISuggestions: React.FC<StreamingAISuggestionsProps> = ({
  context = {},
  onSuggestionReceived
}) => {
  const [prompt, setPrompt] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { toast } = useToast();

  const streamSuggestions = async () => {
    if (!prompt.trim()) return;

    setIsStreaming(true);
    setStreamingText('');
    setSuggestions([]);

    try {
      const response = await fetch(
        `https://mywijmtszelyutssormy.supabase.co/functions/v1/aura-ai-suggestions-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15d2lqbXRzemVseXV0c3Nvcm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzMzNTMsImV4cCI6MjA3MTgwOTM1M30.oRxFmdyPzA1zgk5K68j5huf3NWbuezEPISnHtngRM8o`
          },
          body: JSON.stringify({
            context: {
              ...context,
              user_intent: prompt
            },
            suggestion_type: 'full_analysis'
          })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ') || line.trim() === '') continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              setStreamingText(prev => prev + content);
            }
          } catch (e) {
            // Incomplete JSON, put it back
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      toast({
        title: "Suggestions Generated",
        description: "AI has analyzed your request and provided suggestions"
      });

    } catch (error) {
      console.error('Streaming error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to stream suggestions",
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Suggestions (Streaming)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe what you need help with... (e.g., 'How can I make the bass more prominent in the mix?')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isStreaming}
          />
          <Button 
            onClick={streamSuggestions} 
            disabled={!prompt.trim() || isStreaming}
            className="w-full"
          >
            {isStreaming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Streaming...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </div>

        {/* Context badges */}
        {Object.keys(context).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {context.genre && <Badge variant="secondary">Genre: {context.genre}</Badge>}
            {context.bpm && <Badge variant="secondary">BPM: {context.bpm}</Badge>}
            {context.key && <Badge variant="secondary">Key: {context.key}</Badge>}
          </div>
        )}

        {/* Streaming text display */}
        {(isStreaming || streamingText) && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="prose prose-sm max-w-none">
                {streamingText || 'Waiting for AI response...'}
                {isStreaming && <span className="animate-pulse">▊</span>}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
