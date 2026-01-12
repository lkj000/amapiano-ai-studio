import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  MessageSquare, 
  Copy, 
  Send, 
  Mic, 
  MicOff, 
  Headphones,
  Play,
  Pause,
  Settings,
  Link2,
  Music,
  Wand2,
  Clock,
  CheckCircle2,
  Circle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isHost: boolean;
  isMuted: boolean;
  currentTool?: string;
  cursorPosition?: { x: number; y: number };
  lastSeen: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'action' | 'system';
}

interface RoomState {
  roomCode: string;
  roomName: string;
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  key: string;
}

const PARTICIPANT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export function CollaborationRoom() {
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  
  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: '',
    roomName: 'Untitled Session',
    isPlaying: false,
    currentTime: 0,
    bpm: 115,
    key: 'A minor'
  });

  // Generate room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create a new room
  const createRoom = async () => {
    const code = generateRoomCode();
    const user: Participant = {
      id: crypto.randomUUID(),
      name: userName || 'Host',
      color: PARTICIPANT_COLORS[0],
      isHost: true,
      isMuted: true,
      currentTool: 'cursor',
      lastSeen: new Date()
    };
    
    setCurrentUser(user);
    setParticipants([user]);
    setRoomState(prev => ({ ...prev, roomCode: code }));
    setRoomCode(code);
    setIsConnected(true);
    
    // Add system message
    setMessages([{
      id: crypto.randomUUID(),
      senderId: 'system',
      senderName: 'System',
      content: `Room created! Share code: ${code}`,
      timestamp: new Date(),
      type: 'system'
    }]);
    
    toast.success('Room created!', {
      description: `Room code: ${code}`
    });
  };

  // Join existing room
  const joinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) {
      toast.error('Invalid room code');
      return;
    }
    
    setIsJoining(true);
    
    // Simulate joining delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const colorIndex = Math.floor(Math.random() * PARTICIPANT_COLORS.length);
    const user: Participant = {
      id: crypto.randomUUID(),
      name: userName || `Guest ${Math.floor(Math.random() * 1000)}`,
      color: PARTICIPANT_COLORS[colorIndex],
      isHost: false,
      isMuted: true,
      currentTool: 'cursor',
      lastSeen: new Date()
    };
    
    // Simulate existing host
    const host: Participant = {
      id: 'host-1',
      name: 'Session Host',
      color: PARTICIPANT_COLORS[0],
      isHost: true,
      isMuted: false,
      currentTool: 'piano-roll',
      lastSeen: new Date()
    };
    
    setCurrentUser(user);
    setParticipants([host, user]);
    setRoomState(prev => ({ ...prev, roomCode }));
    setIsConnected(true);
    setIsJoining(false);
    
    // Add system message
    setMessages([{
      id: crypto.randomUUID(),
      senderId: 'system',
      senderName: 'System',
      content: `${user.name} joined the session`,
      timestamp: new Date(),
      type: 'system'
    }]);
    
    toast.success('Joined room!');
  };

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;
    
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Copy room code
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    toast.success('Room code copied!');
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, isMuted: !isMuted } : null);
      setParticipants(prev => 
        prev.map(p => p.id === currentUser.id ? { ...p, isMuted: !isMuted } : p)
      );
    }
  };

  // Leave room
  const leaveRoom = () => {
    setIsConnected(false);
    setParticipants([]);
    setMessages([]);
    setCurrentUser(null);
    setRoomCode('');
    toast.info('Left the session');
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Collaboration Room</CardTitle>
              <CardDescription>
                Real-time co-production with other producers
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Your Name</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your producer name"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Create Room */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                    <Music className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Start New Session</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a room and invite collaborators
                    </p>
                  </div>
                  <Button onClick={createRoom} className="w-full">
                    Create Room
                  </Button>
                </CardContent>
              </Card>

              {/* Join Room */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="p-4 rounded-full bg-muted w-fit mx-auto">
                    <Link2 className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">Join Session</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter a 6-digit room code
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className="text-center text-lg font-mono tracking-widest"
                    />
                    <Button 
                      onClick={joinRoom} 
                      variant="outline" 
                      className="w-full"
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Room'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Circle className="w-4 h-4 text-green-500 fill-green-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{roomState.roomName}</CardTitle>
                <Badge variant="outline" className="gap-1 font-mono">
                  {roomState.roomCode}
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={copyRoomCode}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {participants.length} participant{participants.length !== 1 ? 's' : ''} • {roomState.bpm} BPM • {roomState.key}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isMuted ? 'outline' : 'default'}
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMuted ? 'Unmute' : 'Mute'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button variant="destructive" size="sm" onClick={leaveRoom}>
              Leave
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants" className="gap-2">
              <Users className="w-4 h-4" />
              Participants
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="session" className="gap-2">
              <Wand2 className="w-4 h-4" />
              Session
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="mt-4">
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {participants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2" style={{ borderColor: participant.color }}>
                          <AvatarFallback style={{ backgroundColor: participant.color + '20' }}>
                            {participant.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background"
                          style={{ backgroundColor: participant.isMuted ? '#ef4444' : '#22c55e' }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{participant.name}</span>
                          {participant.isHost && (
                            <Badge variant="secondary" className="text-xs">Host</Badge>
                          )}
                          {participant.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {participant.currentTool && (
                            <>
                              <Wand2 className="w-3 h-3" />
                              {participant.currentTool}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {participant.isMuted ? (
                        <MicOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Mic className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyRoomCode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Link
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <div className="space-y-4">
              <ScrollArea className="h-[200px] p-3 rounded-lg bg-muted/30">
                <div className="space-y-3">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`text-sm ${message.type === 'system' ? 'text-center text-muted-foreground italic' : ''}`}
                    >
                      {message.type === 'text' && (
                        <div className={message.senderId === currentUser?.id ? 'text-right' : ''}>
                          <span className="font-medium" style={{ 
                            color: participants.find(p => p.id === message.senderId)?.color 
                          }}>
                            {message.senderName}
                          </span>
                          <p className={`mt-1 p-2 rounded-lg inline-block max-w-[80%] ${
                            message.senderId === currentUser?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-background'
                          }`}>
                            {message.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                      {message.type === 'system' && (
                        <p className="text-xs">{message.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="session" className="mt-4">
            <div className="space-y-4">
              {/* Transport Controls */}
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={roomState.isPlaying ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setRoomState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
                      >
                        {roomState.isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </Button>
                      <div className="text-2xl font-mono">
                        {formatTime(roomState.currentTime)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{roomState.bpm}</div>
                        <div className="text-xs text-muted-foreground">BPM</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-medium">{roomState.key}</div>
                        <div className="text-xs text-muted-foreground">Key</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-xl font-bold">12:34</div>
                  <div className="text-xs text-muted-foreground">Session Duration</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 text-center">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <div className="text-xl font-bold">Synced</div>
                  <div className="text-xs text-muted-foreground">Playback Status</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
