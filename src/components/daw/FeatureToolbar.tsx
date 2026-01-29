import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Scissors, Gauge, MapPin, Music2, Activity, Drum, Piano } from 'lucide-react';
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
import ProjectTemplatesDialog from './ProjectTemplatesDialog';
import AdvancedToolsMenu from './AdvancedToolsMenu';
import { SourceSeparationEngine } from '@/components/ai/SourceSeparationEngine';
import { AmapianoSwingQuantizer } from './AmapianoSwingQuantizer';
import { AuthenticityMeter } from './AuthenticityMeter';
import { RegionalStyleSelector } from './RegionalStyleSelector';
import { VelocityPatternGenerator } from './VelocityPatternGenerator';
import { LogDrumPitchEnvelopeEditor } from './LogDrumPitchEnvelopeEditor';
import { EnhancedInstrumentSelector, type InstrumentSpec } from '@/components/instruments';
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
  selectedNotes?: MidiNote[];
  onNotesUpdate?: (notes: MidiNote[]) => void;
  onRegionChange?: (region: string) => void;
  selectedRegion?: string;
  onInstrumentsChange?: (instruments: InstrumentSpec[]) => void;
  selectedInstruments?: InstrumentSpec[];
}

const FeatureToolbar: React.FC<FeatureToolbarProps> = ({
  currentProject,
  onProjectUpdate,
  onLoadProject,
  onMidiGenerated,
  projectId = 'default-project',
  projectName = 'Untitled Project',
  currentUser,
  selectedNotes = [],
  onNotesUpdate,
  onRegionChange,
  selectedRegion = 'johannesburg',
  onInstrumentsChange,
  selectedInstruments = [],
}) => {
  const [showStemSeparation, setShowStemSeparation] = useState(false);
  const [showSwingQuantizer, setShowSwingQuantizer] = useState(false);
  const [showAuthenticityMeter, setShowAuthenticityMeter] = useState(false);
  const [showRegionalStyle, setShowRegionalStyle] = useState(false);
  const [showVelocityPattern, setShowVelocityPattern] = useState(false);
  const [showLogDrumEditor, setShowLogDrumEditor] = useState(false);
  const [showInstrumentSelector, setShowInstrumentSelector] = useState(false);

  return (
    <div className="flex items-center gap-2 p-2 bg-background/95 border-b flex-wrap">
      <CloudProjectManager
        currentProject={currentProject}
        onLoadProject={onLoadProject}
      />

      <Separator orientation="vertical" className="h-8" />

      <ProjectTemplatesDialog
        currentProject={currentProject}
        onLoadTemplate={(projectData) => {
          if (onLoadProject) {
            onLoadProject(projectData);
          }
        }}
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

      {/* Advanced Tools Menu - Wires isolated components */}
      <AdvancedToolsMenu />

      <Separator orientation="vertical" className="h-8" />
      <Dialog open={showInstrumentSelector} onOpenChange={setShowInstrumentSelector}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Piano className="w-4 h-4 mr-2" />
            Instruments
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Instrument Selector</DialogTitle>
            <DialogDescription>
              Select and configure instruments for your production
            </DialogDescription>
          </DialogHeader>
          <EnhancedInstrumentSelector
            selectedInstruments={selectedInstruments}
            onInstrumentsChange={(instruments) => {
              if (onInstrumentsChange) onInstrumentsChange(instruments);
            }}
            maxInstruments={12}
          />
        </DialogContent>
      </Dialog>

      <Separator orientation="vertical" className="h-8" />

      {/* ML-Enhanced Tools */}
      <Dialog open={showSwingQuantizer} onOpenChange={setShowSwingQuantizer}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Music2 className="w-4 h-4 mr-2" />
            Swing
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <AmapianoSwingQuantizer
            notes={selectedNotes}
            onQuantize={(notes) => {
              if (onNotesUpdate) onNotesUpdate(notes);
              setShowSwingQuantizer(false);
            }}
            bpm={currentProject.bpm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showVelocityPattern} onOpenChange={setShowVelocityPattern}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Velocity
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <VelocityPatternGenerator
            notes={selectedNotes}
            onApplyPattern={(notes) => {
              if (onNotesUpdate) onNotesUpdate(notes);
              setShowVelocityPattern(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showLogDrumEditor} onOpenChange={setShowLogDrumEditor}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Drum className="w-4 h-4 mr-2" />
            Log Drum
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <LogDrumPitchEnvelopeEditor />
        </DialogContent>
      </Dialog>

      <Dialog open={showRegionalStyle} onOpenChange={setShowRegionalStyle}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2" />
            Region
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <RegionalStyleSelector
            selectedRegion={selectedRegion as any}
            onRegionChange={(region) => {
              if (onRegionChange) onRegionChange(region);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAuthenticityMeter} onOpenChange={setShowAuthenticityMeter}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Gauge className="w-4 h-4 mr-2" />
            Score
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <AuthenticityMeter
            region={selectedRegion}
            elementScores={{
              logDrum: 0.75,
              piano: 0.82,
              percussion: 0.68,
              bass: 0.71,
            }}
          />
        </DialogContent>
      </Dialog>

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
