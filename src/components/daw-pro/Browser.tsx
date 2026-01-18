/**
 * Browser Component
 * Sample/instrument/preset browser with search and categories
 */

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  Search, Folder, FolderOpen, Music, Drum, Piano, 
  Waves, ChevronRight, ChevronDown, Star, Clock, Heart,
  FileAudio, Play, Pause
} from 'lucide-react';

interface BrowserProps {
  onSelectSample: (sample: BrowserItem) => void;
  onLoadInstrument: (instrument: BrowserItem) => void;
}

interface BrowserItem {
  id: string;
  name: string;
  type: 'folder' | 'sample' | 'instrument' | 'preset';
  path?: string;
  children?: BrowserItem[];
  favorite?: boolean;
}

const SAMPLE_LIBRARY: BrowserItem[] = [
  {
    id: 'drums',
    name: 'Drums',
    type: 'folder',
    children: [
      {
        id: 'kicks',
        name: 'Kicks',
        type: 'folder',
        children: [
          { id: 'kick-1', name: 'Kick 808 Deep', type: 'sample' },
          { id: 'kick-2', name: 'Kick Log', type: 'sample' },
          { id: 'kick-3', name: 'Kick Punchy', type: 'sample' },
          { id: 'kick-4', name: 'Kick Amapiano', type: 'sample' },
        ],
      },
      {
        id: 'snares',
        name: 'Snares & Claps',
        type: 'folder',
        children: [
          { id: 'snare-1', name: 'Snare Rim', type: 'sample' },
          { id: 'snare-2', name: 'Clap Tight', type: 'sample' },
          { id: 'snare-3', name: 'Snare Bounce', type: 'sample' },
        ],
      },
      {
        id: 'hihats',
        name: 'Hi-Hats',
        type: 'folder',
        children: [
          { id: 'hihat-1', name: 'HiHat Closed', type: 'sample' },
          { id: 'hihat-2', name: 'HiHat Open', type: 'sample' },
          { id: 'hihat-3', name: 'Shaker 14', type: 'sample' },
        ],
      },
      {
        id: 'percs',
        name: 'Percussion',
        type: 'folder',
        children: [
          { id: 'perc-1', name: 'Perc Tribal', type: 'sample' },
          { id: 'perc-2', name: 'Bongo Hit', type: 'sample' },
          { id: 'perc-3', name: 'Conga Slap', type: 'sample' },
        ],
      },
    ],
  },
  {
    id: 'loops',
    name: 'Loops',
    type: 'folder',
    children: [
      { id: 'loop-1', name: 'Authentic Sounds Loop', type: 'sample' },
      { id: 'loop-2', name: 'Two Cells Collide', type: 'sample' },
      { id: 'loop-3', name: 'Slipper Loop', type: 'sample' },
    ],
  },
  {
    id: 'bass',
    name: 'Bass',
    type: 'folder',
    children: [
      { id: 'bass-1', name: 'Log Bass Deep', type: 'sample' },
      { id: 'bass-2', name: 'Sub Bass 808', type: 'sample' },
      { id: 'bass-3', name: 'Bass Smooth', type: 'sample' },
    ],
  },
];

const INSTRUMENTS: BrowserItem[] = [
  {
    id: 'synths',
    name: 'Synthesizers',
    type: 'folder',
    children: [
      { id: 'toxic', name: 'Toxic Biohazard', type: 'instrument' },
      { id: 'purity', name: 'Purity', type: 'instrument' },
      { id: 'dexed', name: 'Dexed (DX7)', type: 'instrument' },
      { id: 'nexus', name: 'Nexus', type: 'instrument' },
      { id: 'sylenth', name: 'Sylenth1', type: 'instrument' },
      { id: 'serum', name: 'Serum', type: 'instrument' },
    ],
  },
  {
    id: 'presets',
    name: 'Presets',
    type: 'folder',
    children: [
      { id: 'pad-analog', name: 'Analog Pad', type: 'preset' },
      { id: 'pad-sign', name: 'Basic Sign Pad', type: 'preset' },
      { id: 'lead-euro', name: 'Euro Lead', type: 'preset' },
      { id: 'lead-machine', name: 'Machine Lead', type: 'preset' },
      { id: 'bass-blue', name: 'Blue Bass', type: 'preset' },
      { id: 'bass-smooth', name: 'Smooth Bass', type: 'preset' },
    ],
  },
];

export const Browser: React.FC<BrowserProps> = ({
  onSelectSample,
  onLoadInstrument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['drums', 'synths']));
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePreview = (item: BrowserItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingId === item.id) {
      setPreviewingId(null);
    } else {
      setPreviewingId(item.id);
      // Simulate preview playback
      setTimeout(() => setPreviewingId(null), 2000);
    }
  };

  const renderItem = (item: BrowserItem, depth: number = 0) => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedFolders.has(item.id);
    const isFavorite = favorites.has(item.id);
    const isPreviewing = previewingId === item.id;

    const Icon = isFolder 
      ? (isExpanded ? FolderOpen : Folder)
      : item.type === 'instrument' 
        ? Piano 
        : item.type === 'preset'
          ? Waves
          : FileAudio;

    return (
      <div key={item.id}>
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-1 rounded-sm cursor-pointer hover:bg-muted/50 transition-colors group",
            isPreviewing && "bg-primary/20"
          )}
          style={{ paddingLeft: depth * 12 + 4 }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.id);
            } else if (item.type === 'instrument' || item.type === 'preset') {
              onLoadInstrument(item);
            } else {
              onSelectSample(item);
            }
          }}
        >
          {isFolder ? (
            <button onClick={(e) => { e.stopPropagation(); toggleFolder(item.id); }}>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-3" />
          )}
          
          <Icon className={cn(
            "h-3.5 w-3.5",
            isFolder ? "text-primary" : "text-muted-foreground"
          )} />
          
          <span className="text-xs flex-1 truncate">{item.name}</span>

          {!isFolder && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => handlePreview(item, e)}
              >
                {isPreviewing ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => toggleFavorite(item.id, e)}
              >
                <Heart className={cn(
                  "h-3 w-3",
                  isFavorite && "fill-destructive text-destructive"
                )} />
              </Button>
            </div>
          )}
        </div>

        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Quick Access */}
      <div className="flex gap-1 p-2 border-b border-border">
        <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]">
          <Star className="h-3 w-3 mr-1" /> Favorites
        </Button>
        <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]">
          <Clock className="h-3 w-3 mr-1" /> Recent
        </Button>
      </div>

      {/* Browser Tabs */}
      <Tabs defaultValue="samples" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full h-8 p-0.5 rounded-none border-b border-border">
          <TabsTrigger value="samples" className="flex-1 h-full text-xs">
            <Drum className="h-3 w-3 mr-1" /> Samples
          </TabsTrigger>
          <TabsTrigger value="instruments" className="flex-1 h-full text-xs">
            <Piano className="h-3 w-3 mr-1" /> Instruments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="samples" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-1">
              {SAMPLE_LIBRARY.map(item => renderItem(item))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="instruments" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-1">
              {INSTRUMENTS.map(item => renderItem(item))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
