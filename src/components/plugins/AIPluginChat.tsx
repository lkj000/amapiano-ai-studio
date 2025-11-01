/**
 * Phase 1: AI-First Plugin Creation Interface
 * Natural language conversation for plugin design
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Code, Wand2, Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIPluginChatProps {
  onPluginGenerated?: (plugin: {
    name: string;
    code: string;
    parameters: any[];
    framework: 'juce' | 'webaudio';
  }) => void;
}

const EXAMPLE_PROMPTS = [
  {
    category: 'Dynamics',
    prompts: [
      'Create a pumping compressor for Amapiano music with sidechain-style ducking',
      'Build a multiband compressor with 3 bands for mastering',
      'Make a vintage-style optical compressor with slow attack and release',
    ]
  },
  {
    category: 'EQ',
    prompts: [
      'Design a 4-band parametric EQ with adjustable Q values',
      'Create a low-end focused EQ for bass music production',
      'Build a surgical EQ for removing unwanted resonances',
    ]
  },
  {
    category: 'Time Effects',
    prompts: [
      'Make a ping-pong delay with tempo sync and filtering',
      'Create a shimmer reverb with pitch shifting in the feedback loop',
      'Build a tape-style delay with wow and flutter modulation',
    ]
  },
  {
    category: 'Creative',
    prompts: [
      'Design a granular synthesis effect for texture creation',
      'Create a vocoder with 16 bands and formant preservation',
      'Build a ring modulator with frequency tracking',
    ]
  }
];

export function AIPluginChat({ onPluginGenerated }: AIPluginChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI plugin development assistant. I can help you create audio effects and instruments using natural language. What would you like to build today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      abortControllerRef.current = new AbortController();

      const { data, error } = await supabase.functions.invoke('ai-plugin-chat', {
        body: {
          messages: messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }))
            .concat([{ role: 'user', content: userMessage.content }])
        }
      });

      if (error) throw error;

      // Handle streaming response
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date()
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              // Partial JSON, continue
            }
          }
        }
      }

      // Parse if plugin code was generated
      extractPluginFromResponse(assistantMessage);

    } catch (error: any) {
      console.error('AI chat error:', error);
      toast.error('Failed to get AI response: ' + error.message);
      setMessages(prev => prev.slice(0, -1)); // Remove empty assistant message
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const extractPluginFromResponse = (content: string) => {
    // Look for code blocks and parameter definitions
    const codeMatch = content.match(/```(?:cpp|javascript|typescript)?\n([\s\S]*?)\n```/);
    const paramMatch = content.match(/parameters?:\s*\n([\s\S]*?)(?:\n\n|$)/i);

    if (codeMatch && onPluginGenerated) {
      // Extract plugin information
      const code = codeMatch[1];
      const framework = code.includes('juce::') ? 'juce' : 'webaudio';
      
      onPluginGenerated({
        name: 'AI Generated Plugin',
        code,
        parameters: [], // Would parse from paramMatch
        framework
      });
    }
  };

  const useExamplePrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Example Prompts */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Example Prompts</h3>
        </div>
        <ScrollArea className="h-32">
          <div className="space-y-3">
            {EXAMPLE_PROMPTS.map((category) => (
              <div key={category.category}>
                <Badge variant="outline" className="mb-2">
                  {category.category}
                </Badge>
                <div className="space-y-1 ml-2">
                  {category.prompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => useExamplePrompt(prompt)}
                      className="block w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded px-2 py-1 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the plugin you want to create..."
              className="min-h-[60px] resize-none"
              disabled={isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Code className="w-3 h-3" />
            <span>AI will generate DSP code, parameters, and optimization suggestions</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
