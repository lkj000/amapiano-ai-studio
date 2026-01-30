/**
 * useDAWTrackHandlers - Track manipulation handlers
 * Extracts track add/remove/update logic from DAW.tsx
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  DawProjectData, 
  DawTrack, 
  DawTrackV2, 
  MidiNote, 
  MidiClip, 
  AudioClip, 
  AudioRecording,
  AutomationLane 
} from '@/types/daw';
import type { UndoRedoControls } from '@/hooks/useUndoRedo';

interface UseDAWTrackHandlersProps {
  projectData: DawProjectData | null;
  setProjectData: (data: DawProjectData | null) => void;
  undoRedoControls: UndoRedoControls;
  selectedTrackId: string | null;
  setTrackVolume: (trackId: string, volume: number) => void;
  tonePlayback: {
    setTrackVolume: (trackId: string, volume: number) => void;
    setTrackPan: (trackId: string, pan: number) => void;
    setTrackMute: (trackId: string, muted: boolean) => void;
    setTrackSolo: (trackId: string, solo: boolean) => void;
  };
  addTrackEffect: (trackId: string, effectType: any) => Promise<void>;
  removeTrackEffect: (trackId: string, effectId: string) => void;
  getTrackEffects: (trackId: string) => Array<{ id: string; type: string }>;
}

export function useDAWTrackHandlers({
  projectData,
  setProjectData,
  undoRedoControls,
  selectedTrackId,
  setTrackVolume,
  tonePlayback,
  addTrackEffect,
  removeTrackEffect,
  getTrackEffects,
}: UseDAWTrackHandlersProps) {
  
  const updateTrack = useCallback((trackId: string, updates: { name?: string; isArmed?: boolean }) => {
    setProjectData(projectData ? {
      ...projectData,
      tracks: projectData.tracks.map(t => t.id === trackId ? { ...t, ...updates } as DawTrackV2 : t)
    } : null);
    
    if (updates.name && projectData) {
      const newData = {
        ...projectData,
        tracks: projectData.tracks.map(t => t.id === trackId ? { ...t, ...updates } as DawTrackV2 : t)
      };
      undoRedoControls.pushState(newData, `Renamed track to "${updates.name}"`);
    }
  }, [projectData, setProjectData, undoRedoControls]);

  const updateMixer = useCallback((trackId: string, updates: Partial<DawTrack['mixer']>) => {
    if (!projectData) return;
    
    const newTracks = projectData.tracks.map(t => 
      t.id === trackId ? { ...t, mixer: { ...t.mixer, ...updates } } as DawTrackV2 : t
    );
    
    // Update audio engine in real-time
    if (updates.volume !== undefined) {
      setTrackVolume(trackId, updates.volume);
      tonePlayback.setTrackVolume(trackId, updates.volume);
    }
    if (updates.pan !== undefined) {
      tonePlayback.setTrackPan(trackId, updates.pan);
    }
    if (updates.isMuted !== undefined) {
      tonePlayback.setTrackMute(trackId, updates.isMuted);
    }
    if (updates.isSolo !== undefined) {
      tonePlayback.setTrackSolo(trackId, updates.isSolo);
    }

    const newData = { ...projectData, tracks: newTracks };
    
    // Only push state for significant changes
    if (updates.isMuted !== undefined || updates.isSolo !== undefined) {
      const track = projectData.tracks.find(t => t.id === trackId);
      if (track) {
        const action = updates.isMuted ? 'muted' : updates.isSolo ? 'soloed' : 'unmuted';
        undoRedoControls.pushState(newData, `Track "${track.name}" ${action}`);
      }
    }
    
    setProjectData(newData);
  }, [projectData, setProjectData, setTrackVolume, tonePlayback, undoRedoControls]);

  const handleAddTrack = useCallback((instrument?: { name: string; type: string; color: string }) => {
    if (!projectData) return;

    const defaultInstrument = { name: "New Audio Track", type: "audio", color: "bg-gray-500" };
    const inst = instrument || defaultInstrument;

    const newTrack: DawTrackV2 = {
      id: `track_${Date.now()}`,
      type: 'midi' as const,
      name: inst.name,
      instrument: inst.name,
      clips: [],
      mixer: { volume: 0.8, pan: 0, isMuted: false, isSolo: false, effects: [] },
      isArmed: false,
      color: inst.color,
      automationLanes: [],
    } as DawTrackV2;

    const newData = { ...projectData, tracks: [...projectData.tracks, newTrack] };
    undoRedoControls.pushState(newData, `Added track: ${inst.name}`);
    setProjectData(newData);
    toast.success(`Track "${inst.name}" added.`);
  }, [projectData, setProjectData, undoRedoControls]);

  const handleRemoveTrack = useCallback((trackId: string) => {
    if (!projectData) return;
    
    const trackToRemove = projectData.tracks.find(t => t.id === trackId);
    if (trackToRemove) {
      toast.info(`Track "${trackToRemove.name}" removed.`);
      const newData = {
        ...projectData,
        tracks: projectData.tracks.filter(t => t.id !== trackId)
      };
      undoRedoControls.pushState(newData, `Removed track: ${trackToRemove.name}`);
      setProjectData(newData);
    }
  }, [projectData, setProjectData, undoRedoControls]);

  const handleAddEffectToTrack = useCallback(async (effectName: string) => {
    if (!selectedTrackId || !projectData) {
      toast.error("No track selected");
      return;
    }
    
    await addTrackEffect(selectedTrackId, effectName as any);
    
    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => {
        if (t.id === selectedTrackId && !t.mixer.effects.includes(effectName)) {
          toast.success(`Effect "${effectName}" added to track "${t.name}".`);
          return { ...t, mixer: { ...t.mixer, effects: [...t.mixer.effects, effectName] } };
        }
        return t;
      })
    };
    
    const track = projectData.tracks.find(t => t.id === selectedTrackId);
    if (track && !track.mixer.effects.includes(effectName)) {
      undoRedoControls.pushState(newData, `Added ${effectName} to "${track.name}"`);
    }
    setProjectData(newData);
  }, [selectedTrackId, projectData, setProjectData, addTrackEffect, undoRedoControls]);

  const handleRemoveEffectFromTrack = useCallback((trackId: string, effectName: string) => {
    if (!projectData) return;
    
    const trackEffects = getTrackEffects(trackId);
    const effect = trackEffects.find(e => e.type === effectName);
    if (effect) {
      removeTrackEffect(trackId, effect.id);
    }
    
    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => {
        if (t.id === trackId) {
          toast.info(`Effect "${effectName}" removed from track "${t.name}".`);
          return { ...t, mixer: { ...t.mixer, effects: t.mixer.effects.filter(e => e !== effectName) } };
        }
        return t;
      })
    };
    
    const track = projectData.tracks.find(t => t.id === trackId);
    if (track) {
      undoRedoControls.pushState(newData, `Removed ${effectName} from "${track.name}"`);
    }
    setProjectData(newData);
  }, [projectData, setProjectData, getTrackEffects, removeTrackEffect, undoRedoControls]);

  const handleUpdateNotes = useCallback((trackId: string, clipId: string, newNotes: MidiNote[]) => {
    if (!projectData) return;
    
    const newData = {
      ...projectData,
      tracks: projectData.tracks.map(t => {
        if (t.id === trackId && t.type === 'midi') {
          return {
            ...t,
            clips: t.clips.map(c => c.id === clipId ? { ...c, notes: newNotes } : c)
          };
        }
        return t;
      })
    };
    
    const track = projectData.tracks.find(t => t.id === trackId);
    const clip = track?.clips.find(c => c.id === clipId);
    if (track && clip) {
      undoRedoControls.pushState(newData, `Updated notes in "${clip.name}"`);
    }
    setProjectData(newData);
  }, [projectData, setProjectData, undoRedoControls]);

  return {
    updateTrack,
    updateMixer,
    handleAddTrack,
    handleRemoveTrack,
    handleAddEffectToTrack,
    handleRemoveEffectFromTrack,
    handleUpdateNotes,
  };
}

export default useDAWTrackHandlers;
