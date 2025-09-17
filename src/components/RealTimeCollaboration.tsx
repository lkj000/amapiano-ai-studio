import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Mic, MicOff, Video, VideoOff, Share, 
  MessageCircle, Crown, Settings, Volume2, VolumeX,
  Radio, Wifi, WifiOff, Activity, Clock, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CollaboratorPresence {
  user_id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  currentAction?: string;
  cursor?: { x: number; y: number };
  selectedTrack?: string;
  role: 'owner' | 'collaborator' | 'viewer';
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
  };
}

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'voice_note';
  audioUrl?: string;
}

interface RealTimeCollaborationProps {
  projectId: string;
  currentUser: any;
  projectData: any;
  onProjectUpdate: (update: any) => void;
  className?: string;
}

const RealTimeCollaboration: React.FC<RealTimeCollaborationProps> = ({
  projectId,
  currentUser,
  projectData,
  onProjectUpdate,
  className
}) => {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const channelRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cursorTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize real-time collaboration
  useEffect(() => {
    initializeCollaboration();
    
    return () => {
      cleanup();
    };
  }, [projectId]);

  // Track mouse movement for cursor sharing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorTimeout.current) {
        clearTimeout(cursorTimeout.current);
      }
      
      cursorTimeout.current = setTimeout(() => {
        if (channelRef.current && connectionStatus === 'connected') {
          channelRef.current.track({
            cursor: { x: e.clientX, y: e.clientY },
            lastActivity: Date.now()
          });
        }
      }, 100);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimeout.current) {
        clearTimeout(cursorTimeout.current);
      }
    };
  }, [connectionStatus]);

  const initializeCollaboration = async () => {
    if (!projectId || !currentUser) return;

    setConnectionStatus('connecting');
    
    try {
      const newSessionId = `project_${projectId}_${Date.now()}`;
      setSessionId(newSessionId);

      // Create a channel for this project
      const channel = supabase.channel(`collaboration_${projectId}`, {
        config: {
          presence: {
            key: currentUser.id,
          },
        },
      });

      channelRef.current = channel;

      // Listen for presence changes (users joining/leaving)
      channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          const presentUsers: CollaboratorPresence[] = [];
          
          Object.entries(newState).forEach(([userId, presences]: [string, any]) => {
            if (presences && presences.length > 0) {
              const presence = presences[0];
              presentUsers.push({
                user_id: userId,
                username: presence.username || 'Anonymous',
                avatar: presence.avatar,
                isOnline: true,
                lastSeen: new Date(presence.lastActivity || Date.now()),
                currentAction: presence.currentAction,
                cursor: presence.cursor,
                selectedTrack: presence.selectedTrack,
                role: userId === currentUser.id ? 'owner' : 'collaborator',
                permissions: {
                  canEdit: presence.permissions?.canEdit || false,
                  canComment: true,
                  canShare: presence.permissions?.canShare || false
                }
              });
            }
          });

          setCollaborators(presentUsers);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const newUser = newPresences[0];
          if (key !== currentUser.id) {
            addSystemMessage(`${newUser.username || 'Someone'} joined the session`);
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const leftUser = leftPresences[0];
          if (key !== currentUser.id) {
            addSystemMessage(`${leftUser.username || 'Someone'} left the session`);
          }
        })
        // Listen for broadcast messages (chat, project updates)
        .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
          setChatMessages(prev => [...prev, payload]);
        })
        .on('broadcast', { event: 'project_update' }, ({ payload }) => {
          onProjectUpdate(payload);
          addSystemMessage(`Project updated by ${payload.username}`);
        })
        .on('broadcast', { event: 'track_selection' }, ({ payload }) => {
          // Update collaborator's selected track
          setCollaborators(prev => 
            prev.map(collab => 
              collab.user_id === payload.user_id 
                ? { ...collab, selectedTrack: payload.trackId, currentAction: 'editing track' }
                : collab
            )
          );
        });

      // Subscribe to the channel
      const status = await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          
          // Track current user's presence
          await channel.track({
            username: currentUser.email?.split('@')[0] || 'Anonymous',
            avatar: currentUser.avatar_url,
            lastActivity: Date.now(),
            currentAction: 'viewing project',
            permissions: {
              canEdit: true,
              canComment: true,
              canShare: true
            }
          });

          toast.success('🤝 Collaboration session started');
        } else {
          setConnectionStatus('disconnected');
        }
      });

      // Generate shareable invite link
      const inviteUrl = `${window.location.origin}/collaborate/${projectId}?invite=${btoa(currentUser.id)}`;
      setInviteLink(inviteUrl);

    } catch (error) {
      console.error('Collaboration initialization error:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to start collaboration session');
    }
  };

  const cleanup = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      user_id: 'system',
      username: 'System',
      message,
      timestamp: new Date(),
      type: 'system'
    };
    setChatMessages(prev => [...prev, systemMessage]);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !channelRef.current) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      user_id: currentUser.id,
      username: currentUser.email?.split('@')[0] || 'Anonymous',
      message: chatInput,
      timestamp: new Date(),
      type: 'text'
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: message
    });

    setChatInput('');
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      toast.info('🎤 Recording voice message...');

    } catch (error) {
      console.error('Voice recording error:', error);
      toast.error('Failed to start voice recording');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      // Convert to base64 for transmission
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const voiceMessage: ChatMessage = {
        id: `voice_${Date.now()}`,
        user_id: currentUser.id,
        username: currentUser.email?.split('@')[0] || 'Anonymous',
        message: '🎤 Voice message',
        timestamp: new Date(),
        type: 'voice_note',
        audioUrl: `data:audio/webm;base64,${base64Audio}`
      };

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'chat_message',
          payload: voiceMessage
        });
      }

      toast.success('Voice message sent');

    } catch (error) {
      console.error('Voice message error:', error);
      toast.error('Failed to send voice message');
    }
  };

  const shareInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy invite link');
    }
  };

  const updateTrackSelection = (trackId: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'track_selection',
        payload: {
          user_id: currentUser.id,
          trackId,
          username: currentUser.email?.split('@')[0] || 'Anonymous'
        }
      });
    }
  };

  const playVoiceMessage = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return Wifi;
      case 'connecting': return Radio;
      default: return WifiOff;
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Real-Time Collaboration
          <Badge variant="outline" className={`ml-auto ${getConnectionColor()}`}>
            {React.createElement(getConnectionIcon(), { className: "w-3 h-3 mr-1" })}
            {collaborators.length} online
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="collaborators" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collaborators">Team</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                {React.createElement(getConnectionIcon(), { className: `w-4 h-4 ${getConnectionColor()}` })}
                <span className="font-medium capitalize">{connectionStatus}</span>
              </div>
              <Button
                onClick={() => setShowInviteModal(true)}
                size="sm"
                variant="outline"
              >
                <Share className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </div>

            {/* Active Collaborators */}
            <div className="space-y-3">
              <h3 className="font-medium">Active Collaborators ({collaborators.length})</h3>
              
              {collaborators.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No collaborators online</p>
                  <p className="text-xs">Share the project link to invite others</p>
                </div>
              ) : (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                      <div 
                        key={collaborator.user_id}
                        className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg"
                      >
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={collaborator.avatar} />
                            <AvatarFallback>
                              {collaborator.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {collaborator.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{collaborator.username}</p>
                            {collaborator.role === 'owner' && (
                              <Crown className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {collaborator.currentAction || 'Online'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {collaborator.selectedTrack && (
                            <Badge variant="outline" className="text-xs">
                              <Activity className="w-3 h-3 mr-1" />
                              Editing
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs capitalize">
                            {collaborator.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {/* Chat Messages */}
            <ScrollArea className="h-64 p-3 bg-muted/20 rounded-lg">
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex gap-2 ${message.user_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.user_id !== currentUser.id && message.type !== 'system' && (
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${
                        message.type === 'system' 
                          ? 'text-center w-full' 
                          : message.user_id === currentUser.id
                            ? 'bg-primary text-primary-foreground rounded-lg p-2'
                            : 'bg-muted rounded-lg p-2'
                      }`}>
                        {message.type === 'system' ? (
                          <p className="text-xs text-muted-foreground italic">{message.message}</p>
                        ) : (
                          <>
                            {message.user_id !== currentUser.id && (
                              <p className="text-xs font-medium mb-1">{message.username}</p>
                            )}
                            
                            {message.type === 'voice_note' ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => message.audioUrl && playVoiceMessage(message.audioUrl)}
                                  className="h-6 px-2"
                                >
                                  <Volume2 className="w-3 h-3 mr-1" />
                                  Play
                                </Button>
                                <span className="text-xs">{message.message}</span>
                              </div>
                            ) : (
                              <p className="text-sm">{message.message}</p>
                            )}
                            
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                disabled={connectionStatus !== 'connected'}
                className="flex-1"
              />
              
              <Button
                onMouseDown={startVoiceRecording}
                onMouseUp={stopVoiceRecording}
                onMouseLeave={stopVoiceRecording}
                variant="outline"
                size="sm"
                disabled={connectionStatus !== 'connected'}
                className={isRecordingVoice ? 'bg-red-500 text-white' : ''}
              >
                {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || connectionStatus !== 'connected'}
                size="sm"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Collaboration Settings */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Project Sharing</h3>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 font-mono text-xs"
                  />
                  <Button onClick={shareInviteLink} variant="outline">
                    <Share className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Session Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Session ID:</span>
                    <p className="font-mono text-xs truncate">{sessionId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="capitalize">{connectionStatus}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Collaborators:</span>
                    <p>{collaborators.length} active</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Messages:</span>
                    <p>{chatMessages.length} sent</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => connectionStatus === 'connected' ? cleanup() : initializeCollaboration()}
                  variant={connectionStatus === 'connected' ? 'destructive' : 'default'}
                  className="flex-1"
                >
                  {connectionStatus === 'connected' ? 'Disconnect' : 'Reconnect'}
                </Button>
                
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Cursors for Other Users */}
        {collaborators
          .filter(c => c.cursor && c.user_id !== currentUser.id)
          .map((collaborator) => (
            <div
              key={`cursor_${collaborator.user_id}`}
              className="fixed pointer-events-none z-50 transition-all duration-100"
              style={{
                left: collaborator.cursor?.x,
                top: collaborator.cursor?.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <Badge variant="outline" className="text-xs">
                  {collaborator.username}
                </Badge>
              </div>
            </div>
          ))
        }
      </CardContent>
    </Card>
  );
};

export { RealTimeCollaboration };
export default RealTimeCollaboration;