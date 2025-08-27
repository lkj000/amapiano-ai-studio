import { useState, useCallback, useRef } from 'react';
import type { DawProjectData } from '@/types/daw';

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  currentIndex: number;
  historyLength: number;
}

export interface UndoRedoControls {
  undo: () => DawProjectData | null;
  redo: () => DawProjectData | null;
  pushState: (state: DawProjectData, description?: string) => void;
  clearHistory: () => void;
  getState: () => UndoRedoState;
}

interface HistoryEntry {
  state: DawProjectData;
  description: string;
  timestamp: number;
}

export function useUndoRedo(initialState: DawProjectData | null, maxHistorySize: number = 50): UndoRedoControls {
  const historyRef = useRef<HistoryEntry[]>([]);
  const currentIndexRef = useRef(-1);
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    currentIndex: -1,
    historyLength: 0
  });

  // Initialize with initial state
  const initializeHistory = useCallback((state: DawProjectData) => {
    if (historyRef.current.length === 0) {
      historyRef.current = [{
        state: JSON.parse(JSON.stringify(state)),
        description: 'Initial state',
        timestamp: Date.now()
      }];
      currentIndexRef.current = 0;
      updateUndoRedoState();
    }
  }, []);

  const updateUndoRedoState = useCallback(() => {
    setUndoRedoState({
      canUndo: currentIndexRef.current > 0,
      canRedo: currentIndexRef.current < historyRef.current.length - 1,
      currentIndex: currentIndexRef.current,
      historyLength: historyRef.current.length
    });
  }, []);

  const pushState = useCallback((state: DawProjectData, description: string = 'Change') => {
    // Deep clone the state to prevent mutations
    const clonedState = JSON.parse(JSON.stringify(state));
    
    // Initialize if needed
    if (historyRef.current.length === 0) {
      initializeHistory(clonedState);
      return;
    }

    // Remove any future history if we're not at the end
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push({
      state: clonedState,
      description,
      timestamp: Date.now()
    });

    // Limit history size
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current = historyRef.current.slice(-maxHistorySize);
      currentIndexRef.current = Math.min(currentIndexRef.current, historyRef.current.length - 1);
    }

    currentIndexRef.current = historyRef.current.length - 1;
    updateUndoRedoState();
  }, [maxHistorySize, initializeHistory, updateUndoRedoState]);

  const undo = useCallback((): DawProjectData | null => {
    if (currentIndexRef.current <= 0) return null;

    currentIndexRef.current--;
    const entry = historyRef.current[currentIndexRef.current];
    updateUndoRedoState();
    
    // Return a deep clone to prevent mutations
    return JSON.parse(JSON.stringify(entry.state));
  }, [updateUndoRedoState]);

  const redo = useCallback((): DawProjectData | null => {
    if (currentIndexRef.current >= historyRef.current.length - 1) return null;

    currentIndexRef.current++;
    const entry = historyRef.current[currentIndexRef.current];
    updateUndoRedoState();
    
    // Return a deep clone to prevent mutations
    return JSON.parse(JSON.stringify(entry.state));
  }, [updateUndoRedoState]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  const getState = useCallback(() => undoRedoState, [undoRedoState]);

  // Initialize with initial state if provided
  if (initialState && historyRef.current.length === 0) {
    initializeHistory(initialState);
  }

  return {
    undo,
    redo,
    pushState,
    clearHistory,
    getState
  };
}