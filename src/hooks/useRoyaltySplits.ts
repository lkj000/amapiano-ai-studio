/**
 * Royalty Splits Hook
 * Handles royalty split management with Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  splitPercent: number;
  email: string;
}

export interface RoyaltySplit {
  id: string;
  release_id: string | null;
  user_id: string;
  track_title: string;
  collaborators: Collaborator[];
  total_streams: number;
  total_revenue_cents: number;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSplitParams {
  trackTitle: string;
  releaseId?: string;
  collaborators: Collaborator[];
}

export function useRoyaltySplits() {
  const queryClient = useQueryClient();

  // Fetch user's royalty splits
  const { data: splits = [], isLoading, error, refetch } = useQuery({
    queryKey: ['royalty-splits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('royalty_splits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse collaborators JSON
      return (data || []).map(split => ({
        ...split,
        collaborators: (split.collaborators as unknown as Collaborator[]) || [],
      })) as RoyaltySplit[];
    },
  });

  // Create a new royalty split
  const createSplit = useMutation({
    mutationFn: async (params: CreateSplitParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to create splits');

      // Validate total is 100%
      const total = params.collaborators.reduce((sum, c) => sum + c.splitPercent, 0);
      if (total !== 100) {
        throw new Error('Total split must equal 100%');
      }

      const { data, error } = await supabase
        .from('royalty_splits')
        .insert({
          user_id: user.id,
          track_title: params.trackTitle,
          release_id: params.releaseId || null,
          collaborators: params.collaborators as unknown as Record<string, unknown>,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['royalty-splits'] });
      toast.success('Royalty splits saved!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save splits');
    },
  });

  // Update existing split
  const updateSplit = useMutation({
    mutationFn: async ({ id, collaborators, isFinalized }: { 
      id: string; 
      collaborators?: Collaborator[];
      isFinalized?: boolean;
    }) => {
      const updates: Record<string, any> = {};
      
      if (collaborators !== undefined) {
        const total = collaborators.reduce((sum, c) => sum + c.splitPercent, 0);
        if (total !== 100) {
          throw new Error('Total split must equal 100%');
        }
        updates.collaborators = collaborators;
      }
      
      if (isFinalized !== undefined) {
        updates.is_finalized = isFinalized;
      }

      const { error } = await supabase
        .from('royalty_splits')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['royalty-splits'] });
      toast.success('Splits updated!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update splits');
    },
  });

  // Delete split
  const deleteSplit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('royalty_splits')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['royalty-splits'] });
      toast.success('Split deleted');
    },
  });

  // Calculate projected revenue for each collaborator
  const calculateProjectedRevenue = (
    collaborators: Collaborator[], 
    totalStreams: number,
    avgRatePerStream: number = 0.004
  ) => {
    const totalRevenue = totalStreams * avgRatePerStream;
    
    return collaborators.map(collab => ({
      ...collab,
      projectedRevenue: (totalRevenue * collab.splitPercent) / 100,
    }));
  };

  return {
    splits,
    isLoading,
    error,
    refetch,
    createSplit,
    updateSplit,
    deleteSplit,
    calculateProjectedRevenue,
  };
}
