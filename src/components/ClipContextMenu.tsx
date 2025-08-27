import React from 'react';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut
} from '@/components/ui/context-menu';
import { Copy, Scissors, Trash2, Volume2, Zap, Music } from 'lucide-react';
import type { MidiClip, AudioClip } from '@/types/daw';

type Clip = MidiClip | AudioClip;

interface ClipContextMenuProps {
  clip: Clip;
  children: React.ReactNode;
  onDuplicate?: (clipId: string) => void;
  onSplit?: (clipId: string, position: number) => void;
  onDelete?: (clipId: string) => void;
  onNormalize?: (clipId: string) => void;
  onQuantize?: (clipId: string) => void;
  onPitchShift?: (clipId: string) => void;
}

export const ClipContextMenu: React.FC<ClipContextMenuProps> = ({
  clip,
  children,
  onDuplicate,
  onSplit,
  onDelete,
  onNormalize,
  onQuantize,
  onPitchShift
}) => {
  const handleDuplicate = () => onDuplicate?.(clip.id);
  const handleSplit = () => onSplit?.(clip.id, clip.startTime + clip.duration / 2);
  const handleDelete = () => onDelete?.(clip.id);
  const handleNormalize = () => onNormalize?.(clip.id);
  const handleQuantize = () => onQuantize?.(clip.id);
  const handlePitchShift = () => onPitchShift?.(clip.id);

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate Clip
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleSplit}>
          <Scissors className="w-4 h-4 mr-2" />
          Split at Center
          <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {('notes' in clip) && (
          <>
            <ContextMenuItem onClick={handleQuantize}>
              <Zap className="w-4 h-4 mr-2" />
              Quantize Notes
              <ContextMenuShortcut>Q</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem onClick={handlePitchShift}>
              <Music className="w-4 h-4 mr-2" />
              Transpose
            </ContextMenuItem>
          </>
        )}
        
        {('audioUrl' in clip) && (
          <ContextMenuItem onClick={handleNormalize}>
            <Volume2 className="w-4 h-4 mr-2" />
            Normalize Audio
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Clip
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};