import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { DawProjectDataV2 } from '@/types/daw';

interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  project_data: DawProjectDataV2;
  change_description: string | null;
  created_by: string;
  created_at: string;
}

export const useProjectVersions = () => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createVersion = async (
    projectId: string,
    projectData: DawProjectDataV2,
    changeDescription?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current version count
      const { data: existingVersions, error: countError } = await supabase
        .from('cloud_project_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextVersion = existingVersions && existingVersions.length > 0
        ? existingVersions[0].version_number + 1
        : 1;

      const { data, error } = await supabase
        .from('cloud_project_versions')
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          project_data: projectData as any,
          change_description: changeDescription || `Version ${nextVersion}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Version Saved',
        description: `Version ${nextVersion} created successfully`,
      });

      return data as unknown as ProjectVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: 'Version Save Failed',
        description: error instanceof Error ? error.message : 'Failed to create version',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loadVersions = async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cloud_project_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setVersions(data as unknown as ProjectVersion[]);
      return data as unknown as ProjectVersion[];
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load versions',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreVersion = async (versionId: string) => {
    try {
      const { data: version, error } = await supabase
        .from('cloud_project_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (error) throw error;

      // Update the main project with this version's data
      const { error: updateError } = await supabase
        .from('cloud_projects')
        .update({ 
          project_data: version.project_data as any,
        })
        .eq('id', version.project_id);

      if (updateError) throw updateError;

      toast({
        title: 'Version Restored',
        description: `Restored to version ${version.version_number}`,
      });

      return version as unknown as ProjectVersion;
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'Failed to restore version',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    versions,
    createVersion,
    loadVersions,
    restoreVersion,
    isLoading,
  };
};
