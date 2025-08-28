import { useState, useCallback } from 'react';
import { DawProject, DawProjectData, DawTrack } from '@/types/daw';

export interface UseProjectReturn {
  loadedProject: DawProject | null;
  createProject: () => void;
  loadProject: (projectId: string) => void;
  saveProject: (project: DawProject) => void;
  updateProject: (project: DawProject) => void;
  deleteProject: (projectId: string) => void;
}

export function useProject(): UseProjectReturn {
  const [loadedProject, setLoadedProject] = useState<DawProject | null>(() => {
    // Initialize with a default project
    const defaultProjectData: DawProjectData = {
      bpm: 120,
      keySignature: 'C',
      timeSignature: '4/4',
      tracks: [],
      masterVolume: 0.8
    };

    return {
      id: 'default-project',
      user_id: 'default-user',
      name: 'New Project',
      version: 1,
      bpm: 120,
      key_signature: 'C',
      time_signature: '4/4',
      project_data: defaultProjectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  const createProject = useCallback(() => {
    const defaultProjectData: DawProjectData = {
      bpm: 120,
      keySignature: 'C',
      timeSignature: '4/4',
      tracks: [],
      masterVolume: 0.8
    };

    const newProject: DawProject = {
      id: `project-${Date.now()}`,
      user_id: 'default-user',
      name: 'New Project',
      version: 1,
      bpm: 120,
      key_signature: 'C',
      time_signature: '4/4',
      project_data: defaultProjectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setLoadedProject(newProject);
  }, []);

  const loadProject = useCallback((projectId: string) => {
    // In a real implementation, this would load from storage
    console.log('Loading project:', projectId);
  }, []);

  const saveProject = useCallback((project: DawProject) => {
    // In a real implementation, this would save to storage
    console.log('Saving project:', project);
    setLoadedProject({ ...project, updated_at: new Date().toISOString() });
  }, []);

  const updateProject = useCallback((project: DawProject) => {
    setLoadedProject({ ...project, updated_at: new Date().toISOString() });
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    // In a real implementation, this would delete from storage
    console.log('Deleting project:', projectId);
    createProject(); // Create a new project after deletion
  }, [createProject]);

  return {
    loadedProject,
    createProject,
    loadProject,
    saveProject,
    updateProject,
    deleteProject
  };
}