import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { DawProjectDataV2 } from '@/types/daw';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  bpm: number;
  preview_image?: string;
  project_data: DawProjectDataV2;
  is_featured: boolean;
  usage_count: number;
  created_at: string;
}

export const useProjectTemplates = () => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;

      setTemplates((data || []) as unknown as ProjectTemplate[]);
    } catch (error) {
      console.error('Error fetching project templates:', error);
      toast({
        title: "Error",
        description: "Failed to load project templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      // Get template data
      const { data: template, error } = await supabase
        .from('project_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Increment usage count
      await supabase
        .from('project_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', templateId);

      // Refresh templates
      fetchTemplates();

      return template.project_data as unknown as DawProjectDataV2;
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveAsTemplate = async (
    name: string,
    description: string,
    genre: string,
    projectData: DawProjectDataV2
  ) => {
    try {
      const { error } = await supabase
        .from('project_templates')
        .insert({
          name,
          description,
          genre,
          bpm: projectData.bpm,
          project_data: projectData as any,
          is_featured: false,
          usage_count: 0,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template saved successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  return {
    templates,
    loading,
    refreshTemplates: fetchTemplates,
    useTemplate,
    saveAsTemplate,
  };
};
