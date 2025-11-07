import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { DawProjectDataV2 } from '@/types/daw';

export const useCloudStorage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveProject = async (
    name: string,
    projectData: DawProjectDataV2,
    description?: string,
    isPublic: boolean = false
  ) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cloud_projects')
        .insert({
          user_id: user.id,
          name,
          description,
          project_data: projectData as any,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Project Saved',
        description: `${name} saved to cloud successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save project',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProject = async (
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      project_data?: DawProjectDataV2;
      is_public?: boolean;
    }
  ) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cloud_projects')
        .update({
          ...updates,
          project_data: updates.project_data as any,
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Project Updated',
        description: 'Changes saved successfully',
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update project',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cloud_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load projects',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('cloud_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Project Deleted',
        description: 'Project removed from cloud',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    saveProject,
    updateProject,
    loadProjects,
    deleteProject,
    isSaving,
    isLoading,
  };
};
