/**
 * useDAWClipHandlers - Clip manipulation handlers
 * Handles clip update, duplicate, split, delete operations
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { DawProjectData, DawTrack, MidiClip, AudioClip } from '@/types/daw';
import type { UndoRedoControls } from '@/hooks/useUndoRedo';

interface UseDAWClipHandlersProps {
  projectData: DawProjectData | null;
  setProjectData: (data: DawProjectData | null) => void;
  undoRedoControls: UndoRedoControls;
  isDragging: boolean;
}

export function useDAWClipHandlers({
  projectData,
  setProjectData,
  undoRedoControls,
  isDragging,
}: UseDAWClipHandlersProps) {

  const handleUpdateClip = useCallback((
    trackId: string, 
    clipId: string, 
    updates: Partial<MidiClip | AudioClip>
  ) => {
    if (!projectData) return;
    
    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => 
        t.id === trackId 
          ? { 
              ...t, 
              clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c) 
            } as DawTrack 
          : t
      )
    };
    
    // Only push to history for non-drag operations
    if (!isDragging) {
      const track = projectData.tracks.find(t => t.id === trackId);
      const clip = track?.clips.find(c => c.id === clipId);
      if (track && clip) {
        undoRedoControls.pushState(newData, `Updated clip "${clip.name}"`);
      }
    }
    
    setProjectData(newData);
  }, [projectData, setProjectData, isDragging, undoRedoControls]);

  const handleClipDuplicate = useCallback((clipId: string) => {
    if (!projectData) return;
    
    const track = projectData.tracks.find(t => t.clips.some(c => c.id === clipId));
    if (!track) return;
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const duplicatedClip = {
      ...clip,
      id: `clip_${Date.now()}`,
      name: `${clip.name} Copy`,
      startTime: clip.startTime + clip.duration
    } as MidiClip | AudioClip;
    
    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => 
        t.id === track.id 
          ? { ...t, clips: [...t.clips, duplicatedClip] } as DawTrack 
          : t
      )
    };
    
    undoRedoControls.pushState(newData, `Duplicated clip "${clip.name}"`);
    setProjectData(newData);
    toast.success(`Clip "${clip.name}" duplicated`);
  }, [projectData, setProjectData, undoRedoControls]);

  const handleClipSplit = useCallback((clipId: string, position: number) => {
    if (!projectData) return;
    
    const track = projectData.tracks.find(t => t.clips.some(c => c.id === clipId));
    if (!track) return;
    
    const clipIndex = track.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return;
    
    const clip = track.clips[clipIndex];
    const splitPoint = position - clip.startTime;
    
    if (splitPoint <= 0 || splitPoint >= clip.duration) return;
    
    const firstPart = { ...clip, duration: splitPoint };
    const secondPart = {
      ...clip,
      id: `clip_${Date.now()}`,
      name: `${clip.name} (2)`,
      startTime: position,
      duration: clip.duration - splitPoint,
      ...('notes' in clip ? {
        notes: (clip as MidiClip).notes
          .filter(note => note.startTime >= splitPoint)
          .map(note => ({ ...note, startTime: note.startTime - splitPoint }))
      } : {})
    } as MidiClip | AudioClip;
    
    const newClips = [...track.clips];
    newClips[clipIndex] = firstPart;
    newClips.push(secondPart);
    
    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => 
        t.id === track.id ? { ...t, clips: newClips } as DawTrack : t
      )
    };
    
    undoRedoControls.pushState(newData, `Split clip "${clip.name}"`);
    setProjectData(newData);
    toast.success(`Clip "${clip.name}" split`);
  }, [projectData, setProjectData, undoRedoControls]);

  const handleClipDelete = useCallback((clipId: string) => {
    if (!projectData) return;
    
    const track = projectData.tracks.find(t => t.clips.some(c => c.id === clipId));
    if (!track) return;
    
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => 
        t.id === track.id 
          ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } as DawTrack 
          : t
      )
    };
    
    undoRedoControls.pushState(newData, `Deleted clip "${clip.name}"`);
    setProjectData(newData);
    toast.success(`Clip "${clip.name}" deleted`);
  }, [projectData, setProjectData, undoRedoControls]);

  return {
    handleUpdateClip,
    handleClipDuplicate,
    handleClipSplit,
    handleClipDelete,
  };
}

export default useDAWClipHandlers;
