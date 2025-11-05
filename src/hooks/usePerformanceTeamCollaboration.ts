/**
 * Performance Team Collaboration Hook
 * 
 * Enables real-time collaboration on performance monitoring
 * with presence tracking, comments, and shared insights
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TeamMember {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  online_at: string;
  viewing_section?: string;
}

interface PerformanceComment {
  id: string;
  user_id: string;
  metric_id?: string;
  anomaly_id?: string;
  comment_text: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export function usePerformanceTeamCollaboration() {
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember>>({});
  const [comments, setComments] = useState<PerformanceComment[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let presenceChannel: RealtimeChannel | null = null;

    const setupCollaboration = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.warn('[Team Collaboration] User not authenticated');
          return;
        }

        setCurrentUser(user);

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        // Set up presence channel
        presenceChannel = supabase.channel('performance-collaboration');

        // Track presence
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel!.presenceState();
            const members: Record<string, TeamMember> = {};
            
            Object.keys(state).forEach(key => {
              const presences = state[key] as any[];
              if (presences && presences.length > 0) {
                const presence = presences[0];
                if (presence && typeof presence === 'object' && 'user_id' in presence) {
                  members[key] = presence as TeamMember;
                }
              }
            });
            
            setTeamMembers(members);
            console.log('[Team Collaboration] Team members updated:', members);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('[Team Collaboration] Member joined:', key);
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            console.log('[Team Collaboration] Member left:', key);
          });

        // Listen for new comments
        presenceChannel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'performance_comments'
          },
          async (payload) => {
            console.log('[Team Collaboration] New comment:', payload.new);
            
            // Fetch user profile for the comment
            const { data: commentUser } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', (payload.new as any).user_id)
              .single();

            const newComment = {
              ...payload.new,
              user_profile: commentUser || undefined
            } as PerformanceComment;

            setComments(prev => [newComment, ...prev]);
          }
        );

        await presenceChannel.subscribe(async (status) => {
          console.log('[Team Collaboration] Connection status:', status);
          setIsConnected(status === 'SUBSCRIBED');

          if (status === 'SUBSCRIBED') {
            // Track current user's presence
            await presenceChannel!.track({
              user_id: user.id,
              display_name: profile?.display_name || user.email || 'Anonymous',
              avatar_url: profile?.avatar_url,
              online_at: new Date().toISOString(),
              viewing_section: 'overview'
            });
          }
        });

        setChannel(presenceChannel);

        // Load existing comments
        const { data: existingComments } = await supabase
          .from('performance_comments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (existingComments) {
          // Fetch user profiles for comments
          const userIds = [...new Set(existingComments.map(c => c.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .in('user_id', userIds);

          const profileMap = new Map(
            profiles?.map(p => [p.user_id, p]) || []
          );

          setComments(existingComments.map(c => ({
            ...c,
            user_profile: profileMap.get(c.user_id) ? {
              display_name: profileMap.get(c.user_id)!.display_name || 'Anonymous',
              avatar_url: profileMap.get(c.user_id)!.avatar_url
            } : undefined
          })) as PerformanceComment[]);
        }

      } catch (error) {
        console.error('[Team Collaboration] Setup error:', error);
      }
    };

    setupCollaboration();

    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, []);

  const updatePresence = useCallback(async (viewingSection: string) => {
    if (channel && currentUser) {
      await channel.track({
        user_id: currentUser.id,
        online_at: new Date().toISOString(),
        viewing_section: viewingSection
      });
    }
  }, [channel, currentUser]);

  const addComment = useCallback(async (
    text: string,
    metricId?: string,
    anomalyId?: string,
    mentions: string[] = []
  ) => {
    try {
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('performance_comments')
        .insert({
          user_id: currentUser.id,
          comment_text: text,
          metric_id: metricId,
          anomaly_id: anomalyId,
          mentions
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[Team Collaboration] Comment added:', data);
      return data;
    } catch (error) {
      console.error('[Team Collaboration] Error adding comment:', error);
      throw error;
    }
  }, [currentUser]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('performance_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      console.log('[Team Collaboration] Comment deleted:', commentId);
    } catch (error) {
      console.error('[Team Collaboration] Error deleting comment:', error);
      throw error;
    }
  }, []);

  return {
    teamMembers,
    comments,
    isConnected,
    currentUser,
    updatePresence,
    addComment,
    deleteComment,
  };
}
