import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Zap, Bot, Headphones, Mic, MicOff, Volume2, VolumeX, 
  Radio, Wifi, WifiOff, Activity, Brain, Wand2, Music2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeAIAssistantProps {
  projectData: any;
  onLiveAction: (action: any) => void;
  className?: string;
}

interface LiveSession {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  latency: number;
  messagesPerSecond: number;
}

interface LiveSuggestion {
  id: string;
  type: 'chord_change' | 'next_note' | 'rhythm_sync' | 'effect_add' | 'arrangement';
  confidence: number;
  suggestion: string;
  action: any;
  timestamp: Date;
}

export const RealtimeAIAssistant: React.FC<RealtimeAIAssistantProps> = ({
  projectData,
  onLiveAction,
  className
}) => {
  const [session, setSession] = useState<LiveSession>({
    isConnected: false,
    isListening: false,
    isProcessing: false,
    latency: 0,
    messagesPerSecond: 0
  });

  const [liveSuggestions, setLiveSuggestions] = useState<LiveSuggestion[]>([]);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [autoApply, setAutoApply] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [customPrompt, setCustomPrompt] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const latencyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageCountRef = useRef(0);
  const reconnectAttemptsRef = useRef(0);

  // Initialize realtime connection
  useEffect(() => {
    if (session.isConnected) {
      connectToRealtimeAI();
    } else {
      disconnect();
    }

    return () => disconnect();
  }, [session.isConnected]);

  // Message rate tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setSession(prev => ({
        ...prev,
        messagesPerSecond: messageCountRef.current
      }));
      messageCountRef.current = 0;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const connectToRealtimeAI = async () => {
    try {
      console.log('Attempting to connect to Realtime AI Assistant...');
      
      const wsUrl = `wss://mywijmtszelyutssormy.supabase.co/functions/v1/realtime-ai-assistant`;
      console.log('WebSocket URL:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ Realtime AI Assistant connected successfully');
        setSession(prev => ({ ...prev, isConnected: true }));
        reconnectAttemptsRef.current = 0;
        
        // Send initial context
        const initMessage = {
          type: 'init',
          projectData,
          preferences: {
            sensitivity,
            voiceGuidance,
            autoApply,
            customPrompt
          }
        };
        
        console.log('Sending init message:', initMessage);
        wsRef.current?.send(JSON.stringify(initMessage));

        toast.success("🔥 Realtime AI Assistant connected!");
        startLatencyMonitoring();
      };

      wsRef.current.onmessage = (event) => {
        try {
          messageCountRef.current++;
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          handleRealtimeMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ Realtime AI connection closed:', event.code, event.reason);
        setSession(prev => ({ ...prev, isConnected: false }));
        
        if (event.code !== 1000) { // Not a normal closure
          toast.error(`Connection lost: ${event.reason || 'Unknown error'}`);
          attemptReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Realtime AI WebSocket error:', error);
        toast.error("Connection error - attempting to reconnect...");
        setSession(prev => ({ ...prev, isConnected: false }));
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSession(prev => ({ ...prev, isConnected: false }));
    }
  };

  const handleRealtimeMessage = (message: any) => {
    switch (message.type) {
      case 'suggestion':
        const suggestion: LiveSuggestion = {
          id: `suggestion_${Date.now()}`,
          type: message.suggestionType,
          confidence: message.confidence,
          suggestion: message.text,
          action: message.action,
          timestamp: new Date()
        };

        setLiveSuggestions(prev => [suggestion, ...prev.slice(0, 9)]);

        // Auto-apply high confidence suggestions
        if (autoApply && message.confidence > 0.8) {
          applySuggestion(suggestion);
        }

        // Voice guidance
        if (voiceGuidance && message.confidence > 0.6) {
          speakSuggestion(message.text);
        }
        break;

      case 'latency_ping':
        const latency = Date.now() - message.timestamp;
        setSession(prev => ({ ...prev, latency }));
        break;

      case 'processing_status':
        setSession(prev => ({ ...prev, isProcessing: message.isProcessing }));
        break;
    }
  };

  const applySuggestion = (suggestion: LiveSuggestion) => {
    onLiveAction(suggestion.action);
    toast.info(`🎵 Applied: ${suggestion.suggestion}`);
  };

  const speakSuggestion = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: `Suggestion: ${text}`,
          voice: 'Aria',
          model: 'eleven_turbo_v2_5'
        }
      });

      if (!error && data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.volume = 0.6;
        audio.play();
      }
    } catch (error) {
      console.error('Voice guidance error:', error);
    }
  };

  const startLatencyMonitoring = () => {
    latencyTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'latency_ping',
          timestamp: Date.now()
        }));
      }
    }, 2000);
  };

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current < 5) {
      reconnectAttemptsRef.current++;
      const delay = Math.min(Math.pow(2, reconnectAttemptsRef.current) * 1000, 10000);
      
      console.log(`🔄 Attempting reconnect ${reconnectAttemptsRef.current}/5 in ${delay}ms...`);
      toast.info(`Reconnecting... (${reconnectAttemptsRef.current}/5)`);
      
      setTimeout(() => {
        if (!session.isConnected) {
          connectToRealtimeAI();
        }
      }, delay);
    } else {
      console.log('❌ Max reconnection attempts reached');
      toast.error("Failed to reconnect. Please try again manually.");
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (latencyTimerRef.current) {
      clearInterval(latencyTimerRef.current);
    }

    setSession(prev => ({ ...prev, isConnected: false }));
    setLiveSuggestions([]);
  };

  const toggleConnection = () => {
    console.log('🔄 Toggling connection, current state:', session.isConnected);
    
    if (session.isConnected) {
      disconnect();
    } else {
      // Reset reconnect attempts when manually connecting
      reconnectAttemptsRef.current = 0;
      setSession(prev => ({ ...prev, isConnected: true }));
    }
  };

  const sendLiveContext = (context: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'context_update',
        context
      }));
    }
  };

  // Send context updates when project data changes
  useEffect(() => {
    if (session.isConnected && projectData) {
      sendLiveContext(projectData);
    }
  }, [projectData, session.isConnected]);

  const getLatencyColor = () => {
    if (session.latency < 100) return 'text-green-500';
    if (session.latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'chord_change': return Music2;
      case 'next_note': return Wand2;
      case 'rhythm_sync': return Activity;
      case 'effect_add': return Volume2;
      case 'arrangement': return Brain;
      default: return Bot;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Realtime AI Assistant
          <Badge variant="outline" className={`ml-auto ${session.isConnected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {session.isConnected ? (
              <><Wifi className="w-3 h-3 mr-1" /> LIVE</>
            ) : (
              <><WifiOff className="w-3 h-3 mr-1" /> OFFLINE</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleConnection}
              variant={session.isConnected ? "destructive" : "default"}
              size="sm"
            >
              {session.isConnected ? (
                <><Radio className="w-4 h-4 mr-2" /> Disconnect</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> Start Live AI</>
              )}
            </Button>
            
            {session.isConnected && (
              <div className="flex items-center gap-4 text-sm">
                <span className={`flex items-center gap-1 ${getLatencyColor()}`}>
                  <Activity className="w-3 h-3" />
                  {session.latency}ms
                </span>
                <span className="text-muted-foreground">
                  {session.messagesPerSecond} msg/s
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoiceGuidance(!voiceGuidance)}
            >
              {voiceGuidance ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoApply(!autoApply)}
            >
              Auto: {autoApply ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Live Suggestions */}
        {session.isConnected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Live Suggestions</h3>
              <Badge variant="secondary" className="text-xs">
                {liveSuggestions.length} active
              </Badge>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {liveSuggestions.map((suggestion) => {
                const IconComponent = getSuggestionIcon(suggestion.type);
                return (
                  <div
                    key={suggestion.id}
                    className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border"
                  >
                    <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{suggestion.suggestion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={suggestion.confidence * 100} className="flex-1 h-1" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      Apply
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Sensitivity & Custom Prompt */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">AI Sensitivity</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8">
                {Math.round(sensitivity * 10)}/10
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Custom AI Prompt</label>
            <Input
              placeholder="e.g., 'Focus on log drum patterns' or 'Suggest jazz chord extensions'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {!session.isConnected && (
          <div className="text-center p-6 text-muted-foreground">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Connect to start receiving real-time AI assistance</p>
            <p className="text-xs mt-1">Get instant chord suggestions, rhythm sync, and production tips</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};