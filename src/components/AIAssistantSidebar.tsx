import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, Mic, MicOff, Volume2, VolumeX, Send, Lightbulb, Music, 
  Piano, Drum, Wand2, BookOpen, Users, Sparkles, X, Brain, 
  MessageCircle, Headphones, Play, Square
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { DawProjectData, DawTrackV2 } from '@/types/daw';

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: DawProjectData | null;
  onGenerateTrack: (prompt: string, trackType: 'midi' | 'audio') => void;
  onAddEffectToTrack: (effectName: string) => void;
  selectedTrackId: string | null;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface VoiceSession {
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}

// AI Assistant specialized for Amapiano production
const AMAPIANO_SUGGESTIONS = [
  "Generate a classic amapiano log drum pattern in F#m at 118 BPM",
  "Create soulful piano chords for private school amapiano",
  "Add saxophone melody in the style of Kelvin Momo",
  "Generate percussion patterns for Kabza De Small style",
  "Suggest mixing tips for amapiano deep bass",
  "Create a chord progression for emotional amapiano",
  "Generate shaker patterns with traditional African rhythms",
  "Add gospel-influenced piano harmonies"
];

const PRODUCTION_TIPS = [
  {
    category: "Log Drums",
    tip: "Layer multiple log drum samples at different pitches for fullness",
    icon: Drum
  },
  {
    category: "Piano Chords",
    tip: "Use gospel-style chord inversions with 7th and 9th extensions",
    icon: Piano
  },
  {
    category: "Mixing",
    tip: "High-pass filter everything except kick and bass around 80-100Hz",
    icon: Volume2
  },
  {
    category: "Arrangement",
    tip: "Build energy gradually - classic amapiano has a slow burn approach",
    icon: Music
  }
];

