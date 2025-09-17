import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RemixTemplate {
  id: string;
  name: string;
  style_params: any;
  description?: string;
  preview_url?: string;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export const useRemixTemplates = () => {
  const [templates, setTemplates] = useState<RemixTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('remix_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching remix templates:', error);
      toast({
        title: "Error",
        description: "Failed to load remix templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      // Get current usage count first
      const { data: template } = await supabase
        .from('remix_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();

      if (template) {
        // Increment usage count
        const { error } = await supabase
          .from('remix_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', templateId);

        if (error) throw error;

        // Refresh templates to update usage count
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  return {
    templates,
    loading,
    refreshTemplates: fetchTemplates,
    useTemplate
  };
};