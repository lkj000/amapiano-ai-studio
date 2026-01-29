/**
 * DAW Header Bar - Professional top bar matching reference design
 * Logo, menus, SI Active, project name, zoom, Save/Export
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Save,
  Download,
  Upload,
  FolderOpen,
  Plus,
  Settings,
  Undo2,
  Redo2,
  Copy,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Search,
  User,
  Activity,
  Music,
  Sparkles,
} from 'lucide-react';

interface DAWHeaderBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  siActive: boolean;
  onSave?: () => void;
  onExport?: () => void;
  onSignIn?: () => void;
  isSignedIn?: boolean;
}

export const DAWHeaderBar: React.FC<DAWHeaderBarProps> = ({
  projectName,
  onProjectNameChange,
  zoom,
  onZoomChange,
  siActive = true,
  onSave,
  onExport,
  onSignIn,
  isSignedIn = false,
}) => {
  return (
    <div className="h-10 bg-card/95 backdrop-blur-sm border-b border-border flex items-center px-2 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg">
            <Music className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AmaPiano
            </span>
            <span className="text-[9px] text-muted-foreground font-medium">
              AI
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 hidden lg:inline-flex">
          Studio Pro
        </Badge>
      </div>

      {/* Menu Bar */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              File <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem><Plus className="w-4 h-4 mr-2" /> New Project</DropdownMenuItem>
            <DropdownMenuItem><FolderOpen className="w-4 h-4 mr-2" /> Open Project</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSave}><Save className="w-4 h-4 mr-2" /> Save</DropdownMenuItem>
            <DropdownMenuItem><Save className="w-4 h-4 mr-2" /> Save As...</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Upload className="w-4 h-4 mr-2" /> Import Audio</DropdownMenuItem>
            <DropdownMenuItem onClick={onExport}><Download className="w-4 h-4 mr-2" /> Export</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              View <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Browser</DropdownMenuItem>
            <DropdownMenuItem>Mixer</DropdownMenuItem>
            <DropdownMenuItem>Piano Roll</DropdownMenuItem>
            <DropdownMenuItem>Playlist</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Effects Rack</DropdownMenuItem>
            <DropdownMenuItem>VST Rack</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              Tools <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Stem Separation</DropdownMenuItem>
            <DropdownMenuItem>Audio to MIDI</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Amapiano Tools</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Swing Quantizer</DropdownMenuItem>
                <DropdownMenuItem>Log Drum Editor</DropdownMenuItem>
                <DropdownMenuItem>Regional Style</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              Create <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>New Pattern</DropdownMenuItem>
            <DropdownMenuItem>New Audio Track</DropdownMenuItem>
            <DropdownMenuItem>New Automation Lane</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Sparkles className="w-4 h-4 mr-2" /> AI Generate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 hidden md:flex">
              Learn <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Tutorials</DropdownMenuItem>
            <DropdownMenuItem>Documentation</DropdownMenuItem>
            <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 hidden md:flex">
              Community <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Browse Presets</DropdownMenuItem>
            <DropdownMenuItem>Share Project</DropdownMenuItem>
            <DropdownMenuItem>Collaborations</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="h-5 mx-2" />

      {/* SI Active Indicator */}
      <Button 
        variant={siActive ? "default" : "outline"} 
        size="sm" 
        className="h-7 px-2 gap-1.5 text-xs"
      >
        <span className="font-semibold">SI</span>
        <span className="hidden sm:inline">Active</span>
        <Activity className="w-3 h-3" />
      </Button>

      <Separator orientation="vertical" className="h-5 mx-2" />

      {/* Project Name */}
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <Input
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="w-32 sm:w-48 h-7 text-xs bg-muted/50 border-muted"
          placeholder="Untitled Project"
        />
      </div>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="hidden lg:flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Redo2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5 mx-2 hidden lg:block" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
        >
          <Search className="w-3.5 h-3.5" />
        </Button>
        <span className="text-[10px] text-muted-foreground w-10 text-center font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => onZoomChange(Math.min(4, zoom + 0.25))}
        >
          <Search className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5 mx-2" />

      {/* Save Button */}
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 px-3 gap-1.5 text-xs"
        onClick={onSave}
      >
        <Save className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Save</span>
      </Button>

      {/* Export Button */}
      <Button 
        variant="default" 
        size="sm" 
        className="h-7 px-3 gap-1.5 text-xs bg-primary"
        onClick={onExport}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Export
      </Button>

      {/* Sign In */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 px-2 gap-1 text-xs"
        onClick={onSignIn}
      >
        <User className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{isSignedIn ? 'Account' : 'Sign In'}</span>
      </Button>

      {/* Settings */}
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};
