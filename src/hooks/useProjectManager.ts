import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import type { DawProjectData } from '@/types/daw';
import backend from '@/backend/client';

// Version control types
interface ProjectVersion {
  id: string;
  projectId: string;
  version: number;
  projectData: DawProjectData;
  message: string;
  createdAt: string;
  createdBy: string;
}

// Supabase database row type
interface DatabaseProject {
  id: string;
  name: string;
  user_id: string;
  bpm: number;
  key_signature: string;
  time_signature: string;
  project_data: any; // Json type from Supabase
  created_at: string;
  updated_at: string;
  version: number;
}

// Frontend Project type
interface Project {
  id: string;
  name: string;
  user_id: string;
  bpm: number;
  key_signature: string;
  time_signature: string;
  project_data: DawProjectData;
  created_at: string;
  updated_at: string;
  version: number;
}

interface ProjectStats {
  totalProjects: number;
  recentProjects: Project[];
  collaborativeProjects: number;
  storageUsed: number;
}

// Conversion functions
const convertDatabaseToProject = (dbProject: DatabaseProject): Project => {
  return {
    ...dbProject,
    project_data: dbProject.project_data as DawProjectData
  };
};

const createDefaultProjectData = (bpm: number, keySignature: string, timeSignature: string): DawProjectData => {
  return {
    bpm,
    keySignature,
    timeSignature,
    tracks: [],
    masterVolume: 0.8
  };
};

