import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface Technique {
  name: string;
  icon: string;
  description: string;
  originalRecognizable: string;
  newElements: string;
  category: 'creative' | 'timeline';
}

const TECHNIQUES: Technique[] = [
  {
    name: 'Amapianorize',
    icon: '✨',
    description: 'Reconstructs the track around an Amapiano spine — log drums, regional swing, jazz re-voicing, -7.5 LUFS mastering.',
    originalRecognizable: 'Partially — vocals/melody survive',
    newElements: 'FM log drums, NGE shakers, sidechain, bass',
    category: 'creative',
  },
  {
    name: 'Extend',
    icon: '🔁',
    description: 'Intelligently lengthens a track or mix via optimal loop points (energy stability + phrase boundaries) and crossfade-looping.',
    originalRecognizable: 'Yes — same track, just longer',
    newElements: 'No — uses existing audio material',
    category: 'creative',
  },
  {
    name: 'Remix',
    icon: '🔀',
    description: 'Producer reinterprets a track — new arrangement, BPM, added/removed sections. Usually officially licensed.',
    originalRecognizable: 'Usually — key hooks/vocals kept',
    newElements: 'Yes — entirely new production choices',
    category: 'creative',
  },
  {
    name: 'Sample',
    icon: '🧩',
    description: 'Lifts a specific segment (loop, vocal phrase, chord stab) and embeds it into a new composition as an ingredient.',
    originalRecognizable: 'Sometimes — just a fragment',
    newElements: 'Yes — sample lives inside a new song',
    category: 'creative',
  },
  {
    name: 'Cover',
    icon: '🎤',
    description: 'Re-performs the same song with new instrumentation/vocals. Composition stays identical.',
    originalRecognizable: 'Yes — same song, different performance',
    newElements: 'Minimal — arrangement may change',
    category: 'creative',
  },
  {
    name: 'Mashup',
    icon: '🔗',
    description: 'Layers two or more existing tracks simultaneously. No new production — just alignment and mixing.',
    originalRecognizable: 'Yes — both sources audible',
    newElements: 'No — just creative alignment',
    category: 'creative',
  },
  {
    name: 'Tempo Sync',
    icon: '⏱️',
    description: 'Clips follow session tempo via tick-based anchoring. Fades and automation scale proportionally.',
    originalRecognizable: 'Yes',
    newElements: 'No',
    category: 'timeline',
  },
  {
    name: 'Warp',
    icon: '🌀',
    description: 'Algorithm-specific time-stretching (Polyphonic, Monophonic, Razor Blade) that preserves pitch while changing tempo.',
    originalRecognizable: 'Yes — pitch preserved',
    newElements: 'No',
    category: 'timeline',
  },
  {
    name: 'Pitch Shift',
    icon: '🎹',
    description: 'Frequency-domain manipulation to change pitch independently of tempo. Natural drift = 12 × log₂(ratio) semitones.',
    originalRecognizable: 'Yes — pitched version',
    newElements: 'No',
    category: 'timeline',
  },
  {
    name: 'Quantize',
    icon: '📐',
    description: 'Corrective timing that snaps audio transients to a rhythmic grid.',
    originalRecognizable: 'Yes — tighter timing',
    newElements: 'No',
    category: 'timeline',
  },
];

export default function TechniqueComparisonPanel() {
  const [expanded, setExpanded] = useState(false);
  const creativeTechniques = TECHNIQUES.filter(t => t.category === 'creative');
  const timelineTechniques = TECHNIQUES.filter(t => t.category === 'timeline');

  const displayed = expanded ? TECHNIQUES : creativeTechniques.slice(0, 3);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Technique Taxonomy
          <Badge variant="outline" className="text-[9px] ml-auto">{TECHNIQUES.length} techniques</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!expanded && (
          <div className="space-y-1.5">
            {displayed.map(t => (
              <div key={t.name} className="flex items-start gap-2 p-2 rounded bg-muted/20 hover:bg-muted/30 transition-colors">
                <span className="text-sm shrink-0">{t.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {expanded && (
          <>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Creative Techniques</p>
            <div className="space-y-1.5">
              {creativeTechniques.map(t => (
                <div key={t.name} className="p-2.5 rounded bg-muted/20 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{t.icon}</span>
                    <p className="text-xs font-medium flex-1">{t.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-background/50 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground/60">Original recognizable?</p>
                      <p className="text-[10px] text-muted-foreground">{t.originalRecognizable}</p>
                    </div>
                    <div className="bg-background/50 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground/60">New elements?</p>
                      <p className="text-[10px] text-muted-foreground">{t.newElements}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider pt-2">DAW Timeline Operations</p>
            <div className="space-y-1.5">
              {timelineTechniques.map(t => (
                <div key={t.name} className="p-2.5 rounded bg-muted/20 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{t.icon}</span>
                    <p className="text-xs font-medium flex-1">{t.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-background/50 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground/60">Original recognizable?</p>
                      <p className="text-[10px] text-muted-foreground">{t.originalRecognizable}</p>
                    </div>
                    <div className="bg-background/50 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground/60">New elements?</p>
                      <p className="text-[10px] text-muted-foreground">{t.newElements}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3 mr-1" /> Show Less</>
          ) : (
            <><ChevronDown className="w-3 h-3 mr-1" /> Show All {TECHNIQUES.length} Techniques</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
