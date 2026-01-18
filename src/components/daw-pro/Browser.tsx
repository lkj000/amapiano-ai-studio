/**
 * Browser Component
 * Sample/instrument/preset browser with search and categories
 * Now with REAL audio playback using Tone.js
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import * as Tone from 'tone';
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

// Sample configurations for real audio generation
const SAMPLE_CONFIGS: Record<string, { synth: 'membrane' | 'noise' | 'metal' | 'mono' | 'fm'; note?: string; duration?: string; envelope?: Partial<Tone.EnvelopeOptions> }> = {
  'kick-1': { synth: 'membrane', note: 'C1', duration: '8n' },
  'kick-2': { synth: 'membrane', note: 'D1', duration: '8n' },
  'kick-3': { synth: 'membrane', note: 'E1', duration: '16n' },
  'kick-4': { synth: 'membrane', note: 'C1', duration: '8n' },
  'snare-1': { synth: 'noise', duration: '16n', envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 } },
  'snare-2': { synth: 'noise', duration: '16n', envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 } },
  'snare-3': { synth: 'noise', duration: '8n', envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.15 } },
  'hihat-1': { synth: 'metal', note: 'C6', duration: '32n' },
  'hihat-2': { synth: 'metal', note: 'C6', duration: '8n' },
  'hihat-3': { synth: 'noise', duration: '8n', envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 } },
  'perc-1': { synth: 'membrane', note: 'G2', duration: '16n' },
  'perc-2': { synth: 'membrane', note: 'A2', duration: '16n' },
  'perc-3': { synth: 'membrane', note: 'B2', duration: '16n' },
  'bass-1': { synth: 'mono', note: 'C2', duration: '4n' },
  'bass-2': { synth: 'mono', note: 'E1', duration: '4n' },
  'bass-3': { synth: 'mono', note: 'G2', duration: '4n' },
  'loop-1': { synth: 'fm', note: 'C3', duration: '2n' },
  'loop-2': { synth: 'fm', note: 'E3', duration: '2n' },
  'loop-3': { synth: 'fm', note: 'G3', duration: '2n' },
};

// Instrument configurations for real synth playback
const INSTRUMENT_CONFIGS: Record<string, { type: 'fm' | 'am' | 'poly' | 'mono' | 'duo'; notes: string[]; duration: string }> = {
  'toxic': { type: 'fm', notes: ['C4', 'E4', 'G4'], duration: '2n' },
  'purity': { type: 'poly', notes: ['C3', 'E3', 'G3', 'B3'], duration: '2n' },
  'dexed': { type: 'fm', notes: ['C4', 'E4', 'G4', 'B4'], duration: '2n' },
  'nexus': { type: 'poly', notes: ['C3', 'G3', 'C4', 'E4'], duration: '2n' },
  'sylenth': { type: 'duo', notes: ['C4', 'G4'], duration: '2n' },
  'serum': { type: 'fm', notes: ['C3', 'E3', 'G3'], duration: '2n' },
  'pad-analog': { type: 'poly', notes: ['C3', 'E3', 'G3', 'B3'], duration: '1n' },
  'pad-sign': { type: 'am', notes: ['D3', 'F3', 'A3'], duration: '1n' },
  'lead-euro': { type: 'mono', notes: ['C5'], duration: '4n' },
  'lead-machine': { type: 'fm', notes: ['E5'], duration: '4n' },
  'bass-blue': { type: 'mono', notes: ['C2'], duration: '4n' },
  'bass-smooth': { type: 'mono', notes: ['E2'], duration: '4n' },
};

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
  const activeSynthRef = useRef<Tone.ToneAudioNode | null>(null);

  // Cleanup synth on unmount
  useEffect(() => {
    return () => {
      if (activeSynthRef.current) {
        activeSynthRef.current.dispose();
      }
    };
  }, []);

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

  const stopPreview = useCallback(() => {
    if (activeSynthRef.current) {
      activeSynthRef.current.dispose();
      activeSynthRef.current = null;
    }
    setPreviewingId(null);
  }, []);

  const playSamplePreview = useCallback(async (itemId: string) => {
    await Tone.start();
    stopPreview();
    
    const config = SAMPLE_CONFIGS[itemId];
    if (!config) return;

    setPreviewingId(itemId);
    
    let synth: Tone.ToneAudioNode;
    
    switch (config.synth) {
      case 'membrane':
        synth = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 4,
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 }
        }).toDestination();
        (synth as Tone.MembraneSynth).triggerAttackRelease(config.note || 'C2', config.duration || '8n');
        break;
      case 'noise':
        synth = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: config.envelope || { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
        (synth as Tone.NoiseSynth).triggerAttackRelease(config.duration || '16n');
        break;
      case 'metal':
        synth = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 4000,
          octaves: 1.5
        }).toDestination();
        (synth as Tone.MetalSynth).volume.value = -12;
        (synth as Tone.MetalSynth).triggerAttackRelease(config.note || 'C6', config.duration || '32n');
        break;
      case 'mono':
        synth = new Tone.MonoSynth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
          filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 200, octaves: 3 }
        }).toDestination();
        (synth as Tone.MonoSynth).triggerAttackRelease(config.note || 'C2', config.duration || '4n');
        break;
      case 'fm':
        synth = new Tone.FMSynth({
          harmonicity: 3,
          modulationIndex: 10,
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }
        }).toDestination();
        (synth as Tone.FMSynth).triggerAttackRelease(config.note || 'C3', config.duration || '4n');
        break;
      default:
        return;
    }

    activeSynthRef.current = synth;
    
    // Auto-stop after duration
    setTimeout(() => {
      if (previewingId === itemId) {
        stopPreview();
      }
    }, Tone.Time(config.duration || '4n').toMilliseconds() + 500);
  }, [stopPreview, previewingId]);

  const playInstrumentPreview = useCallback(async (itemId: string) => {
    await Tone.start();
    stopPreview();
    
    const config = INSTRUMENT_CONFIGS[itemId];
    if (!config) return;

    setPreviewingId(itemId);
    
    let synth: Tone.PolySynth | Tone.MonoSynth | Tone.DuoSynth;
    
    switch (config.type) {
      case 'poly':
        synth = new Tone.PolySynth(Tone.Synth, {
          envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 1 }
        }).toDestination();
        synth.volume.value = -6;
        synth.triggerAttackRelease(config.notes, config.duration);
        break;
      case 'fm':
        synth = new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 2,
          modulationIndex: 5,
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 }
        }).toDestination();
        synth.volume.value = -6;
        synth.triggerAttackRelease(config.notes, config.duration);
        break;
      case 'am':
        synth = new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: 2,
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 1 }
        }).toDestination();
        synth.volume.value = -6;
        synth.triggerAttackRelease(config.notes, config.duration);
        break;
      case 'mono':
        synth = new Tone.MonoSynth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
          filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 200, octaves: 4 }
        }).toDestination();
        synth.volume.value = -6;
        synth.triggerAttackRelease(config.notes[0], config.duration);
        break;
      case 'duo':
        synth = new Tone.DuoSynth({
          vibratoAmount: 0.5,
          vibratoRate: 5,
          harmonicity: 1.5,
          voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 } },
          voice1: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 } }
        }).toDestination();
        synth.volume.value = -6;
        synth.triggerAttackRelease(config.notes[0], config.duration);
        break;
      default:
        return;
    }

    activeSynthRef.current = synth;
    
    // Auto-stop after duration
    setTimeout(() => {
      if (previewingId === itemId) {
        stopPreview();
      }
    }, Tone.Time(config.duration).toMilliseconds() + 500);
  }, [stopPreview, previewingId]);

  const handlePreview = useCallback((item: BrowserItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (previewingId === item.id) {
      stopPreview();
      return;
    }
    
    if (item.type === 'sample') {
      playSamplePreview(item.id);
    } else if (item.type === 'instrument' || item.type === 'preset') {
      playInstrumentPreview(item.id);
    }
  }, [previewingId, stopPreview, playSamplePreview, playInstrumentPreview]);

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
