import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  MessageSquare, 
  Zap, 
  Settings, 
  Activity, 
  Target,
  Workflow,
  Sparkles,
  Send,
  Mic,
  MicOff,
  ChevronRight,
  ChevronLeft,
  Minimize2,
  Maximize2,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AuraSidebarProps {
  user: User | null;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action_type?: 'generation' | 'analysis' | 'orchestration' | 'suggestion';
  metadata?: any;
}

interface AIAgent {
  id: string;
  name: string;
  type: 'conductor' | 'backend' | 'frontend' | 'ai_ml' | 'devops' | 'cpp';
  status: 'idle' | 'working' | 'error';
  current_task?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AuraSidebar: React.FC<AuraSidebarProps> = ({ 
  user, 
  className,
  isMinimized = false,
  onToggleMinimize,
  onClose,
  showCloseButton = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeAgents, setActiveAgents] = useState<AIAgent[]>([]);
  const [orchestrationStatus, setOrchestrationStatus] = useState<'idle' | 'planning' | 'executing' | 'completed'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize AI agents
  useEffect(() => {
    setActiveAgents([
      {
        id: 'aura-conductor',
        name: 'AuraConductor',
        type: 'conductor',
        status: 'idle',
        icon: Brain
      },
      {
        id: 'backend-agent',
        name: 'BackendAgent',
        type: 'backend',
        status: 'idle',
        icon: Workflow
      },
      {
        id: 'ai-agent',
        name: 'AI/ML Agent',
        type: 'ai_ml',
        status: 'idle',
        icon: Sparkles
      }
    ]);

    // Add welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Welcome to the AURA-X AI Orchestration System! I\'m your AI conductor, ready to help you create, analyze, and orchestrate your music production workflow. How can I assist you today?',
        timestamp: new Date().toISOString(),
        action_type: 'suggestion'
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setOrchestrationStatus('planning');

    try {
      // Update agent statuses to show they're working
      setActiveAgents(prev => prev.map(agent => ({
        ...agent,
        status: 'working' as const,
        current_task: agent.id === 'aura-conductor' ? 'Analyzing request' : 'Standby'
      })));

      // Call the AI orchestration function
      const { data, error } = await supabase.functions.invoke('realtime-ai-assistant', {
        body: {
          message: content,
          user_id: user.id,
          context: {
            messages: messages.slice(-5), // Last 5 messages for context
            current_project: 'daw_session',
            user_preferences: {
              genre: 'amapiano',
              experience_level: 'intermediate'
            }
          }
        }
      });

      if (error) throw error;

      setOrchestrationStatus('executing');

      // Simulate orchestration process
      await new Promise(resolve => setTimeout(resolve, 1500));

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.response || 'I\'ve processed your request and coordinated with the AI agents to provide the best solution.',
        timestamp: new Date().toISOString(),
        action_type: data.action_type || 'suggestion',
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      setOrchestrationStatus('completed');

      // Reset agent statuses
      setActiveAgents(prev => prev.map(agent => ({
        ...agent,
        status: 'idle' as const,
        current_task: undefined
      })));

      // Show success toast
      if (data.action_type === 'generation') {
        toast({
          title: "AI Generation Complete",
          description: "Your request has been processed successfully",
        });
      }

    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'I apologize, but I encountered an issue processing your request. Please try again or rephrase your message.',
        timestamp: new Date().toISOString(),
        action_type: 'suggestion'
      };

      setMessages(prev => [...prev, errorMessage]);
      setOrchestrationStatus('idle');

      // Reset agent statuses to error
      setActiveAgents(prev => prev.map(agent => ({
        ...agent,
        status: 'error' as const,
        current_task: 'Error occurred'
      })));

      toast({
        title: "AI Assistant Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setOrchestrationStatus('idle'), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const toggleVoiceRecording = () => {
    setIsListening(!isListening);
    // Voice recording implementation would go here
    toast({
      title: isListening ? "Voice Recording Stopped" : "Voice Recording Started",
      description: isListening ? "Processing voice input..." : "Speak your request",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-primary';
      case 'error': return 'text-destructive';
      case 'idle': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getOrchestrationStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'text-yellow-500';
      case 'executing': return 'text-primary';
      case 'completed': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  if (isMinimized) {
    return (
      <div className={cn("fixed right-4 bottom-4 z-50", className)}>
        <Button
          onClick={onToggleMinimize}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg btn-glow"
        >
          <Brain className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      "w-96 h-[600px] flex flex-col shadow-xl border-primary/20",
      className
    )}>
      <CardHeader className="flex-shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AURA Assistant
            <Badge 
              variant="secondary" 
              className={cn("text-xs", getOrchestrationStatusColor(orchestrationStatus))}
            >
              {orchestrationStatus}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
            )}
            {showCloseButton && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Agents Status */}
        <div className="space-y-1">
          {activeAgents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div key={agent.id} className="flex items-center gap-2 text-xs">
                <Icon className={cn("w-3 h-3", getStatusColor(agent.status))} />
                <span className="font-medium">{agent.name}</span>
                <Badge variant="outline" className="text-xs">
                  {agent.status}
                </Badge>
                {agent.current_task && (
                  <span className="text-muted-foreground truncate">
                    {agent.current_task}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <Separator />

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 text-sm",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-4'
                      : 'bg-muted mr-4'
                  )}
                >
                  {message.action_type && message.role === 'assistant' && (
                    <Badge variant="secondary" className="text-xs mb-2">
                      {message.action_type}
                    </Badge>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 mr-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">
                      AI agents are orchestrating your request...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Input Area */}
      <div className="p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask the AI orchestrator..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleVoiceRecording}
              className={cn(
                "flex-shrink-0",
                isListening && "bg-primary text-primary-foreground"
              )}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="flex gap-1 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendMessage("Generate a new amapiano track")}
            disabled={isLoading}
          >
            <Zap className="w-3 h-3 mr-1" />
            Generate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendMessage("Analyze my current project")}
            disabled={isLoading}
          >
            <Activity className="w-3 h-3 mr-1" />
            Analyze
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendMessage("Show me collaboration options")}
            disabled={isLoading}
          >
            <Target className="w-3 h-3 mr-1" />
            Collaborate
          </Button>
        </div>
      </div>
    </Card>
  );
};