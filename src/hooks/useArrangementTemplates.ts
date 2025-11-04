import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ArrangementSection {
  name: string;
  duration: number;
  elements: string[];
}

interface ArrangementTemplate {
  id?: string;
  name: string;
  sections: ArrangementSection[];
  totalBars: number;
  genre?: string;
  author?: string;
  createdAt?: string;
  isPublic?: boolean;
}

const DEFAULT_TEMPLATES: ArrangementTemplate[] = [
  {
    name: 'Private School',
    totalBars: 128,
    genre: 'amapiano',
    sections: [
      { name: 'Intro', duration: 16, elements: ['Percussion', 'Hi-hats'] },
      { name: 'Build', duration: 16, elements: ['Log Drums', 'Shakers', 'Bass (soft)'] },
      { name: 'Drop 1', duration: 32, elements: ['Full Drums', 'Bass', 'Piano', 'Vocals'] },
      { name: 'Breakdown', duration: 16, elements: ['Piano', 'Bass', 'Minimal Drums'] },
      { name: 'Build 2', duration: 16, elements: ['Add Percussion', 'Risers'] },
      { name: 'Drop 2', duration: 32, elements: ['Full Elements', 'Counter Melody'] }
    ]
  },
  {
    name: 'Blaq Diamond Style',
    totalBars: 144,
    genre: 'amapiano',
    sections: [
      { name: 'Intro', duration: 8, elements: ['Shakers', 'Cowbells'] },
      { name: 'Percussion Build', duration: 16, elements: ['Add Bongos', 'Rides', 'Hi-hats'] },
      { name: 'Main Groove', duration: 32, elements: ['Log Drums', 'Bass', 'Heavy Percussion'] },
      { name: 'Vocal Section', duration: 32, elements: ['Vocals', 'Full Drums', 'Piano'] },
      { name: 'Breakdown', duration: 16, elements: ['Minimal', 'Reverse FX'] },
      { name: 'Final Drop', duration: 40, elements: ['All Elements', 'SFX', 'Build Energy'] }
    ]
  },
  {
    name: 'Quick Radio Edit',
    totalBars: 96,
    genre: 'amapiano',
    sections: [
      { name: 'Intro', duration: 8, elements: ['Hook', 'Light Drums'] },
      { name: 'Verse', duration: 24, elements: ['Vocals', 'Bass', 'Percussion'] },
      { name: 'Chorus', duration: 32, elements: ['Full Arrangement'] },
      { name: 'Bridge', duration: 16, elements: ['Breakdown', 'Build'] },
      { name: 'Outro', duration: 16, elements: ['Hook', 'Fade Elements'] }
    ]
  }
];

export function useArrangementTemplates() {
  const [templates, setTemplates] = useState<ArrangementTemplate[]>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load templates from localStorage
  useEffect(() => {
    const loadLocalTemplates = () => {
      try {
        const stored = localStorage.getItem('arrangement_templates');
        if (stored) {
          const localTemplates = JSON.parse(stored);
          setTemplates(prev => [...prev, ...localTemplates]);
        }
      } catch (error) {
        console.error('Failed to load local templates:', error);
      }
    };

    loadLocalTemplates();
  }, []);

  // Save template locally
  const saveToLocal = useCallback((template: ArrangementTemplate) => {
    try {
      const stored = localStorage.getItem('arrangement_templates');
      const existing = stored ? JSON.parse(stored) : [];
      
      const updated = [...existing, {
        ...template,
        id: template.id || `local_${Date.now()}`,
        createdAt: new Date().toISOString()
      }];
      
      localStorage.setItem('arrangement_templates', JSON.stringify(updated));
      
      setTemplates(prev => [...DEFAULT_TEMPLATES, ...updated]);
      
      toast({
        title: "Template Saved",
        description: `"${template.name}" saved successfully`,
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({
        title: "Save Failed",
        description: "Could not save template",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Placeholder for cloud save
  const saveToDatabase = useCallback(async (
    template: ArrangementTemplate,
    isPublic: boolean = false
  ) => {
    toast({
      title: "Cloud Save Coming Soon",
      description: "Database integration will be added next",
    });
    return false;
  }, [toast]);

  // Delete template
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const stored = localStorage.getItem('arrangement_templates');
      if (stored) {
        const existing = JSON.parse(stored);
        const filtered = existing.filter((t: any) => t.id !== templateId);
        localStorage.setItem('arrangement_templates', JSON.stringify(filtered));
      }
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template Deleted",
        description: "Template removed successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
  }, [toast]);

  // Export template as JSON
  const exportTemplate = useCallback((template: ArrangementTemplate) => {
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Exported",
      description: `Downloaded ${template.name}.json`,
    });
  }, [toast]);

  // Import template from JSON
  const importTemplate = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const template = JSON.parse(text) as ArrangementTemplate;
      
      // Validate template structure
      if (!template.name || !template.sections || !template.totalBars) {
        throw new Error('Invalid template format');
      }

      const imported = {
        ...template,
        id: `imported_${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      setTemplates(prev => [...prev, imported]);
      saveToLocal(imported);

      toast({
        title: "Template Imported",
        description: `"${template.name}" imported successfully`,
      });

      return imported;
    } catch (error) {
      console.error('Failed to import template:', error);
      toast({
        title: "Import Failed",
        description: "Invalid template file",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, saveToLocal]);

  const loadFromDatabase = useCallback(async () => {
    // Placeholder - will be implemented when database is ready
    return;
  }, []);

  return {
    templates,
    isLoading,
    isSaving,
    loadFromDatabase,
    saveToLocal,
    saveToDatabase,
    deleteTemplate,
    exportTemplate,
    importTemplate
  };
}
