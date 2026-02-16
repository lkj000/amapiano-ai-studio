import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, ArrowRight, Music2 } from 'lucide-react';

export default function PitchShiftCalculator() {
  const [originalBPM, setOriginalBPM] = useState(120);
  const [newBPM, setNewBPM] = useState(112);

  const result = useMemo(() => {
    if (originalBPM <= 0 || newBPM <= 0) return null;
    const ratio = newBPM / originalBPM;
    const semitones = 12 * Math.log2(ratio);
    const cents = semitones * 100;
    const percentChange = ((ratio - 1) * 100);
    return {
      semitones: Math.round(semitones * 100) / 100,
      cents: Math.round(cents),
      ratio: Math.round(ratio * 10000) / 10000,
      percentChange: Math.round(percentChange * 100) / 100,
      needsTimeStretch: Math.abs(semitones) > 0.5,
    };
  }, [originalBPM, newBPM]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          Tempo ↔ Pitch Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Original BPM</Label>
            <Input
              type="number"
              min={1}
              max={300}
              value={originalBPM}
              onChange={(e) => setOriginalBPM(Number(e.target.value))}
              className="h-9"
            />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground mb-2" />
          <div className="space-y-1">
            <Label className="text-xs">New BPM</Label>
            <Input
              type="number"
              min={1}
              max={300}
              value={newBPM}
              onChange={(e) => setNewBPM(Number(e.target.value))}
              className="h-9"
            />
          </div>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className={`text-lg font-bold ${Math.abs(result.semitones) > 1 ? 'text-destructive' : 'text-primary'}`}>
                  {result.semitones > 0 ? '+' : ''}{result.semitones}
                </p>
                <p className="text-[10px] text-muted-foreground">Semitones</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-primary">
                  {result.cents > 0 ? '+' : ''}{result.cents}
                </p>
                <p className="text-[10px] text-muted-foreground">Cents</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-sm font-bold text-primary">{result.ratio}×</p>
                <p className="text-[10px] text-muted-foreground">Speed Ratio</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-sm font-bold text-primary">
                  {result.percentChange > 0 ? '+' : ''}{result.percentChange}%
                </p>
                <p className="text-[10px] text-muted-foreground">Tempo Change</p>
              </div>
            </div>

            {result.needsTimeStretch ? (
              <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                <Music2 className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  Pitch shift &gt; ±0.5 semitones — use <Badge variant="outline" className="text-[9px] px-1 py-0">Warp</Badge> or <Badge variant="outline" className="text-[9px] px-1 py-0">Time-Stretch</Badge> to preserve pitch
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 rounded bg-primary/10 border border-primary/20">
                <Music2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  Small shift — safe to use <Badge variant="outline" className="text-[9px] px-1 py-0">Playback Rate</Badge> without noticeable pitch drift
                </p>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              Formula: 12 × log₂({newBPM} / {originalBPM})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
