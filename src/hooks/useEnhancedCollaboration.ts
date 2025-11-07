import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeCollaboration } from './useRealtimeCollaboration';
import type { DawProjectDataV2 } from '@/types/daw';

interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface UserCursor {
  userId: string;
  userName: string;
  position: CursorPosition;
  color: string;
}

interface AudioPreview {
  userId: string;
  trackId: string;
  position: number;
  isPlaying: boolean;
}

export const useEnhancedCollaboration = (projectId: string, projectData: DawProjectDataV2) => {
  const [userCursors, setUserCursors] = useState<Map<string, UserCursor>>(new Map());
  const [audioPreview, setAudioPreview] = useState<AudioPreview | null>(null);
  const [isRecordingCursor, setIsRecordingCursor] = useState(false);
  const lastCursorBroadcast = useRef<number>(0);
  const cursorThrottleMs = 50; // Throttle cursor updates to 20 fps

  const collaboration = useRealtimeCollaboration(projectId, projectData);

  // Generate user color based on user ID
  const getUserColor = useCallback((userId: string): string => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Track mouse movement
  useEffect(() => {
    if (!isRecordingCursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastCursorBroadcast.current < cursorThrottleMs) return;

      lastCursorBroadcast.current = now;

      const position: CursorPosition = {
        x: e.clientX,
        y: e.clientY,
        timestamp: now,
      };

      // Broadcast cursor position
      collaboration.updatePresence({
        cursor: {
          x: position.x,
          y: position.y,
        },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isRecordingCursor, collaboration]);

  // Listen for presence updates from userPresence map
  useEffect(() => {
    const updateCursors = () => {
      const newCursors = new Map<string, UserCursor>();

      // Access userPresence from collaboration hook
      if (collaboration.userPresence) {
        collaboration.userPresence.forEach((presence, userId) => {
          if (presence.cursor) {
            newCursors.set(userId, {
              userId,
              userName: presence.name || 'User',
              position: {
                x: presence.cursor.x,
                y: presence.cursor.y,
                timestamp: presence.lastSeen,
              },
              color: getUserColor(userId),
            });
          }
        });
      }

      setUserCursors(newCursors);
    };

    updateCursors();
  }, [collaboration.userPresence, getUserColor]);

  // Broadcast audio preview state using track-update
  const broadcastAudioPreview = useCallback((
    trackId: string,
    position: number,
    isPlaying: boolean
  ) => {
    collaboration.broadcastOperation({
      type: 'track-update',
      trackId,
      data: {
        audioPreview: {
          position,
          isPlaying,
        },
      },
    });
  }, [collaboration]);

  // Listen for audio preview updates
  useEffect(() => {
    const handleOperation = (event: CustomEvent) => {
      const operation = event.detail;
      if (operation.type === 'track-update' && operation.data?.audioPreview) {
        setAudioPreview({
          userId: operation.userId,
          trackId: operation.trackId || '',
          position: operation.data.audioPreview.position,
          isPlaying: operation.data.audioPreview.isPlaying,
        });
      }
    };

    window.addEventListener('collaboration:operation' as any, handleOperation);
    return () => window.removeEventListener('collaboration:operation' as any, handleOperation);
  }, []);

  // Cleanup stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5000; // 5 seconds

      setUserCursors(prev => {
        const updated = new Map(prev);
        for (const [userId, cursor] of updated) {
          if (now - cursor.position.timestamp > staleThreshold) {
            updated.delete(userId);
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startCursorTracking = useCallback(() => {
    setIsRecordingCursor(true);
  }, []);

  const stopCursorTracking = useCallback(() => {
    setIsRecordingCursor(false);
  }, []);

  return {
    ...collaboration,
    userCursors: Array.from(userCursors.values()),
    audioPreview,
    broadcastAudioPreview,
    startCursorTracking,
    stopCursorTracking,
    isRecordingCursor,
  };
};
