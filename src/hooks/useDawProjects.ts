import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DawProject, DawProjectData } from '@/types/daw';
import type { Tables } from '@/integrations/supabase/types';

export const useDawProjects = () => {
  return useQuery({
    queryKey: ['dawProjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daw_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((project): DawProject => ({
        ...project,
        project_data: project.project_data as unknown as DawProjectData,
      }));
    },
  });
};

export const useDawProject = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['dawProject', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('daw_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        project_data: data.project_data as unknown as DawProjectData,
      } as DawProject;
    },
    enabled: !!projectId,
  });
};

export const useSaveDawProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      name, 
      projectData, 
      projectId,
      bpm,
      keySignature 
    }: { 
      name: string; 
      projectData: DawProjectData; 
      projectId?: string;
      bpm: number;
      keySignature: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (projectId) {
        // Update existing project
        const { data, error } = await supabase
          .from('daw_projects')
          .update({
            name,
            bpm,
            key_signature: keySignature,
            project_data: projectData as any,
          })
          .eq('id', projectId)
          .select()
          .single();

        if (error) throw error;
        return {
          ...data,
          project_data: data.project_data as unknown as DawProjectData,
        } as DawProject;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('daw_projects')
          .insert({
            user_id: user.id,
            name,
            bpm,
            key_signature: keySignature,
            project_data: projectData as any,
          })
          .select()
          .single();

        if (error) throw error;
        return {
          ...data,
          project_data: data.project_data as unknown as DawProjectData,
        } as DawProject;
      }
    },
    onSuccess: (data) => {
      toast.success(`Project "${data.name}" saved successfully!`);
      queryClient.invalidateQueries({ queryKey: ['dawProjects'] });
      queryClient.invalidateQueries({ queryKey: ['dawProject', data.id] });
    },
    onError: (error) => {
      toast.error(`Failed to save project: ${error.message}`);
    },
  });
};

export const useDeleteDawProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('daw_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Project deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['dawProjects'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });
};