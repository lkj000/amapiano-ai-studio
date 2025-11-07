import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectShare {
  id: string;
  project_id: string;
  shared_by: string;
  shared_with_email: string;
  permission: 'view' | 'edit';
  created_at: string;
  expires_at: string | null;
  share_token: string;
}

export const useProjectSharing = () => {
  const [shares, setShares] = useState<ProjectShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createShare = async (
    projectId: string,
    email: string,
    permission: 'view' | 'edit' = 'view',
    expiresInDays?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('project_shares')
        .insert({
          project_id: projectId,
          shared_by: user.id,
          shared_with_email: email,
          permission,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${data.share_token}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: 'Share Created',
        description: `Share link copied to clipboard`,
      });

      return { ...data, shareUrl } as ProjectShare & { shareUrl: string };
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: 'Share Failed',
        description: error instanceof Error ? error.message : 'Failed to create share',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loadShares = async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShares(data as ProjectShare[]);
      return data as ProjectShare[];
    } catch (error) {
      console.error('Error loading shares:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load shares',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      setShares(shares.filter(share => share.id !== shareId));

      toast({
        title: 'Share Revoked',
        description: 'Share link has been deleted',
      });
    } catch (error) {
      console.error('Error revoking share:', error);
      toast({
        title: 'Revoke Failed',
        description: error instanceof Error ? error.message : 'Failed to revoke share',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loadProjectByToken = async (token: string) => {
    try {
      const { data: share, error: shareError } = await supabase
        .from('project_shares')
        .select('*, cloud_projects(*)')
        .eq('share_token', token)
        .single();

      if (shareError) throw shareError;

      // Check if share is expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        throw new Error('Share link has expired');
      }

      return share;
    } catch (error) {
      console.error('Error loading shared project:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load shared project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    shares,
    createShare,
    loadShares,
    revokeShare,
    loadProjectByToken,
    isLoading,
  };
};
