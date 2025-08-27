import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Share2, Copy, Link2, UserPlus, Settings, Crown, 
  X, Circle, Wifi, WifiOff, Mouse, Edit3, Plus, Trash2, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CollaborationSession, 
  CollaborationParticipant, 
  ProjectChange,
  DawProjectDataV2 
} from '@/types/daw';

interface CollaborationPanelProps {
  projectId: string;
  projectName: string;
  projectData: DawProjectDataV2;
  onClose: () => void;
  onProjectUpdate: (data: DawProjectDataV2) => void;
}

const userColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export default function CollaborationPanel({ 
  projectId, 
  projectName, 
  projectData,
  onClose, 
  onProjectUpdate 
}: CollaborationPanelProps) {
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<CollaborationSession | null>(null);
  const [sessionName, setSessionName] = useState(`${projectName} - Collaboration`);
  const [shareUrl, setShareUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  // Fetch current collaboration session
  const { data: sessions = [] } = useQuery({
    queryKey: ['collaboration-sessions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true);
        
      if (error) throw error;
      return data?.map(session => ({
        id: session.id,
        projectId: session.project_id,
        hostUserId: session.host_user_id,
        sessionName: session.session_name,
        isActive: session.is_active,
        participantLimit: session.participant_limit,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      })) || [];
    }
  });

  // Fetch participants for active session
  const { data: participants = [] } = useQuery({
    queryKey: ['collaboration-participants', activeSession?.id],
    queryFn: async () => {
      if (!activeSession) return [];
      
      const { data, error } = await supabase
        .from('collaboration_participants')
        .select('*')
        .eq('session_id', activeSession.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });
        
      if (error) throw error;
      return data?.map(participant => ({
        id: participant.id,
        sessionId: participant.session_id,
        userId: participant.user_id,
        userName: participant.user_name,
        userColor: participant.user_color,
        isActive: participant.is_active,
        cursorPosition: participant.cursor_position as any,
        currentTool: participant.current_tool,
        permissions: participant.permissions as any,
        joinedAt: participant.joined_at,
        lastSeen: participant.last_seen
      })) || [];
    },
    enabled: !!activeSession
  });

  // Fetch recent project changes
  const { data: recentChanges = [] } = useQuery({
    queryKey: ['project-changes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_changes')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      return data?.map(change => ({
        id: change.id,
        projectId: change.project_id,
        userId: change.user_id,
        changeType: change.change_type as any,
        changeData: change.change_data,
        timestamp: change.timestamp
      })) || [];
    }
  });

  // Create collaboration session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          project_id: projectId,
          session_name: sessionName,
          is_active: true
        })
        .select()
        .single();
        
      if (error) throw error;
      return {
        id: data.id,
        projectId: data.project_id,
        hostUserId: data.host_user_id,
        sessionName: data.session_name,
        isActive: data.is_active,
        participantLimit: data.participant_limit,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    },
    onSuccess: (session) => {
      setActiveSession(session);
      const url = `${window.location.origin}${window.location.pathname}?collaborate=${session.id}`;
      setShareUrl(url);
      queryClient.invalidateQueries({ queryKey: ['collaboration-sessions'] });
      toast.success('Collaboration session created!');
      initializeRealtime(session.id);
    },
    onError: (error) => {
      console.error('Failed to create session:', error);
      toast.error('Failed to create collaboration session');
    }
  });

  // Join collaboration session
  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // Generate random color for user
      const userColor = userColors[Math.floor(Math.random() * userColors.length)];
      
      const { data, error } = await supabase
        .from('collaboration_participants')
        .insert({
          session_id: sessionId,
          user_name: 'Anonymous User', // In a real app, get from auth
          user_color: userColor,
          is_active: true
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration-participants'] });
      toast.success('Joined collaboration session!');
    }
  });

  // End collaboration session
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) return;
      
      const { error } = await supabase
        .from('collaboration_sessions')
        .update({ is_active: false })
        .eq('id', activeSession.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveSession(null);
      setShareUrl('');
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        setRealtimeChannel(null);
      }
      setIsConnected(false);
      queryClient.invalidateQueries({ queryKey: ['collaboration-sessions'] });
      toast.success('Collaboration session ended');
    }
  });

  // Initialize realtime connection
  const initializeRealtime = useCallback((sessionId: string) => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel(`collaboration_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_changes',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time project change:', payload);
          queryClient.invalidateQueries({ queryKey: ['project-changes'] });
          
          // Apply change to project data
          if (payload.new) {
            handleRemoteChange(payload.new as ProjectChange);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Participant change:', payload);
          queryClient.invalidateQueries({ queryKey: ['collaboration-participants'] });
        }
      )
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe((status) => {
        console.log('Collaboration channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setRealtimeChannel(channel);
  }, [projectId, queryClient, realtimeChannel]);

  // Handle remote changes from other collaborators
  const handleRemoteChange = useCallback((change: ProjectChange) => {
    try {
      const changeData = change.changeData;
      
      switch (change.changeType) {
        case 'track_add':
          onProjectUpdate({
            ...projectData,
            tracks: [...projectData.tracks, changeData.track]
          });
          break;
          
        case 'track_update':
          onProjectUpdate({
            ...projectData,
            tracks: projectData.tracks.map(track =>
              track.id === changeData.trackId 
                ? { ...track, ...changeData.updates }
                : track
            )
          });
          break;
          
        case 'clip_add':
          onProjectUpdate({
            ...projectData,
            tracks: projectData.tracks.map(track =>
              track.id === changeData.trackId
                ? { ...track, clips: [...track.clips, changeData.clip] }
                : track
            )
          });
          break;
          
        default:
          console.log('Unhandled change type:', change.changeType);
      }
    } catch (error) {
      console.error('Error applying remote change:', error);
    }
  }, [projectData, onProjectUpdate]);

  // Broadcast project change to other collaborators
  const broadcastChange = useCallback(async (changeType: string, changeData: any) => {
    if (!activeSession) return;
    
    try {
      await supabase
        .from('project_changes')
        .insert({
          project_id: projectId,
          change_type: changeType,
          change_data: changeData
        });
    } catch (error) {
      console.error('Failed to broadcast change:', error);
    }
  }, [activeSession, projectId]);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share URL copied to clipboard!');
  }, [shareUrl]);

  // Check for collaboration URL parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const collaborateId = urlParams.get('collaborate');
    
    if (collaborateId && !activeSession) {
      // Find and join the session
      const session = sessions.find(s => s.id === collaborateId);
      if (session) {
        setActiveSession(session);
        joinSessionMutation.mutate(collaborateId);
        initializeRealtime(collaborateId);
      }
    }
  }, [sessions, activeSession]);

  // Set active session from existing sessions
  useEffect(() => {
    if (sessions.length > 0 && !activeSession) {
      const session = sessions[0];
      setActiveSession(session);
      const url = `${window.location.origin}${window.location.pathname}?collaborate=${session.id}`;
      setShareUrl(url);
      initializeRealtime(session.id);
    }
  }, [sessions, activeSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'track_add': return Plus;
      case 'track_delete': return Trash2;
      case 'track_update': return Edit3;
      default: return Circle;
    }
  };

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Collaboration</CardTitle>
            <Badge variant="outline" className="bg-gradient-to-r from-green-500/20 to-blue-500/20">
              Version 2.0
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Disconnected</span>
                </>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="session" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="session" className="flex-1 m-4 mt-4 space-y-4">
            {!activeSession ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Start Collaboration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Session Name</label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Enter session name"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => createSessionMutation.mutate()}
                    disabled={createSessionMutation.isPending}
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Start Collaboration Session
                  </Button>
                  
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Starting a collaboration session allows multiple users to work on this project simultaneously in real-time.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Active Session</CardTitle>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium">{activeSession.sessionName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Started {new Date(activeSession.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Share URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={shareUrl}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyShareUrl}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Share this URL with others to invite them to collaborate
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => endSessionMutation.mutate()}
                        disabled={endSessionMutation.isPending}
                      >
                        End Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="flex-1 m-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No participants yet</p>
                    <p className="text-xs">Share the session URL to invite collaborators</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback 
                                style={{ backgroundColor: participant.userColor }}
                                className="text-white text-xs"
                              >
                                {participant.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{participant.userName}</span>
                                {participant.userId === activeSession?.hostUserId && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Circle 
                                  className={`w-2 h-2 fill-current ${
                                    participant.isActive ? 'text-green-500' : 'text-gray-400'
                                  }`} 
                                />
                                <span>
                                  {participant.isActive ? 'Active' : 'Away'} • 
                                  Joined {formatTime(participant.joinedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {participant.currentTool && (
                              <Badge variant="outline" className="text-xs">
                                <Mouse className="w-3 h-3 mr-1" />
                                {participant.currentTool}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 m-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentChanges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-xs">Project changes will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {recentChanges.map((change) => {
                        const Icon = getChangeIcon(change.changeType);
                        return (
                          <div
                            key={change.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/20"
                          >
                            <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {change.changeType.replace('_', ' ').toUpperCase()}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {formatTime(change.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}