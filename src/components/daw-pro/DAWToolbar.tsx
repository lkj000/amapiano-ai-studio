/**
 * DAW Toolbar Component
 * Top toolbar with project settings, view toggles, and tools
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Save, FolderOpen, Settings, Undo2, Redo2, 
  Music, Grid3X3, SlidersHorizontal, Folder,
  Plug, ZoomIn, ZoomOut, Magnet, ChevronDown,
  FileAudio, Plus, Download, Upload, ArrowUpDown
} from 'lucide-react';
import type { DAWProject } from '@/pages/AmapianoPro';

interface DAWToolbarProps {
  project: DAWProject;
  onUpdateProject: (updates: Partial<DAWProject>) => void;
  activeView: 'playlist' | 'pianoroll' | 'mixer';
  onViewChange: (view: 'playlist' | 'pianoroll' | 'mixer') => void;
  onToggleBrowser: () => void;
  onToggleVSTRack: () => void;
  showBrowser: boolean;
  showVSTRack: boolean;
  onTranspose: (semitones: number) => void;
  snap: 'none' | 'step' | 'beat' | 'bar';
  onSnapChange: (snap: 'none' | 'step' | 'beat' | 'bar') => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = ['major', 'minor', 'dorian', 'phrygian', 'mixolydian', 'blues', 'pentatonic'];

export const DAWToolbar: React.FC<DAWToolbarProps> = ({
  project,
  onUpdateProject,
  activeView,
  onViewChange,
  onToggleBrowser,
  onToggleVSTRack,
  showBrowser,
  showVSTRack,
  onTranspose,
  snap,
  onSnapChange,
  zoom,
  onZoomChange,
}) => {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-2 gap-1">
      {/* File Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            File <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Plus className="h-4 w-4 mr-2" /> New Project
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderOpen className="h-4 w-4 mr-2" /> Open Project
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Save className="h-4 w-4 mr-2" /> Save Project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Upload className="h-4 w-4 mr-2" /> Import Audio
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="h-4 w-4 mr-2" /> Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            Edit <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Undo2 className="h-4 w-4 mr-2" /> Undo
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Redo2 className="h-4 w-4 mr-2" /> Redo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onTranspose(1)}>
            <ArrowUpDown className="h-4 w-4 mr-2" /> Transpose +1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTranspose(-1)}>
            <ArrowUpDown className="h-4 w-4 mr-2" /> Transpose -1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTranspose(12)}>
            <ArrowUpDown className="h-4 w-4 mr-2" /> Transpose +12 (Octave Up)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTranspose(-12)}>
            <ArrowUpDown className="h-4 w-4 mr-2" /> Transpose -12 (Octave Down)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Undo/Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Project Name */}
      <Input
        value={project.name}
        onChange={(e) => onUpdateProject({ name: e.target.value })}
        className="w-40 h-8 text-sm bg-muted"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Key & Scale */}
      <div className="flex items-center gap-1">
        <Select value={project.key} onValueChange={(key) => onUpdateProject({ key })}>
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KEYS.map(key => (
              <SelectItem key={key} value={key}>{key}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={project.scale} onValueChange={(scale) => onUpdateProject({ scale })}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCALES.map(scale => (
              <SelectItem key={scale} value={scale}>{scale}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Snap */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={snap !== 'none' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onSnapChange(snap === 'none' ? 'step' : 'none')}
            >
              <Magnet className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Snap to Grid</TooltipContent>
        </Tooltip>

        <Select value={snap} onValueChange={(v) => onSnapChange(v as typeof snap)}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="step">Step</SelectItem>
            <SelectItem value="beat">Beat</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onZoomChange(Math.min(4, zoom + 0.25))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* View Toggles */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={showBrowser ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={onToggleBrowser}
            >
              <Folder className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Browser</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={showVSTRack ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={onToggleVSTRack}
            >
              <Plug className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>VST Rack</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeView === 'playlist' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onViewChange('playlist')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Playlist</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeView === 'pianoroll' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onViewChange('pianoroll')}
            >
              <Music className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Piano Roll</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeView === 'mixer' ? 'default' : 'ghost'} 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onViewChange('mixer')}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mixer</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Settings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </div>
  );
};
