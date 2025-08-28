import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';

interface HeaderProps {
  projectName: string;
  onNewProject: () => void;
  onLoadProject: (projectId: string) => void;
  onSaveProject: () => void;
  onDeleteProject: () => void;
}

export function Header({
  projectName,
  onNewProject,
  onLoadProject,
  onSaveProject,
  onDeleteProject
}: HeaderProps) {
  return (
    <div className="h-15 bg-background border-b border-border flex items-center justify-between px-4">
      {/* Left: Project Controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onNewProject}>
          New
        </Button>
        <Button variant="outline" size="sm" onClick={() => onLoadProject('dummy')}>
          Open
        </Button>
        <Button variant="outline" size="sm" onClick={onSaveProject}>
          Save
        </Button>
        <div className="ml-4 text-sm font-medium">
          {projectName}
        </div>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Pause className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Square className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Tempo/Time */}
      <div className="flex items-center gap-4 text-sm">
        <div>120 BPM</div>
        <div>00:00:00</div>
      </div>
    </div>
  );
}