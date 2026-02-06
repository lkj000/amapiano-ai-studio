import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Plus } from 'lucide-react';
import { midiToNoteName } from '@/lib/audio/musicTheory';
import { toast } from 'sonner';
import type { MIDINote } from '@/lib/midi/midiFileBuilder';

export interface BeatboxTrigger {
  id: string;
  sound: string;
  midiNote: number;
  trained: boolean;
  category?: string;
}

export interface InstrumentPreset {
  name: string;
  category: string;
  midiNote: number;
  color: string;
}

const INSTRUMENT_LIBRARY: InstrumentPreset[] = [
  { name: '808 Kick', category: '808 Drums', midiNote: 36, color: 'from-red-500 to-orange-500' },
  { name: '808 Snare', category: '808 Drums', midiNote: 38, color: 'from-orange-500 to-yellow-500' },
  { name: '808 Hi-Hat', category: '808 Drums', midiNote: 42, color: 'from-yellow-500 to-green-500' },
  { name: 'Log Drum', category: 'Amapiano', midiNote: 60, color: 'from-emerald-500 to-teal-500' },
  { name: 'Amapiano Bass', category: 'Amapiano', midiNote: 48, color: 'from-purple-500 to-pink-500' },
  { name: 'Piano Stab', category: 'Private School', midiNote: 64, color: 'from-violet-500 to-purple-500' },
];

const DEFAULT_TRIGGERS: BeatboxTrigger[] = [
  { id: '1', sound: '808 Kick', midiNote: 36, trained: false, category: '808' },
  { id: '2', sound: '808 Snare', midiNote: 38, trained: false, category: '808' },
  { id: '3', sound: 'Log Drum', midiNote: 60, trained: false, category: 'Amapiano' },
  { id: '4', sound: 'Amapiano Bass', midiNote: 48, trained: false, category: 'Amapiano' },
];

interface BeatboxPadGridProps {
  isRecording: boolean;
  onMidiNote: (note: MIDINote) => void;
}

export const BeatboxPadGrid: React.FC<BeatboxPadGridProps> = ({ isRecording, onMidiNote }) => {
  const [triggers, setTriggers] = useState<BeatboxTrigger[]>(DEFAULT_TRIGGERS);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTrigger = (trigger: BeatboxTrigger) => {
    setActiveTrigger(trigger.id);

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (trigger.category === '808') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(trigger.midiNote * 8, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 * Math.pow(2, (trigger.midiNote - 69) / 12), ctx.currentTime);
    }

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);

    if (isRecording) {
      onMidiNote({ note: trigger.midiNote, velocity: 110, timestamp: Date.now(), duration: 200 });
    }

    setTimeout(() => setActiveTrigger(null), 300);
  };

  const addTrigger = (instrument: InstrumentPreset) => {
    setTriggers(prev => [
      ...prev,
      { id: Date.now().toString(), sound: instrument.name, midiNote: instrument.midiNote, trained: false, category: instrument.category },
    ]);
    setShowInstrumentModal(false);
    toast.success(`Added: ${instrument.name}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {triggers.map(trigger => (
          <button
            key={trigger.id}
            onClick={() => playTrigger(trigger)}
            className={`aspect-square bg-gradient-to-br from-background to-primary/10 rounded-2xl border-2 transition-all p-4 ${
              activeTrigger === trigger.id
                ? 'border-primary scale-95 shadow-lg shadow-primary/50'
                : 'border-primary/30 hover:border-primary/60'
            }`}
          >
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <Play className="w-6 h-6 text-primary" />
              <div className="text-sm font-bold">{trigger.sound}</div>
              <div className="text-xs text-muted-foreground">{midiToNoteName(trigger.midiNote)}</div>
            </div>
          </button>
        ))}
        <button
          onClick={() => setShowInstrumentModal(true)}
          className="aspect-square bg-gradient-to-br from-background to-primary/5 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all p-4"
        >
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Plus className="w-6 h-6 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">Add Trigger</div>
          </div>
        </button>
      </div>

      <Dialog open={showInstrumentModal} onOpenChange={setShowInstrumentModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Instrument Library</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 gap-3 p-4">
              {INSTRUMENT_LIBRARY.map(instrument => (
                <button
                  key={instrument.name}
                  onClick={() => addTrigger(instrument)}
                  className={`p-4 rounded-xl border-2 border-primary/30 hover:border-primary transition-all bg-gradient-to-br ${instrument.color}`}
                >
                  <div className="text-primary-foreground text-center space-y-1">
                    <div className="font-bold">{instrument.name}</div>
                    <div className="text-xs opacity-80">{instrument.category}</div>
                    <div className="text-xs opacity-60">{midiToNoteName(instrument.midiNote)}</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
