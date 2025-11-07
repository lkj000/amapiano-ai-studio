import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Scissors } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CloudProjectManager from './CloudProjectManager';
import CollaborationTools from './CollaborationTools';
import AudioToMidiConverter from './AudioToMidiConverter';
import ProjectVersionHistory from './ProjectVersionHistory';
import ProjectSharingManager from './ProjectSharingManager';
import { SourceSeparationEngine } from '@/components/ai/SourceSeparationEngine';
import type { DawProjectDataV2 } from '@/types/daw';
import type { MidiNote } from '@/types/daw';

interface FeatureToolbarProps {
  currentProject: DawProjectDataV2;
  onProjectUpdate: (data: DawProjectDataV2) => void;
  onLoadProject?: (project: DawProjectDataV2) => void;
  onMidiGenerated?: (midiData: MidiNote[]) => void;
  projectId?: string;
  projectName?: string;
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const FeatureToolbar: React.FC<FeatureToolbarProps> = ({
  currentProject,
  onProjectUpdate,
  onLoadProject,
  onMidiGenerated,
  projectId = 'default-project',
  projectName = 'Untitled Project',
  currentUser,
}) => {
  const [showStemSeparation, setShowStemSeparation] = useState(false);

  return (
    <div className="flex items-center gap-2 p-2 bg-background/95 border-b">
      <CloudProjectManager
        currentProject={currentProject}
        onLoadProject={onLoadProject}
      />

      <Separator orientation="vertical" className="h-8" />

      <CollaborationTools
        projectId={projectId}
        projectName={projectName}
        projectData={currentProject}
        onProjectUpdate={onProjectUpdate}
        currentUser={currentUser}
      />

      <Separator orientation="vertical" className="h-8" />

      <ProjectVersionHistory
        projectId={projectId}
        onRestore={onLoadProject || (() => {})}
      />

      <ProjectSharingManager
        projectId={projectId}
        projectName={projectName}
      />

      <Separator orientation="vertical" className="h-8" />

      <Dialog open={showStemSeparation} onOpenChange={setShowStemSeparation}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Scissors className="w-4 h-4 mr-2" />
            Stem Separation
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>AI Stem Separation</DialogTitle>
            <DialogDescription>
              Separate audio into individual instrument stems using AI
            </DialogDescription>
          </DialogHeader>
          <SourceSeparationEngine />
        </DialogContent>
      </Dialog>

      <div className="ml-auto">
        <AudioToMidiConverter onMidiGenerated={onMidiGenerated} />
      </div>
    </div>
  );
};

export default FeatureToolbar;
