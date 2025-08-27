import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo, Redo } from 'lucide-react';
import type { UndoRedoState } from '@/hooks/useUndoRedo';

interface UndoRedoControlsProps {
  undoRedoState: UndoRedoState;
  onUndo: () => void;
  onRedo: () => void;
}

export default function UndoRedoControls({ undoRedoState, onUndo, onRedo }: UndoRedoControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={onUndo}
        disabled={!undoRedoState.canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onRedo}
        disabled={!undoRedoState.canRedo}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </Button>
      <span className="text-xs text-muted-foreground ml-2">
        {undoRedoState.currentIndex + 1} / {undoRedoState.historyLength}
      </span>
    </div>
  );
}