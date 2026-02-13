import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, ListMusic, BarChart3, Clock, Music2, ArrowRight } from 'lucide-react';
import { GeneratedSet } from './DJAgentTypes';

interface DJSetPreviewProps {
  sets: GeneratedSet[];
  activeSetIndex: number;
  onSelectSet: (index: number) => void;
}

export default function DJSetPreview({ sets, activeSetIndex, onSelectSet }: DJSetPreviewProps) {
  if (sets.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full flex items-center justify-center">
        <div className="text-center p-8">
          <ListMusic className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Generated sets will appear here</p>
          <p className="text-xs text-muted-foreground/60 mt-1">The agent will produce 3 variations (Safe, Balanced, Wild)</p>
        </div>
      </Card>
    );
  }

  const activeSet = sets[activeSetIndex];

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            Generated Sets
          </CardTitle>
          <div className="flex gap-1">
            {sets.map((set, i) => (
              <Button
                key={set.planId}
                variant={i === activeSetIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectSet(i)}
                className="text-xs px-3"
              >
                v{i + 1}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scores */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.overall)}`}>
              {activeSet.scores.overall}
            </p>
            <p className="text-[10px] text-muted-foreground">Overall</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.energySmoothness)}`}>
              {activeSet.scores.energySmoothness}
            </p>
            <p className="text-[10px] text-muted-foreground">Energy Flow</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.transitionCleanliness)}`}>
              {activeSet.scores.transitionCleanliness}
            </p>
            <p className="text-[10px] text-muted-foreground">Transitions</p>
          </div>
        </div>

        {/* Energy curve */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="w-3 h-3" /> Energy Arc
          </div>
          <div className="flex items-end gap-px h-12">
            {activeSet.energyCurve.map((val, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${val * 100}%`,
                  background: `hsl(${45 + (val * 225)}, 80%, ${50 + val * 20}%)`,
                }}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Tracklist */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Tracklist ({activeSet.tracklist.length} tracks)
          </p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-0.5">
              {activeSet.tracklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 text-sm">
                  <span className="text-xs text-muted-foreground w-10 shrink-0 font-mono">{item.time}</span>
                  <Music2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.artist && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{item.artist}</span>}
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                    {item.bpm} BPM
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                    {item.key}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Export */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-1" /> Export Mix
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <FileText className="w-4 h-4 mr-1" /> Cue Sheet
          </Button>
          <Button variant="outline" size="sm">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
