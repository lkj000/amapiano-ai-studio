import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  Users, Mic, MicOff, Volume2, VolumeX, Settings, 
  Crown, Circle, Mouse, MessageSquare, Phone,
  PhoneOff, Radio, Share2, Lock, Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import type { DawProjectDataV2 } from '@/types/daw';

interface RealTimeCollaborationPanelProps {
  projectId: string;
  projectData: DawProjectDataV2;
  onProjectUpdate: (data: DawProjectDataV2) => void;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'text' | 'system';
}

export default function RealTimeCollaborationPanel({
  projectId,
  projectData,
  onProjectUpdate,
  onClose
}: RealTimeCollaborationPanelProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);
  
  const chatRef = useRef<HTMLDivElement>(null);
  
  const {
    participants,
    userPresence,
    isConnected,
    isHost,
    sessionId,
    initializeSession,
    broadcastOperation,
    updatePresence,
    initializeAudioStreaming,
    audioStream,
    peerConnections
  } = useRealtimeCollaboration(projectId, projectData);

  // Initialize collaboration on component mount
  useEffect(() => {
    const sessionId = `session_${projectId}_${Date.now()}`;
    initializeSession(sessionId, true); // Assume host for demo
  }, [projectId, initializeSession]);

  // Handle audio streaming
  useEffect(() => {
    if (isAudioEnabled && !audioStream) {
      initializeAudioStreaming();
    }
  }, [isAudioEnabled, audioStream, initializeAudioStreaming]);

  // Listen for collaboration operations
  useEffect(() => {
    const handleOperation = (event: CustomEvent) => {
      const operation = event.detail;
      
      // Apply operation to project data
      const updatedData = applyOperationToProject(projectData, operation);
      if (updatedData) {
        onProjectUpdate(updatedData);
        
        // Add system message
        addSystemMessage(`${operation.userId} ${getOperationDescription(operation)}`);
      }
    };

    window.addEventListener('collaboration-operation', handleOperation as EventListener);
    return () => window.removeEventListener('collaboration-operation', handleOperation as EventListener);
  }, [projectData, onProjectUpdate]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const applyOperationToProject = (data: DawProjectDataV2, operation: any): DawProjectDataV2 | null => {
    try {
      const newData = { ...data };
      
      switch (operation.type) {
        case 'track-add':
          newData.tracks = [...newData.tracks, operation.data as any];
          break;
        case 'track-remove':
          newData.tracks = newData.tracks.filter(track => track.id !== operation.trackId);
          break;
        case 'track-update':
          newData.tracks = newData.tracks.map(track => 
            track.id === operation.trackId ? { ...track, ...operation.data } : track
          );
          break;
        case 'clip-add':
          newData.tracks = newData.tracks.map(track => 
            track.id === operation.trackId 
              ? { 
                  ...track, 
                  clips: track.type === 'midi' 
                    ? [...(track as any).clips, operation.data] 
                    : [...(track as any).clips, operation.data]
                }
              : track
          );
          break;
        case 'clip-remove':
          newData.tracks = newData.tracks.map(track => 
            track.id === operation.trackId
              ? { 
                  ...track, 
                  clips: track.type === 'midi' 
                    ? (track as any).clips.filter((clip: any) => clip.id !== operation.clipId)
                    : (track as any).clips.filter((clip: any) => clip.id !== operation.clipId)
                }
              : track
          );
          break;
        case 'clip-update':
          newData.tracks = newData.tracks.map(track => 
            track.id === operation.trackId
              ? {
                  ...track,
                  clips: track.type === 'midi'
                    ? (track as any).clips.map((clip: any) => 
                        clip.id === operation.clipId ? { ...clip, ...operation.data } : clip
                      )
                    : (track as any).clips.map((clip: any) => 
                        clip.id === operation.clipId ? { ...clip, ...operation.data } : clip
                      )
                }
              : track
          );
          break;
        default:
          return null;
      }
      
      return newData;
    } catch (error) {
      console.error('Failed to apply operation:', error);
      return null;
    }
  };

  const getOperationDescription = (operation: any): string => {
    switch (operation.type) {
      case 'track-add': return 'added a new track';
      case 'track-remove': return 'removed a track';
      case 'track-update': return 'updated a track';
      case 'clip-add': return 'added a clip';
      case 'clip-remove': return 'removed a clip';
      case 'clip-update': return 'updated a clip';
      default: return 'made a change';
    }
  };

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      userId: 'system',
      userName: 'System',
      message,
      timestamp: Date.now(),
      type: 'system'
    };
    setChatMessages(prev => [...prev, systemMessage]);
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      message: newMessage.trim(),
      timestamp: Date.now(),
      type: 'text'
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Broadcast message to other users
    broadcastOperation({
      type: 'chat-message' as any,
      data: message
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updatePresence({
      cursor: { x: e.clientX, y: e.clientY }
    });
  };

  const toggleAudioStreaming = async () => {
    if (isAudioEnabled) {
      setIsAudioEnabled(false);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    } else {
      try {
        await initializeAudioStreaming();
        setIsAudioEnabled(true);
        toast.success('Audio streaming enabled');
      } catch (error) {
        toast.error('Failed to enable audio streaming');
      }
    }
  };

  const toggleMicrophone = () => {
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        track.enabled = isMicMuted;
      });
      setIsMicMuted(!isMicMuted);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserColor = (userId: string) => {
    const participant = participants.get(userId);
    return participant?.userColor || '#3b82f6';
  };

  return (
    <div className="flex flex-col h-full" onMouseMove={handleMouseMove}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Live Collaboration
            {isConnected && <Circle className="h-2 w-2 text-green-500 fill-current" />}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Connection Status */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          {isHost && <Badge variant="outline" className="text-amber-600"><Crown className="h-3 w-3 mr-1" />Host</Badge>}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAudioStreaming}
              className={isAudioEnabled ? 'text-green-600' : ''}
            >
              {isAudioEnabled ? <Phone className="h-4 w-4" /> : <PhoneOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMicrophone}
              disabled={!isAudioEnabled}
              className={isMicMuted ? 'text-red-500' : ''}
            >
              {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Participants */}
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants ({participants.size})
          </h3>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {Array.from(participants.values()).map(participant => {
                const presence = userPresence.get(participant.userId);
                return (
                  <div key={participant.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback 
                        className="text-xs" 
                        style={{ backgroundColor: participant.userColor }}
                      >
                        {participant.userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{participant.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {presence?.currentTool || 'Select'} • {formatTime(Date.parse(participant.lastSeen))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(participant.permissions as any)?.isHost && <Crown className="h-3 w-3 text-amber-500" />}
                      <Circle className="h-2 w-2 text-green-500 fill-current" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Audio Controls */}
        {isAudioEnabled && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Audio Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4" />
                <Slider
                  value={[audioVolume * 100]}
                  onValueChange={([value]) => setAudioVolume(value / 100)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4" />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Monitor other participants</span>
                <Switch checked={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Push to talk</span>
                <Switch checked={false} />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </h3>
          
          <ScrollArea className="flex-1 min-h-0" ref={chatRef}>
            <div className="space-y-2 p-1">
              {chatMessages.map(message => (
                <div key={message.id} className={`text-sm ${
                  message.type === 'system' 
                    ? 'text-muted-foreground italic text-center' 
                    : 'text-foreground'
                }`}>
                  {message.type === 'text' && (
                    <div className="flex gap-2">
                      <span 
                        className="font-medium"
                        style={{ color: getUserColor(message.userId) }}
                      >
                        {message.userName}:
                      </span>
                      <span>{message.message}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  )}
                  {message.type === 'system' && (
                    <div>{message.message}</div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2 mt-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendChatMessage} size="sm">Send</Button>
          </div>
        </div>
      </CardContent>

      {/* Real-time cursors overlay */}
      {Array.from(userPresence.values()).map(presence => (
        <div
          key={presence.userId}
          className="fixed pointer-events-none z-50"
          style={{
            left: presence.cursor.x,
            top: presence.cursor.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div 
            className="w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: presence.color }}
          />
          <div 
            className="text-xs text-white bg-black/70 px-1 py-0.5 rounded mt-1 whitespace-nowrap"
          >
            {presence.name}
          </div>
        </div>
      ))}
    </div>
  );
}