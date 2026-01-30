/**
 * DAWHeader - Top header bar with project controls and tools
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Music,
  Save,
  Settings,
  FolderOpen,
  Download,
  Sliders,
  Piano,
  Zap,
  Mic,
  Wand2,
  Activity,
  Users,
  Gamepad2,
  BookOpen,
  Loader2,
} from 'lucide-react';
import FeatureToolbar from './FeatureToolbar';
import type { DawProjectDataV2, DawProjectData, MidiNote } from '@/types/daw';
import type { InstrumentSpec } from '@/components/instruments';

interface DAWHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  onOpenSettings: () => void;
  onOpenProject: () => void;
  onExport: () => void;
  
  // Panel toggles
  showMixer: boolean;
  onToggleMixer: () => void;
  showPianoRoll: boolean;
  onTogglePianoRoll: () => void;
  showEffects: boolean;
  onToggleEffects: () => void;
  showAudioRecording: boolean;
  onToggleAudioRecording: () => void;
  showMastering: boolean;
  onToggleMastering: () => void;
  showAutomation: boolean;
  onToggleAutomation: () => void;
  showCommunity: boolean;
  onToggleCommunity: () => void;
  showPluginSidebar: boolean;
  onTogglePluginSidebar: () => void;
  showGhostProducer: boolean;
  onToggleGhostProducer: () => void;
  showTutorials: boolean;
  onToggleTutorials: () => void;
  
  selectedTrackId: string | null;
  
  // FeatureToolbar props
  projectData: DawProjectDataV2;
  onProjectUpdate: (data: DawProjectData) => void;
  onLoadProject: (data: DawProjectData) => void;
  onMidiGenerated: (notes: MidiNote[]) => void;
  activeProjectId?: string;
  selectedNotes: MidiNote[];
  onNotesUpdate: (notes: MidiNote[]) => void;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedInstruments: InstrumentSpec[];
  onInstrumentsChange: (instruments: InstrumentSpec[]) => void;
}

export const DAWHeader: React.FC<DAWHeaderProps> = ({
  projectName,
  onProjectNameChange,
  onSave,
  isSaving,
  onOpenSettings,
  onOpenProject,
  onExport,
  showMixer,
  onToggleMixer,
  showPianoRoll,
  onTogglePianoRoll,
  showEffects,
  onToggleEffects,
  showAudioRecording,
  onToggleAudioRecording,
  showMastering,
  onToggleMastering,
  showAutomation,
  onToggleAutomation,
  showCommunity,
  onToggleCommunity,
  showPluginSidebar,
  onTogglePluginSidebar,
  showGhostProducer,
  onToggleGhostProducer,
  showTutorials,
  onToggleTutorials,
  selectedTrackId,
  projectData,
  onProjectUpdate,
  onLoadProject,
  onMidiGenerated,
  activeProjectId,
  selectedNotes,
  onNotesUpdate,
  selectedRegion,
  onRegionChange,
  selectedInstruments,
  onInstrumentsChange,
}) => {
  return (
    <div className="border-b border-border p-3 md:p-4">
      {/* Top row - Project info and essential actions */}
      <div className="flex items-center justify-between gap-2 mb-3 md:mb-0">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <Music className="w-5 h-5 md:w-6 md:h-6 text-primary flex-shrink-0" />
            <Input 
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              className="text-base md:text-xl font-bold bg-transparent border-0 p-0 h-auto focus-visible:ring-0 min-w-0"
            />
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">Professional DAW</Badge>
        </div>
        
        {/* Essential buttons */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving} className="h-8 md:h-9">
            {isSaving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4" />}
            <span className="hidden sm:inline ml-2">Save</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSettings} className="h-8 md:h-9">
            <Settings className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>

      {/* Second row - Tool buttons */}
      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={onOpenProject} className="h-8">
          <FolderOpen className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Open</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="h-8">
          <Download className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Export</span>
        </Button>
        
        <Separator orientation="vertical" className="h-6 hidden md:block" />
        
        {/* Feature Toolbar */}
        <div className="overflow-x-auto">
          <FeatureToolbar
            currentProject={projectData}
            onProjectUpdate={onProjectUpdate}
            onLoadProject={onLoadProject}
            onMidiGenerated={onMidiGenerated}
            projectId={activeProjectId}
            projectName={projectName}
            currentUser={{
              id: 'user-1',
              name: 'Producer',
              avatar: undefined,
            }}
            selectedNotes={selectedNotes}
            onNotesUpdate={onNotesUpdate}
            selectedRegion={selectedRegion}
            onRegionChange={onRegionChange}
            selectedInstruments={selectedInstruments}
            onInstrumentsChange={onInstrumentsChange}
          />
        </div>
        
        <Separator orientation="vertical" className="h-6 hidden lg:block" />
        
        {/* Primary tool buttons */}
        <Button variant="outline" size="sm" onClick={onToggleMixer} className="h-8">
          <Sliders className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Mixer</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onTogglePianoRoll} disabled={!selectedTrackId} className="h-8">
          <Piano className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Piano Roll</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleEffects} disabled={!selectedTrackId} className="h-8 hidden sm:inline-flex">
          <Zap className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Effects</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleAudioRecording} disabled={!selectedTrackId} className="h-8 hidden sm:inline-flex">
          <Mic className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Record</span>
        </Button>
        <Button 
          size="sm" 
          onClick={onToggleMastering} 
          className="h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
        >
          <Wand2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Master</span>
        </Button>
        
        {/* More tools dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background z-50">
            <DropdownMenuItem onClick={onToggleAutomation} disabled={!selectedTrackId}>
              <Activity className="w-4 h-4 mr-2" />
              Automation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleCommunity}>
              <Users className="w-4 h-4 mr-2" />
              Community
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTogglePluginSidebar}>
              <Gamepad2 className="w-4 h-4 mr-2" />
              Plugins
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleGhostProducer}>
              <Zap className="w-4 h-4 mr-2" />
              Ghost Producer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleTutorials}>
              <BookOpen className="w-4 h-4 mr-2" />
              Tutorials
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleMastering}>
              <Wand2 className="w-4 h-4 mr-2" />
              Master & Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DAWHeader;
