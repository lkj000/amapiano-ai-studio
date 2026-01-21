import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Music, Download, Drum, Piano, Music2, Waves } from 'lucide-react';
import { toast } from 'sonner';
import {
  exportAmapianorizerMidi,
  downloadMidi
} from '@/lib/midi/midiExporter';

interface MidiExportPanelProps {
  bpm?: number;
  musicalKey?: string;
  onExport?: (filename: string) => void;
}

export function MidiExportPanel({ 
  bpm = 115, 
  musicalKey = 'Cm',
  onExport 
}: MidiExportPanelProps) {
  const [bars, setBars] = useState(4);
  const [includeLogDrum, setIncludeLogDrum] = useState(true);
  const [includeBassline, setIncludeBassline] = useState(true);
  const [includeChords, setIncludeChords] = useState(true);
  const [includePercussion, setIncludePercussion] = useState(true);
  
  const [logDrumPattern, setLogDrumPattern] = useState<'basic' | 'syncopated' | 'dense'>('syncopated');
  const [bassStyle, setBassStyle] = useState<'walking' | 'pumping' | 'minimal'>('pumping');
  const [chordVoicing, setChordVoicing] = useState<'basic' | 'extended' | 'jazzy'>('extended');
  const [percussionDensity, setPercussionDensity] = useState<'sparse' | 'medium' | 'dense'>('medium');

  const handleExport = () => {
    try {
      const midiData = exportAmapianorizerMidi({
        bars,
        bpm,
        key: musicalKey,
        includeLogDrum,
        includeBassline,
        includeChords,
        includePercussion,
        logDrumPattern,
        bassStyle,
        chordVoicing,
        percussionDensity
      });

      const filename = `amapiano-${musicalKey}-${bpm}bpm-${bars}bars.mid`;
      downloadMidi(midiData, filename);
      
      toast.success('MIDI exported successfully!', {
        description: filename
      });
      
      onExport?.(filename);
    } catch (error) {
      console.error('MIDI export error:', error);
      toast.error('Failed to export MIDI');
    }
  };

  const exportSingleTrack = (track: 'logdrum' | 'bass' | 'chords' | 'percussion') => {
    try {
      const options = {
        bars,
        bpm,
        key: musicalKey,
        includeLogDrum: track === 'logdrum',
        includeBassline: track === 'bass',
        includeChords: track === 'chords',
        includePercussion: track === 'percussion',
        logDrumPattern,
        bassStyle,
        chordVoicing,
        percussionDensity
      };

      const midiData = exportAmapianorizerMidi(options);
      const filename = `amapiano-${track}-${musicalKey}-${bpm}bpm.mid`;
      downloadMidi(midiData, filename);
      
      toast.success(`${track} MIDI exported!`);
    } catch (error) {
      toast.error(`Failed to export ${track}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          MIDI Export
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Export Amapiano patterns as MIDI files for your DAW
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Song Info */}
        <div className="flex gap-2">
          <Badge variant="secondary">{bpm} BPM</Badge>
          <Badge variant="secondary">{musicalKey}</Badge>
          <Badge variant="outline">{bars} bars</Badge>
        </div>

        {/* Bars Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Length (Bars)</label>
          <Slider
            value={[bars]}
            onValueChange={([v]) => setBars(v)}
            min={1}
            max={16}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 bar</span>
            <span>{bars} bars</span>
            <span>16 bars</span>
          </div>
        </div>

        {/* Track Toggles */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Include Tracks</h4>
          
          {/* Log Drum */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Drum className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Log Drum</p>
                <p className="text-xs text-muted-foreground">Signature amapiano drums</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {includeLogDrum && (
                <Select value={logDrumPattern} onValueChange={(v: any) => setLogDrumPattern(v)}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="syncopated">Syncopated</SelectItem>
                    <SelectItem value="dense">Dense</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Switch checked={includeLogDrum} onCheckedChange={setIncludeLogDrum} />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => exportSingleTrack('logdrum')}
                disabled={!includeLogDrum}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Bassline */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Waves className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Bassline</p>
                <p className="text-xs text-muted-foreground">Deep sub bass</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {includeBassline && (
                <Select value={bassStyle} onValueChange={(v: any) => setBassStyle(v)}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pumping">Pumping</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Switch checked={includeBassline} onCheckedChange={setIncludeBassline} />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => exportSingleTrack('bass')}
                disabled={!includeBassline}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Chords */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Piano className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Piano Chords</p>
                <p className="text-xs text-muted-foreground">Soulful progressions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {includeChords && (
                <Select value={chordVoicing} onValueChange={(v: any) => setChordVoicing(v)}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="extended">Extended</SelectItem>
                    <SelectItem value="jazzy">Jazzy</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Switch checked={includeChords} onCheckedChange={setIncludeChords} />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => exportSingleTrack('chords')}
                disabled={!includeChords}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Percussion */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Music2 className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Percussion</p>
                <p className="text-xs text-muted-foreground">Shakers & hi-hats</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {includePercussion && (
                <Select value={percussionDensity} onValueChange={(v: any) => setPercussionDensity(v)}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sparse">Sparse</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="dense">Dense</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Switch checked={includePercussion} onCheckedChange={setIncludePercussion} />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => exportSingleTrack('percussion')}
                disabled={!includePercussion}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Export All Button */}
        <Button 
          className="w-full" 
          onClick={handleExport}
          disabled={!includeLogDrum && !includeBassline && !includeChords && !includePercussion}
        >
          <Download className="w-4 h-4 mr-2" />
          Export All Tracks as MIDI
        </Button>
      </CardContent>
    </Card>
  );
}
