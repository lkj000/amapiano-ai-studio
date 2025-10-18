/**
 * Workspace Hook - Multi-Tenancy Management
 * Team collaboration and permission management
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: Record<string, any>;
  joinedAt: string;
}

export const useWorkspace = () => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user's workspaces
   */
  const loadWorkspaces = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedWorkspaces: Workspace[] = (data || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        ownerId: w.owner_id,
        settings: w.settings,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      }));

      setWorkspaces(mappedWorkspaces);

      // Set first workspace as current if none selected
      if (!currentWorkspace && mappedWorkspaces.length > 0) {
        setCurrentWorkspace(mappedWorkspaces[0]);
      }
    } catch (error: any) {
      console.error('[Workspace] Load error:', error);
      toast({
        title: "Failed to Load Workspaces",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  /**
   * Create a new workspace
   */
  const createWorkspace = useCallback(async (name: string, settings: Record<string, any> = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          owner_id: user.id,
          settings,
        })
        .select()
        .single();

      if (error) throw error;

      const newWorkspace: Workspace = {
        id: data.id,
        name: data.name,
        ownerId: data.owner_id,
        settings: data.settings,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setWorkspaces(prev => [newWorkspace, ...prev]);
      setCurrentWorkspace(newWorkspace);

      toast({
        title: "Workspace Created",
        description: `"${name}" is ready`,
      });

      return newWorkspace;
    } catch (error: any) {
      console.error('[Workspace] Create error:', error);
      toast({
        title: "Failed to Create Workspace",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  }, []);

  /**
   * Switch to a different workspace
   */
  const switchWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('current_workspace_id', workspaceId);
      toast({
        title: "Workspace Switched",
        description: `Now working in "${workspace.name}"`,
      });
    }
  }, [workspaces]);

  /**
   * Load workspace members
   */
  const loadMembers = useCallback(async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      const mappedMembers: WorkspaceMember[] = (data || []).map((m: any) => ({
        id: m.id,
        workspaceId: m.workspace_id,
        userId: m.user_id,
        role: m.role,
        permissions: m.permissions,
        joinedAt: m.joined_at,
      }));

      setMembers(mappedMembers);
    } catch (error: any) {
      console.error('[Workspace] Load members error:', error);
    }
  }, []);

  /**
   * Invite user to workspace
   */
  const inviteMember = useCallback(async (
    workspaceId: string,
    userId: string,
    role: 'admin' | 'member' | 'viewer' = 'member',
    permissions: Record<string, any> = {}
  ) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role,
          permissions,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Member Invited",
        description: "User added to workspace",
      });

      await loadMembers(workspaceId);
      return data;
    } catch (error: any) {
      console.error('[Workspace] Invite error:', error);
      toast({
        title: "Failed to Invite Member",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  }, [loadMembers]);

  /**
   * Update member role
   */
  const updateMemberRole = useCallback(async (
    memberId: string,
    role: 'admin' | 'member' | 'viewer'
  ) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `Member role changed to ${role}`,
      });

      if (currentWorkspace) {
        await loadMembers(currentWorkspace.id);
      }
    } catch (error: any) {
      console.error('[Workspace] Update role error:', error);
      toast({
        title: "Failed to Update Role",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [currentWorkspace, loadMembers]);

  /**
   * Remove member from workspace
   */
  const removeMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "User removed from workspace",
      });

      if (currentWorkspace) {
        await loadMembers(currentWorkspace.id);
      }
    } catch (error: any) {
      console.error('[Workspace] Remove member error:', error);
      toast({
        title: "Failed to Remove Member",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [currentWorkspace, loadMembers]);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Load members when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      loadMembers(currentWorkspace.id);
    }
  }, [currentWorkspace, loadMembers]);

  return {
    currentWorkspace,
    workspaces,
    members,
    isLoading,
    createWorkspace,
    switchWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    refreshWorkspaces: loadWorkspaces,
    refreshMembers: () => currentWorkspace && loadMembers(currentWorkspace.id),
  };
};