export const useProjectManager = (user: User | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);

  // Load all projects for the user
  const loadProjects = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await backend.music.listProjects();
      const convertedProjects = response.projects.map((p) => ({
        id: p.id,
        name: p.name,
        user_id: user.id,
        bpm: p.bpm,
        key_signature: p.keySignature,
        time_signature: '4/4',
        project_data: createDefaultProjectData(p.bpm, p.keySignature, '4/4'),
        created_at: '',
        updated_at: p.updatedAt,
        version: p.version,
      }));
      setProjects(convertedProjects);

      // Calculate stats
      const stats: ProjectStats = {
        totalProjects: convertedProjects.length,
        recentProjects: convertedProjects.slice(0, 5),
        collaborativeProjects: 0, // TODO: Add collaboration count
        storageUsed: 0 // TODO: Calculate storage usage
      };
      setProjectStats(stats);

    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new project
  const createProject = useCallback(async (
    name: string,
    bpm: number = 118,
    keySignature: string = 'C',
    timeSignature: string = '4/4'
  ): Promise<Project | null> => {
    if (!user) {
      toast.error('Must be logged in to create projects');
      return null;
    }

    try {
      const newProjectData = createDefaultProjectData(bpm, keySignature, timeSignature);

      const { data, error } = await supabase
        .from('daw_projects')
        .insert({
          name,
          user_id: user.id,
          bpm,
          key_signature: keySignature,
          time_signature: timeSignature,
          project_data: newProjectData as any
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = convertDatabaseToProject(data as DatabaseProject);
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      toast.success(`Project "${name}" created successfully`);
      
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
      return null;
    }
  }, [user]);

  // Save project changes
  const saveProject = useCallback(async (projectData: DawProjectData): Promise<boolean> => {
    if (!currentProject || !user) return false;

    try {
      const { error } = await supabase
        .from('daw_projects')
        .update({
          bpm: projectData.bpm,
          key_signature: projectData.keySignature,
          time_signature: projectData.timeSignature,
          project_data: projectData as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentProject.id);

      if (error) throw error;

      // Update local state
      const updatedProject = { ...currentProject, project_data: projectData };
      setCurrentProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
      setLastSaved(new Date());
      
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
      return false;
    }
  }, [currentProject, user]);

  // Load a specific project
  const loadProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('daw_projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const project = convertDatabaseToProject(data as DatabaseProject);
      setCurrentProject(project);
      toast.success(`Project "${data.name}" loaded`);
      return true;
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
      return false;
    }
  }, [user]);

  // Delete a project
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('daw_projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }

      toast.success('Project deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
      return false;
    }
  }, [user, currentProject]);

  // Duplicate a project
  const duplicateProject = useCallback(async (projectId: string, newName?: string): Promise<Project | null> => {
    if (!user) return null;

    const sourceProject = projects.find(p => p.id === projectId);
    if (!sourceProject) {
      toast.error('Source project not found');
      return null;
    }

    const duplicateName = newName || `${sourceProject.name} (Copy)`;
    
    try {
      const { data, error } = await supabase
        .from('daw_projects')
        .insert({
          name: duplicateName,
          user_id: user.id,
          bpm: sourceProject.bpm,
          key_signature: sourceProject.key_signature,
          time_signature: sourceProject.time_signature,
          project_data: sourceProject.project_data as any
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = convertDatabaseToProject(data as DatabaseProject);
      setProjects(prev => [newProject, ...prev]);
      toast.success(`Project duplicated as "${duplicateName}"`);
      
      return newProject;
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      toast.error('Failed to duplicate project');
      return null;
    }
  }, [user, projects]);

  // Create a version snapshot
  const createVersion = useCallback(async (
    projectId: string,
    message: string = 'Auto-saved version'
  ): Promise<boolean> => {
    if (!user || !currentProject) return false;

    try {
      const versionData = {
        project_id: projectId,
        version: (currentProject.version || 1) + 1,
        project_data: currentProject.project_data,
        message,
        created_by: user.id,
      };

      // Store in separate versions table
      const { error } = await supabase
        .from('project_versions' as any)
        .insert(versionData as any);

      if (error) throw error;

      toast.success(`Version ${versionData.version} created`);
      return true;
    } catch (error) {
      console.error('Failed to create version:', error);
      toast.error('Failed to create version');
      return false;
    }
  }, [user, currentProject]);

  // Load versions for a project
  const loadVersions = useCallback(async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('project_versions' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false });

      if (error) throw error;

      const versions: ProjectVersion[] = (data || []).map((v: any) => ({
        id: v.id,
        projectId: v.project_id,
        version: v.version,
        projectData: v.project_data,
        message: v.message,
        createdAt: v.created_at,
        createdBy: v.created_by,
      }));

      setProjectVersions(versions);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  }, [user]);

  // Restore a specific version
  const restoreVersion = useCallback(async (
    versionId: string
  ): Promise<boolean> => {
    if (!user || !currentProject) return false;

    try {
      const version = projectVersions.find(v => v.id === versionId);
      if (!version) {
        toast.error('Version not found');
        return false;
      }

      // Create a backup of current state
      await createVersion(currentProject.id, 'Before restore');

      // Restore the version
      const { error } = await supabase
        .from('daw_projects')
        .update({
          project_data: version.projectData as any,
          version: version.version,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProject.id);

      if (error) throw error;

      const updatedProject = {
        ...currentProject,
        project_data: version.projectData,
        version: version.version,
      };

      setCurrentProject(updatedProject);
      toast.success(`Restored to version ${version.version}`);
      return true;
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
      return false;
    }
  }, [user, currentProject, projectVersions, createVersion]);

  // Compare two versions
  const compareVersions = useCallback((v1Id: string, v2Id: string) => {
    const v1 = projectVersions.find(v => v.id === v1Id);
    const v2 = projectVersions.find(v => v.id === v2Id);

    if (!v1 || !v2) return null;

    return {
      v1,
      v2,
      tracksDiff: {
        added: v2.projectData.tracks.length - v1.projectData.tracks.length,
        modified: 0, // TODO: Deep comparison
      },
      bpmChange: v2.projectData.bpm - v1.projectData.bpm,
      keyChange: v1.projectData.keySignature !== v2.projectData.keySignature,
    };
  }, [projectVersions]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !currentProject) return;

    const autoSaveInterval = setInterval(() => {
      if (currentProject.project_data) {
        saveProject(currentProject.project_data);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveEnabled, currentProject, saveProject]);

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setProjectStats(null);
    }
  }, [user, loadProjects]);

  return {
    projects,
    currentProject,
    loading,
    projectStats,
    autoSaveEnabled,
    lastSaved,
    projectVersions,
    setAutoSaveEnabled,
    loadProjects,
    createProject,
    saveProject,
    loadProject,
    deleteProject,
    duplicateProject,
    setCurrentProject,
    // Version control
    createVersion,
    loadVersions,
    restoreVersion,
    compareVersions,
  };
};