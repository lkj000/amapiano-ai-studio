/**
 * Voice Chat Integration - Phase 3 Enhancement
 * Real-time voice communication for collaborative sessions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface VoiceChatParticipant {
  userId: string;
  userName: string;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  isDeafened: boolean;
}

export interface VoiceChatRoom {
  id: string;
  workspaceId: string;
  sessionId?: string;
  participants: Map<string, VoiceChatParticipant>;
  isActive: boolean;
}

export const useVoiceChat = (workspaceId: string, sessionId?: string) => {
  const [room, setRoom] = useState<VoiceChatRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const channelRef = useRef<any>(null);

  /**
   * Initialize audio context and analyser
   */
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      localStreamRef.current = stream;

      // Create audio context for level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start monitoring audio level
      monitorAudioLevel();

      return stream;
    } catch (error: any) {
      console.error('[VoiceChat] Audio init error:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  /**
   * Monitor audio input level
   */
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 255) * 100);
      
      setAudioLevel(normalizedLevel);

      if (isConnected) {
        requestAnimationFrame(checkLevel);
      }
    };

    checkLevel();
  }, [isConnected]);

  /**
   * Join voice chat room
   */
  const joinVoiceChat = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Initialize audio
      const stream = await initializeAudio();
      if (!stream) return;

      // Create or join room
      const roomId = sessionId || `workspace-${workspaceId}`;
      const channel = supabase.channel(`voice:${roomId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'voice_presence' },
        },
      });

      // Handle presence
      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          updateParticipantsFromPresence(presenceState);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          newPresences.forEach((presence: any) => {
            initiateConnection(presence.user_id);
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.forEach((presence: any) => {
            cleanupConnection(presence.user_id);
          });
        })
        .on('broadcast', { event: 'webrtc_signal' }, ({ payload }) => {
          handleSignal(payload);
        });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.display_name || 'User',
            is_muted: isMuted,
            is_deafened: isDeafened,
          });

          setRoom({
            id: roomId,
            workspaceId,
            sessionId,
            participants: new Map(),
            isActive: true,
          });

          setIsConnected(true);
          channelRef.current = channel;
        }
      });
    } catch (error: any) {
      console.error('[VoiceChat] Join error:', error);
      toast({
        title: "Join Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [workspaceId, sessionId, isMuted, isDeafened, initializeAudio]);

  /**
   * Leave voice chat
   */
  const leaveVoiceChat = useCallback(async () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Close peer connections
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Unsubscribe from channel
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      setIsConnected(false);
      setRoom(null);
      setAudioLevel(0);
    } catch (error: any) {
      console.error('[VoiceChat] Leave error:', error);
    }
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);

      // Broadcast mute status
      if (channelRef.current) {
        channelRef.current.track({ is_muted: !audioTrack.enabled });
      }
    }
  }, []);

  /**
   * Toggle deafen (disable output)
   */
  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => {
      const newState = !prev;
      
      // Mute all remote audio
      peerConnectionsRef.current.forEach((pc, userId) => {
        // This would mute the remote audio elements
        const audio = document.querySelector(`audio[data-user-id="${userId}"]`) as HTMLAudioElement;
        if (audio) {
          audio.muted = newState;
        }
      });

      if (channelRef.current) {
        channelRef.current.track({ is_deafened: newState });
      }

      return newState;
    });
  }, []);

  /**
   * Initialize peer connection with another user
   */
  const initiateConnection = useCallback(async (userId: string) => {
    if (!localStreamRef.current) return;

    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });

      // Handle incoming stream
      peerConnection.ontrack = (event) => {
        const remoteAudio = document.createElement('audio');
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.autoplay = true;
        remoteAudio.dataset.userId = userId;
        if (isDeafened) remoteAudio.muted = true;
        document.body.appendChild(remoteAudio);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              type: 'ice_candidate',
              candidate: event.candidate,
              targetUserId: userId,
            },
          });
        }
      };

      peerConnectionsRef.current.set(userId, peerConnection);

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            type: 'offer',
            offer,
            targetUserId: userId,
          },
        });
      }
    } catch (error) {
      console.error('[VoiceChat] Connection init error:', error);
    }
  }, [isDeafened]);

  /**
   * Handle WebRTC signals
   */
  const handleSignal = useCallback(async (payload: any) => {
    const { type, targetUserId, offer, answer, candidate } = payload;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || targetUserId !== user.id) return;

    const peerConnection = peerConnectionsRef.current.get(payload.fromUserId);
    if (!peerConnection) return;

    try {
      if (type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              type: 'answer',
              answer,
              targetUserId: payload.fromUserId,
            },
          });
        }
      } else if (type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } else if (type === 'ice_candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('[VoiceChat] Signal handling error:', error);
    }
  }, []);

  /**
   * Update participants from presence
   */
  const updateParticipantsFromPresence = useCallback((presenceState: any) => {
    const participants = new Map<string, VoiceChatParticipant>();

    Object.values(presenceState).forEach((presences: any) => {
      presences.forEach((presence: any) => {
        participants.set(presence.user_id, {
          userId: presence.user_id,
          userName: presence.user_name,
          isMuted: presence.is_muted,
          isSpeaking: false, // Updated from audio level
          audioLevel: 0,
          isDeafened: presence.is_deafened,
        });
      });
    });

    setRoom(prev => prev ? { ...prev, participants } : null);
  }, []);

  /**
   * Cleanup peer connection
   */
  const cleanupConnection = useCallback((userId: string) => {
    const peerConnection = peerConnectionsRef.current.get(userId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(userId);
    }

    // Remove audio element
    const audio = document.querySelector(`audio[data-user-id="${userId}"]`);
    if (audio) audio.remove();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVoiceChat();
    };
  }, [leaveVoiceChat]);

  return {
    room,
    isConnected,
    isMuted,
    isDeafened,
    audioLevel,
    joinVoiceChat,
    leaveVoiceChat,
    toggleMute,
    toggleDeafen,
  };
};
