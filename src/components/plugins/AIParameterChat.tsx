import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { DSPParameter } from '@/lib/dsp/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIParameterChatProps {
  currentParameters: Record<string, number | boolean | string>;
  onParametersUpdate: (parameters: Record<string, number | boolean | string>, explanation: string) => void;
  pluginType?: string;
}

export const AIParameterChat: React.FC<AIParameterChatProps> = ({
  currentParameters,
  onParametersUpdate,
  pluginType = 'amapianorizer'
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your audio engineering assistant. Tell me how you want to adjust the ${pluginType} - use natural language like "make it punchier", "add more space", or "classic Amapiano vibe".`
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Make it punchier",
    "Add more space",
    "Classic Amapiano vibe",
    "Heavier pump",
    "Darker sound",
    "Subtle effect",
    "More gating"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (prompt?: string) => {
    const userPrompt = prompt || input.trim();
    if (!userPrompt || isProcessing) return;

    const userMessage: Message = { role: 'user', content: userPrompt };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('plugin-parameter-translation', {
        body: {
          prompt: userPrompt,
          currentParameters,
          pluginType
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error('Rate limit reached. Please wait a moment.');
        } else if (error.message.includes('402')) {
          toast.error('AI credits exhausted. Please add credits to continue.');
        } else {
          throw error;
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }]);
        return;
      }

      // Update parameters
      onParametersUpdate(data.parameters, data.explanation);

      // Add assistant response
      const paramChanges = Object.entries(data.parameters)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `${data.explanation}\n\nUpdated parameters:\n${paramChanges}`
      }]);

      toast.success('Parameters updated! 🎛️');

    } catch (error) {
      console.error('AI parameter translation error:', error);
      toast.error('Failed to process request');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Parameter Assistant
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Describe how you want the sound - I'll adjust the parameters for you
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <MessageSquare className="h-3 w-3 inline mr-2" />
                  )}
                  <span className="whitespace-pre-line">{msg.content}</span>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin inline mr-2" />
                  Analyzing your request...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => handleSubmit(prompt)}
              disabled={isProcessing}
              className="text-xs h-7"
            >
              {prompt}
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Describe what you want..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isProcessing}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
