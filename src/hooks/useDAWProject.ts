/**
 * useDAWProject - Project data management hook
 * Handles loading, saving, and updating project data with undo/redo
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import backend from '@/backend/client';
import type { DawProjectData, DawProjectDataV2, DawTrackV2 } from '@/types/daw';
import { useUndoRedo } from '@/hooks/useUndoRedo';

const defaultProjectData: DawProjectDataV2 = {
  bpm: 118,
  keySignature: 'F#m',
  tracks: [
    {
      id: `track_${Date.now()}_1`,
      type: 'midi',
      name: 'Log Drums',
      instrument: 'Signature Log Drum',
      clips: [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: true,
      color: 'bg-red-500',
      automationLanes: [],
    } as DawTrackV2,
    {
      id: `track_${Date.now()}_2`,
      type: 'midi',
      name: 'Piano Chords',
      instrument: 'Amapiano Piano',
      clips: [],
      mixer: { volume: 0.7, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: false,
      color: 'bg-blue-500',
      automationLanes: [],
    } as DawTrackV2,
  ],
  masterVolume: 0.8,
  automationLanes: [],
  samples: [],
};

export function useDAWProject() {
  const queryClient = useQueryClient();
  
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();
  const [projectName, setProjectName] = useState("Untitled Project");
  const [projectData, setProjectData] = useState<DawProjectData | null>(null);
  const hasInitializedProjectDataRef = useRef(false);
  
  // Undo/Redo System
  const undoRedoControls = useUndoRedo(projectData, 50);
  
  // Enhanced project data setter with undo/redo support
  const setProjectDataWithHistory = useCallback((newData: DawProjectData | null, description?: string) => {
    if (newData) {
      undoRedoControls.pushState(newData, description);
    }
    setProjectData(newData);
  }, [undoRedoControls]);
  
  // Fetch project list
  const { 
    data: projectsList, 
    isLoading: isLoadingList, 
    isError: isListError, 
    error: listError 
  } = useQuery({
    queryKey: ['dawProjectsList'],
    queryFn: () => backend.music.listProjects(),
  });
  
  // Create default project mutation
  const createDefaultProjectMutation = useMutation({
    mutationFn: () => backend.music.saveProject({
      name: "My First Amapiano Project",
      projectData: defaultProjectData,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dawProjectsList'] });
      setActiveProjectId(data.projectId);
      toast.info("Creating your first project...");
    },
  });
  
  // Effect to decide which project to load or create
  useEffect(() => {
    if (isLoadingList || createDefaultProjectMutation.isPending) return;
    
    if (projectsList) {
      if (projectsList.projects && projectsList.projects.length > 0) {
        if (!activeProjectId) {
          setActiveProjectId(projectsList.projects[0].id);
        }
      } else if (!createDefaultProjectMutation.isPending && !createDefaultProjectMutation.isSuccess) {
        createDefaultProjectMutation.mutate();
      }
    }
  }, [projectsList, isLoadingList, activeProjectId, createDefaultProjectMutation]);
  
  // Load active project data
  const { 
    data: loadedProject, 
    isLoading: isLoadingProject, 
    isError: isProjectError, 
    error: projectError 
  } = useQuery({
    queryKey: ['dawProject', activeProjectId],
    queryFn: () => backend.music.loadProject({ projectId: activeProjectId! }),
    enabled: !!activeProjectId,
  });
  
  // Reset initial load guard when switching projects
  useEffect(() => {
    hasInitializedProjectDataRef.current = false;
  }, [activeProjectId]);
  
  // Sync loaded data into local state
  useEffect(() => {
    if (loadedProject && !hasInitializedProjectDataRef.current) {
      const migratedProjectData = {
        ...loadedProject.projectData,
        tracks: loadedProject.projectData.tracks.map(track => ({
          ...track,
          automationLanes: (track as any).automationLanes || [],
          ...((track as any).type === 'audio' && { recordings: (track as any).recordings || [] })
        } as DawTrackV2))
      };
      
      setProjectDataWithHistory(migratedProjectData, 'Project loaded');
      setProjectName(loadedProject.name);
      hasInitializedProjectDataRef.current = true;
    }
  }, [loadedProject, setProjectDataWithHistory]);
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: { name: string; projectData: DawProjectData; projectId?: string }) => 
      backend.music.saveProject(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['dawProject', data.projectId], (oldData: any) => ({
        ...oldData, 
        name: data.name, 
        version: data.version, 
        updatedAt: data.lastSaved
      }));
      queryClient.invalidateQueries({ queryKey: ['dawProjectsList'] });
      toast.success(`Project "${data.name}" saved successfully.`);
    },
    onError: (error: any) => {
      toast.error("Save Failed", { description: error.message });
    },
  });
  
  const handleSave = useCallback(() => {
    if (!projectData || !activeProjectId) {
      toast.error("No project data to save.");
      return;
    }
    saveMutation.mutate({
      name: projectName,
      projectData: projectData,
      projectId: activeProjectId,
    });
  }, [projectData, activeProjectId, projectName, saveMutation]);
  
  const handleUndo = useCallback(() => {
    const previousState = undoRedoControls.undo();
    if (previousState) {
      setProjectData(previousState);
      toast.info("Undid last action");
    }
  }, [undoRedoControls]);
  
  const handleRedo = useCallback(() => {
    const nextState = undoRedoControls.redo();
    if (nextState) {
      setProjectData(nextState);
      toast.info("Redid last action");
    }
  }, [undoRedoControls]);
  
  return {
    // State
    activeProjectId,
    projectName,
    projectData,
    projectsList,
    defaultProjectData,
    
    // Loading states
    isLoadingList,
    isLoadingProject,
    isListError,
    isProjectError,
    listError,
    projectError,
    isSaving: saveMutation.isPending,
    isCreatingDefault: createDefaultProjectMutation.isPending,
    createDefaultError: createDefaultProjectMutation.isError ? createDefaultProjectMutation.error : null,
    
    // Setters
    setActiveProjectId,
    setProjectName,
    setProjectData,
    setProjectDataWithHistory,
    
    // Actions
    handleSave,
    handleUndo,
    handleRedo,
    undoRedoControls,
  };
}

export default useDAWProject;