export const AIAssistantSidebar: React.FC<AIAssistantSidebarProps> = ({
  isOpen,
  onClose,
  projectData,
  onGenerateTrack,
  onAddEffectToTrack,
  selectedTrackId
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your amapiano production assistant. I can help you create authentic tracks, suggest chord progressions, analyze your music, and provide cultural context about amapiano. What would you like to work on?",
      timestamp: new Date(),
      suggestions: AMAPIANO_SUGGESTIONS.slice(0, 4)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSession, setVoiceSession] = useState<VoiceSession>({
    isActive: false,
    isListening: false,
    isSpeaking: false
  });
  const [selectedTip, setSelectedTip] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const sendTextMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Create context about current project
      const context = {
        projectData,
        selectedTrackId,
        availableTracks: projectData?.tracks.map(t => ({ id: t.id, name: t.name, type: t.type })) || [],
        bpm: projectData?.bpm || 118,
        keySignature: projectData?.keySignature || 'F#m'
      };

      const { data, error } = await supabase.functions.invoke('neural-music-generation', {
        body: {
          type: 'assistant_chat',
          message: text,
          context,
          mode: 'amapiano_production'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || "I'd be happy to help with your amapiano production!",
        timestamp: new Date(),
        suggestions: data.suggestions || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle any actions suggested by the AI
      if (data.action) {
        handleAIAction(data.action);
      }

    } catch (error) {
      console.error('AI Assistant Error:', error);
      toast.error("Sorry, I'm having trouble right now. Please try again.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting right now. Let me suggest some common amapiano production techniques instead!",
        timestamp: new Date(),
        suggestions: AMAPIANO_SUGGESTIONS.slice(0, 3)
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAction = (action: any) => {
    switch (action.type) {
      case 'generate_track':
        onGenerateTrack(action.prompt, action.trackType || 'midi');
        break;
      case 'add_effect':
        onAddEffectToTrack(action.effectName);
        break;
      case 'suggestion':
        toast.info(action.message);
        break;
    }
  };

  const startVoiceSession = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setVoiceSession(prev => ({ ...prev, isActive: true, isListening: true }));
      toast.info("🎤 Voice session started - speak naturally about your music production needs!");
      
      // TODO: Implement WebSocket connection to OpenAI Realtime API
      // This would connect to a Supabase Edge Function that handles the OpenAI Realtime API
      
    } catch (error) {
      console.error('Voice session error:', error);
      toast.error("Couldn't access microphone. Please check permissions.");
    }
  };

  const stopVoiceSession = () => {
    setVoiceSession({ isActive: false, isListening: false, isSpeaking: false });
    toast.info("Voice session ended");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  const analyzeCurrent = () => {
    if (!projectData || !projectData.tracks.length) {
      toast.error("No project data to analyze");
      return;
    }

    const analysisPrompt = `Analyze my current amapiano project: ${projectData.tracks.length} tracks, ${projectData.bpm} BPM, key of ${projectData.keySignature}. Tracks: ${projectData.tracks.map(t => `${t.name} (${t.type})`).join(', ')}. Provide specific feedback and suggestions.`;
    sendTextMessage(analysisPrompt);
  };

  const getCurrentTrackInfo = () => {
    if (!selectedTrackId || !projectData) return null;
    return projectData.tracks.find(t => t.id === selectedTrackId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-background border-l border-border z-50 flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5 text-primary" />
            AI Assistant
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Amapiano Expert
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="chat" className="text-xs">
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs">
              <Headphones className="w-3 h-3 mr-1" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-2 mx-4">
            {/* Current Project Context */}
            {projectData && (
              <Card className="mb-3 bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Current Project</span>
                    <Button size="sm" variant="outline" onClick={analyzeCurrent} className="h-6 text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      Analyze
                    </Button>
                  </div>
                  <div className="text-sm">
                    <div>{projectData.tracks.length} tracks • {projectData.bpm} BPM • {projectData.keySignature}</div>
                    {getCurrentTrackInfo() && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Selected: {getCurrentTrackInfo()?.name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-8' 
                        : 'bg-muted mr-8'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      
                      {/* AI Suggestions */}
                      {message.type === 'assistant' && message.suggestions && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-muted-foreground">Try these:</div>
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full text-left justify-start h-auto p-2 text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <Wand2 className="w-3 h-3 mr-2 flex-shrink-0" />
                              <span className="truncate">{suggestion}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 mr-8">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        Thinking about your amapiano project...
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about amapiano production, chord progressions, mixing..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage(inputText)}
                  className="flex-1"
                />
                <Button onClick={() => sendTextMessage(inputText)} disabled={!inputText.trim() || isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="flex-1 flex flex-col mt-2 mx-4">
            <Card className="flex-1">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
                <div className="mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                    voiceSession.isActive 
                      ? voiceSession.isSpeaking 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-blue-500/20 text-blue-500'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {voiceSession.isActive ? (
                      voiceSession.isSpeaking ? (
                        <Volume2 className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )
                    ) : (
                      <MicOff className="w-8 h-8" />
                    )}
                  </div>
                  
                  <h3 className="font-medium mb-2">Voice Production Assistant</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {voiceSession.isActive 
                      ? voiceSession.isSpeaking 
                        ? "I'm speaking..." 
                        : "Listening for your voice..."
                      : "Talk naturally about your amapiano production needs"
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  {!voiceSession.isActive ? (
                    <Button onClick={startVoiceSession} className="w-full">
                      <Mic className="w-4 h-4 mr-2" />
                      Start Voice Session
                    </Button>
                  ) : (
                    <Button onClick={stopVoiceSession} variant="destructive" className="w-full">
                      <Square className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Say things like: "Create a log drum pattern" or "How do I mix amapiano vocals?"
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="flex-1 mt-2 mx-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Production Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      {PRODUCTION_TIPS.map((tip, index) => {
                        const Icon = tip.icon;
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedTip === index ? 'bg-primary/10 border-primary' : 'bg-muted/50 hover:bg-muted'
                            }`}
                            onClick={() => setSelectedTip(index)}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="font-medium text-sm">{tip.category}</div>
                                <div className="text-xs text-muted-foreground mt-1">{tip.tip}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Cultural Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm space-y-2">
                      <p><strong>Classic Amapiano:</strong> Originated in Johannesburg townships, emphasizes log drums and gospel piano.</p>
                      <p><strong>Private School:</strong> More sophisticated, jazz-influenced with live instrumentation.</p>
                      <p><strong>Key Artists:</strong> Kabza De Small, Kelvin Momo, MFR Souls, DJ Maphorisa.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};