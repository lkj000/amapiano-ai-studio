import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DuetCollaboration {
  id: string;
  original_post_id: string;
  duet_post_id: string;
  creator_id: string;
  collaboration_type: string;
  mix_settings: any;
  created_at: string;
}

export const useDuetCollaboration = () => {
  const [collaborations, setCollaborations] = useState<DuetCollaboration[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createDuet = async (originalPostId: string, duetPostId: string, mixSettings: any = {}) => {
    try {
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('duet_collaborations')
        .insert({
          original_post_id: originalPostId,
          duet_post_id: duetPostId,
          creator_id: user.user.id,
          collaboration_type: 'duet',
          mix_settings: mixSettings
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Duet collaboration created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating duet:', error);
      toast({
        title: "Error",
        description: "Failed to create duet collaboration",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDuetsForPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('duet_collaborations')
        .select(`
          *,
          duet_post:social_posts!duet_collaborations_duet_post_id_fkey(
            id,
            title,
            creator_id,
            audio_url,
            preview_url,
            created_at
          )
        `)
        .eq('original_post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching duets:', error);
      return [];
    }
  };

  const getOriginalPost = async (duetPostId: string) => {
    try {
      const { data, error } = await supabase
        .from('duet_collaborations')
        .select(`
          *,
          original_post:social_posts!duet_collaborations_original_post_id_fkey(
            id,
            title,
            creator_id,
            audio_url,
            preview_url,
            created_at
          )
        `)
        .eq('duet_post_id', duetPostId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching original post:', error);
      return null;
    }
  };

  return {
    collaborations,
    loading,
    createDuet,
    getDuetsForPost,
    getOriginalPost
  };
};