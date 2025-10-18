/**
 * Cross-Workspace Pattern Sharing - Phase 3 Enhancement
 * Share patterns and samples across workspaces with privacy controls
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SharedPattern {
  id: string;
  sourceWorkspaceId: string;
  pattern: any;
  permissions: {
    public: boolean;
    workspaceIds: string[];
    allowRemix: boolean;
    allowDownload: boolean;
    requireAttribution: boolean;
  };
  metadata: {
    name: string;
    description?: string;
    tags: string[];
    category: string;
    createdBy: string;
    sharedAt: string;
  };
  usage: {
    views: number;
    remixes: number;
    downloads: number;
  };
}

export interface SharingPolicy {
  workspaceId: string;
  allowIncoming: boolean;
  allowOutgoing: boolean;
  autoApproveFrom: string[];
  blockedWorkspaces: string[];
  requireReview: boolean;
}

export const useCrossWorkspaceSharing = () => {
  const [sharedPatterns, setSharedPatterns] = useState<SharedPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sharingPolicy, setSharingPolicy] = useState<SharingPolicy | null>(null);

  /**
   * Share a pattern to other workspaces
   */
  const sharePattern = useCallback(async (
    workspaceId: string,
    pattern: any,
    permissions: SharedPattern['permissions'],
    metadata: Omit<SharedPattern['metadata'], 'sharedAt' | 'createdBy'>
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sharedPattern: Omit<SharedPattern, 'id' | 'usage'> = {
        sourceWorkspaceId: workspaceId,
        pattern,
        permissions,
        metadata: {
          ...metadata,
          createdBy: user.id,
          sharedAt: new Date().toISOString(),
        },
      };

      const { data, error} = await supabase
        .from('shared_patterns' as any)
        .insert({
          ...sharedPattern,
          usage: { views: 0, remixes: 0, downloads: 0 },
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Pattern Shared",
        description: permissions.public 
          ? "Pattern is now public" 
          : `Shared with ${permissions.workspaceIds.length} workspace(s)`,
      });

      return (data as any)?.id || null;
    } catch (error: any) {
      console.error('[CrossWorkspace] Share error:', error);
      toast({
        title: "Sharing Failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  }, []);

  /**
   * Browse shared patterns across workspaces
   */
  const browseSharedPatterns = useCallback(async (
    filters?: {
      category?: string;
      tags?: string[];
      sourceWorkspace?: string;
      publicOnly?: boolean;
    }
  ) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's workspaces
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);

      const userWorkspaceIds = memberships?.map(m => m.workspace_id) || [];

      let query = supabase
        .from('shared_patterns' as any)
        .select('*');

      // Filter by permissions
      if (filters?.publicOnly) {
        query = query.eq('permissions->public', true);
      } else {
        // Include public + accessible patterns
        query = query.or(
          `permissions->public.eq.true,permissions->workspaceIds.cs.{${userWorkspaceIds.join(',')}}`
        );
      }

      if (filters?.category) {
        query = query.eq('metadata->category', filters.category);
      }

      if (filters?.sourceWorkspace) {
        query = query.eq('source_workspace_id', filters.sourceWorkspace);
      }

      const { data, error } = await query;
      if (error) throw error;

      const patterns = (data || []) as any[];
      setSharedPatterns(patterns);
      return patterns;
    } catch (error: any) {
      console.error('[CrossWorkspace] Browse error:', error);
      toast({
        title: "Browse Failed",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Import a shared pattern to current workspace
   */
  const importPattern = useCallback(async (
    patternId: string,
    targetWorkspaceId: string
  ): Promise<boolean> => {
    try {
      const { data: sharedPattern, error: fetchError } = await supabase
        .from('shared_patterns' as any)
        .select('*')
        .eq('id', patternId)
        .single();

      if (fetchError) throw fetchError;

      const pattern = sharedPattern as any;

      // Check permissions
      if (!pattern.permissions.public) {
        if (!pattern.permissions.workspaceIds.includes(targetWorkspaceId)) {
          throw new Error('No permission to import this pattern');
        }
      }

      if (!pattern.permissions.allowDownload) {
        throw new Error('Download not allowed for this pattern');
      }

      // Create local copy in target workspace
      const { error: importError } = await supabase
        .from('workspace_patterns' as any)
        .insert({
          workspace_id: targetWorkspaceId,
          pattern_data: pattern.pattern,
          metadata: {
            ...pattern.metadata,
            importedFrom: patternId,
            originalWorkspace: pattern.sourceWorkspaceId,
          },
        });

      if (importError) throw importError;

      // Increment download count
      await supabase
        .from('shared_patterns' as any)
        .update({
          usage: {
            ...pattern.usage,
            downloads: (pattern.usage.downloads || 0) + 1,
          },
        })
        .eq('id', patternId);

      toast({
        title: "Pattern Imported",
        description: "Pattern added to your workspace",
      });

      return true;
    } catch (error: any) {
      console.error('[CrossWorkspace] Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, []);

  /**
   * Create a remix of a shared pattern
   */
  const remixPattern = useCallback(async (
    patternId: string,
    targetWorkspaceId: string,
    modifications: any
  ): Promise<string | null> => {
    try {
      const { data: sharedPattern, error: fetchError } = await supabase
        .from('shared_patterns' as any)
        .select('*')
        .eq('id', patternId)
        .single();

      if (fetchError) throw fetchError;

      const pattern = sharedPattern as any;

      if (!pattern.permissions.allowRemix) {
        throw new Error('Remixing not allowed for this pattern');
      }

      // Create remix
      const { data: remix, error: remixError } = await supabase
        .from('workspace_patterns' as any)
        .insert({
          workspace_id: targetWorkspaceId,
          pattern_data: {
            ...pattern.pattern,
            ...modifications,
          },
          metadata: {
            name: `${pattern.metadata.name} (Remix)`,
            remixOf: patternId,
            originalWorkspace: pattern.sourceWorkspaceId,
            requiresAttribution: pattern.permissions.requireAttribution,
          },
        })
        .select()
        .single();

      if (remixError) throw remixError;

      // Increment remix count
      await supabase
        .from('shared_patterns' as any)
        .update({
          usage: {
            ...pattern.usage,
            remixes: (pattern.usage.remixes || 0) + 1,
          },
        })
        .eq('id', patternId);

      toast({
        title: "Remix Created",
        description: "Pattern remixed successfully",
      });

      return (remix as any)?.id || null;
    } catch (error: any) {
      console.error('[CrossWorkspace] Remix error:', error);
      toast({
        title: "Remix Failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  }, []);

  /**
   * Update sharing policy for a workspace
   */
  const updateSharingPolicy = useCallback(async (
    workspaceId: string,
    policy: Partial<SharingPolicy>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspace_sharing_policies' as any)
        .upsert({
          workspace_id: workspaceId,
          ...policy,
        });

      if (error) throw error;

      setSharingPolicy(prev => prev ? { ...prev, ...policy } : null);
      toast({
        title: "Policy Updated",
        description: "Sharing policy updated successfully",
      });

      return true;
    } catch (error: any) {
      console.error('[CrossWorkspace] Policy update error:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, []);

  /**
   * Revoke sharing for a pattern
   */
  const revokeSharing = useCallback(async (patternId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shared_patterns' as any)
        .delete()
        .eq('id', patternId);

      if (error) throw error;

      setSharedPatterns(prev => prev.filter(p => p.id !== patternId));
      toast({
        title: "Sharing Revoked",
        description: "Pattern is no longer shared",
      });

      return true;
    } catch (error: any) {
      console.error('[CrossWorkspace] Revoke error:', error);
      toast({
        title: "Revoke Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, []);

  return {
    sharedPatterns,
    isLoading,
    sharingPolicy,
    sharePattern,
    browseSharedPatterns,
    importPattern,
    remixPattern,
    updateSharingPolicy,
    revokeSharing,
  };
};
