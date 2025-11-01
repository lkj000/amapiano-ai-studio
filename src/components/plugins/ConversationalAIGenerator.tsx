import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationalAIGeneratorProps {
  onCodeGenerated: (code: string, parameters: any[]) => void;
}

export const ConversationalAIGenerator = ({
  onCodeGenerated,
}: ConversationalAIGeneratorProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI plugin assistant. Describe the audio plugin you want to create, and I'll help you build it step by step. What kind of plugin do you have in mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [context, setContext] = useState<any>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Call AI plugin generator with conversation context
      const { data, error } = await supabase.functions.invoke("ai-plugin-generator", {
        body: {
          prompt: input,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update context with new information
      if (data.context) {
        setContext((prev: any) => ({ ...prev, ...data.context }));
      }

      // If plugin code is ready, generate it
      if (data.readyToGenerate) {
        const { data: pluginData, error: pluginError } = await supabase.functions.invoke(
          "ai-plugin-generator",
          {
            body: {
              action: "generate",
              context,
              finalPrompt: input,
            },
          }
        );

        if (pluginError) throw pluginError;

        if (pluginData.code && pluginData.parameters) {
          onCodeGenerated(pluginData.code, pluginData.parameters);
          
          const successMessage: Message = {
            role: "assistant",
            content: `✨ Plugin generated successfully! I've created:\n\n• **${context.pluginName || "Your Plugin"}**\n• ${pluginData.parameters.length} parameters\n• ${context.effectType || "Audio processing"}\n\nYou can now test it in the Test tab or further customize the code. Would you like me to help you optimize any parameters?`,
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, successMessage]);
          toast.success("Plugin code generated!");
        }
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      
      const errorMessage: Message = {
        role: "assistant",
        content: "I encountered an issue generating your plugin. Could you provide more details about what you'd like to create?",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const examplePrompts = [
    "Create a vintage tape delay effect",
    "Build an amapiano log drum synthesizer",
    "Make a multiband compressor with sidechain",
    "Design a reverb with shimmer effect",
  ];

  return (
    <Card className="p-6 h-[600px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Plugin Conversation</h3>
      </div>

      <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-2">Try these examples:</div>
          <div className="space-y-2">
            {examplePrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your plugin or ask questions..."
          className="resize-none"
          rows={3}
          disabled={isGenerating}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isGenerating}
          size="icon"
          className="h-auto"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Press Enter to send • Shift+Enter for new line
      </div>
    </Card>
  );
};
