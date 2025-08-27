import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DawProjectDataV2, CollaborationParticipant } from '@/types/daw';

interface CollaborationState {
  participants: Map<string, CollaborationParticipant>;
  isHost: boolean;
  sessionId: string | null;
  isConnected: boolean;
  conflictResolution: 'host-wins' | 'timestamp' | 'merge';
}

interface CollaborationOperation {
  id: string;
  type: 'track-add' | 'track-remove' | 'track-update' | 'clip-add' | 'clip-remove' | 'clip-update' | 'automation-update';
  trackId?: string;
  clipId?: string;
  data: any;
  timestamp: number;
  userId: string;
  sessionId: string;
}

interface UserPresence {
  userId: string;
  cursor: { x: number; y: number; trackId?: string; timePosition?: number };
  selectedTracks: string[];
  activeClips: string[];
  currentTool: 'select' | 'draw' | 'erase' | 'split' | 'automation';
  color: string;
  name: string;
  lastSeen: number;
}

export function useRealtimeCollaboration(projectId: string, projectData: DawProjectDataV2) {
  const [state, setState] = useState<CollaborationState>({
    participants: new Map(),
    isHost: false,
    sessionId: null,
    isConnected: false,
    conflictResolution: 'timestamp'
  });

  const [userPresence, setUserPresence] = useState<Map<string, UserPresence>>(new Map());
  const [pendingOperations, setPendingOperations] = useState<CollaborationOperation[]>([]);
  const [appliedOperations, setAppliedOperations] = useState<Set<string>>(new Set());
  
  const channelRef = useRef<any>(null);
  const operationQueueRef = useRef<CollaborationOperation[]>([]);
  const lastOperationTime = useRef<number>(Date.now());

  // WebRTC for audio streaming
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());

  // Initialize collaboration session
  const initializeSession = useCallback(async (sessionId: string, isHost: boolean = false) => {
    try {
      const channel = supabase.channel(`collaboration:${sessionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'user_presence' }
        }
      });

      // Listen for real-time operations
      channel
        .on('broadcast', { event: 'operation' }, ({ payload }) => {
          handleRemoteOperation(payload as CollaborationOperation);
        })
        .on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
          updateUserPresence(payload.userId, { cursor: payload.cursor });
        })
        .on('broadcast', { event: 'audio_stream' }, ({ payload }) => {
          handleRemoteAudioStream(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          updateParticipantsFromPresence(presenceState);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          newPresences.forEach((presence: any) => {
            addParticipant(presence);
            if (isHost && audioStream) {
              initiatePeerConnection(presence.user_id);
            }
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.forEach((presence: any) => {
            removeParticipant(presence.user_id);
            cleanupPeerConnection(presence.user_id);
          });
        });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await channel.track({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            project_id: projectId,
            is_host: isHost,
            joined_at: new Date().toISOString(),
            cursor: { x: 0, y: 0 },
            current_tool: 'select',
            selected_tracks: [],
            active_clips: []
          });

          setState(prev => ({
            ...prev,
            sessionId,
            isHost,
            isConnected: true
          }));
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('Failed to initialize collaboration session:', error);
    }
  }, [projectId, audioStream]);

  // Handle remote operations with conflict resolution
  const handleRemoteOperation = useCallback((operation: CollaborationOperation) => {
    if (appliedOperations.has(operation.id)) return;

    // Apply timestamp-based conflict resolution
    const conflictingOps = pendingOperations.filter(op => 
      op.trackId === operation.trackId && 
      op.clipId === operation.clipId &&
      Math.abs(op.timestamp - operation.timestamp) < 1000 // Within 1 second
    );

    if (conflictingOps.length > 0) {
      resolveConflicts([...conflictingOps, operation]);
    } else {
      applyOperation(operation);
    }

    setAppliedOperations(prev => new Set(prev).add(operation.id));
  }, [appliedOperations, pendingOperations]);

  // Resolve conflicts between operations
  const resolveConflicts = useCallback((operations: CollaborationOperation[]) => {
    operations.sort((a, b) => {
      if (state.conflictResolution === 'timestamp') {
        return a.timestamp - b.timestamp;
      } else if (state.conflictResolution === 'host-wins') {
        const aIsHost = (state.participants.get(a.userId)?.permissions as any)?.isHost || false;
        const bIsHost = (state.participants.get(b.userId)?.permissions as any)?.isHost || false;
        if (aIsHost && !bIsHost) return -1;
        if (!aIsHost && bIsHost) return 1;
        return a.timestamp - b.timestamp;
      }
      return a.timestamp - b.timestamp;
    });

    // Apply operations in resolved order
    operations.forEach(op => {
      if (!appliedOperations.has(op.id)) {
        applyOperation(op);
      }
    });
  }, [state.conflictResolution, state.participants, appliedOperations]);

  // Apply operation to project data
  const applyOperation = useCallback((operation: CollaborationOperation) => {
    // This would be implemented to actually modify the project data
    console.log('Applying operation:', operation);
    
    // Emit custom event for the DAW to handle
    window.dispatchEvent(new CustomEvent('collaboration-operation', { 
      detail: operation 
    }));
  }, []);

  // Broadcast operation to other users
  const broadcastOperation = useCallback((operation: Omit<CollaborationOperation, 'id' | 'timestamp' | 'userId' | 'sessionId'>) => {
    if (!channelRef.current || !state.sessionId) return;

    const fullOperation: CollaborationOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userId: 'current-user', // This would be the actual user ID
      sessionId: state.sessionId
    };

    // Add to pending operations
    setPendingOperations(prev => [...prev, fullOperation]);
    
    // Broadcast to other users
    channelRef.current.send({
      type: 'broadcast',
      event: 'operation',
      payload: fullOperation
    });

    // Apply locally
    applyOperation(fullOperation);
    setAppliedOperations(prev => new Set(prev).add(fullOperation.id));
  }, [state.sessionId, applyOperation]);

  // Update user presence (cursor, selection, etc.)
  const updatePresence = useCallback((updates: Partial<UserPresence>) => {
    if (!channelRef.current) return;

    const presence = {
      cursor: updates.cursor,
      selected_tracks: updates.selectedTracks,
      active_clips: updates.activeClips,
      current_tool: updates.currentTool,
      last_seen: Date.now()
    };

    channelRef.current.track(presence);
    
    // Also broadcast cursor movements
    if (updates.cursor) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: 'current-user',
          cursor: updates.cursor
        }
      });
    }
  }, []);

  // Initialize audio streaming for real-time collaboration
  const initializeAudioStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      setAudioStream(stream);
      
      // Create audio analyzer for level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      return stream;
    } catch (error) {
      console.error('Failed to initialize audio streaming:', error);
      return null;
    }
  }, []);

  // WebRTC peer connection management
  const initiatePeerConnection = useCallback(async (userId: string) => {
    if (!audioStream) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // Add audio stream to peer connection
    audioStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, audioStream);
    });

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const remoteAudio = new Audio();
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.play();
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice_candidate',
          payload: {
            candidate: event.candidate,
            targetUserId: userId
          }
        });
      }
    };

    setPeerConnections(prev => new Map(prev).set(userId, peerConnection));

    // Create offer if we're the host
    if (state.isHost) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc_offer',
          payload: {
            offer,
            targetUserId: userId
          }
        });
      }
    }
  }, [audioStream, state.isHost]);

  // Helper functions
  const updateUserPresence = useCallback((userId: string, updates: Partial<UserPresence>) => {
    setUserPresence(prev => {
      const updated = new Map(prev);
      const current = updated.get(userId) || {
        userId,
        cursor: { x: 0, y: 0 },
        selectedTracks: [],
        activeClips: [],
        currentTool: 'select' as const,
        color: '#3b82f6',
        name: 'User',
        lastSeen: Date.now()
      };
      
      updated.set(userId, { ...current, ...updates, lastSeen: Date.now() });
      return updated;
    });
  }, []);

  const updateParticipantsFromPresence = useCallback((presenceState: any) => {
    const participants = new Map<string, CollaborationParticipant>();
    
    Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
      presences.forEach((presence: any) => {
        participants.set(presence.user_id, {
          id: presence.user_id,
          sessionId: state.sessionId || '',
          userId: presence.user_id,
          userName: 'Collaborator',
          userColor: '#3b82f6',
          isActive: true,
          cursorPosition: presence.cursor,
          currentTool: presence.current_tool,
          permissions: { canEdit: true, canAddTracks: true, canDeleteTracks: false, isHost: presence.is_host } as any,
          joinedAt: presence.joined_at,
          lastSeen: new Date().toISOString()
        });
      });
    });
    
    setState(prev => ({ ...prev, participants }));
  }, [state.sessionId]);

  const addParticipant = useCallback((presence: any) => {
    // Implementation for adding participant
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    setState(prev => {
      const participants = new Map(prev.participants);
      participants.delete(userId);
      return { ...prev, participants };
    });
    
    setUserPresence(prev => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
  }, []);

  const cleanupPeerConnection = useCallback((userId: string) => {
    const peerConnection = peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      setPeerConnections(prev => {
        const updated = new Map(prev);
        updated.delete(userId);
        return updated;
      });
    }
  }, [peerConnections]);

  const handleRemoteAudioStream = useCallback((payload: any) => {
    // Handle remote audio stream data
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      
      // Cleanup peer connections
      peerConnections.forEach(pc => pc.close());
      
      // Stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [peerConnections, audioStream]);

  return {
    // State
    participants: state.participants,
    userPresence,
    isConnected: state.isConnected,
    isHost: state.isHost,
    sessionId: state.sessionId,
    
    // Actions
    initializeSession,
    broadcastOperation,
    updatePresence,
    initializeAudioStreaming,
    
    // Audio streaming
    audioStream,
    peerConnections
  };
}