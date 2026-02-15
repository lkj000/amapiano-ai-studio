/**
 * DJ Set Comparison — side-by-side evaluation of all set variations
 * including the stemmed variation when available.
 */

import { GeneratedSet } from './DJAgentTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trophy, Layers, ArrowRight } from 'lucide-react';

interface DJSetComparisonProps {
  sets: GeneratedSet[];
  activeSetIndex: number;
  onSelectSet: (index: number) => void;
}

const VARIATION_COLORS = [
  'border-green-500/40 bg-green-500/5',
  'border-blue-500/40 bg-blue-500/5',
  'border-orange-500/40 bg-orange-500/5',
  'border-purple-500/40 bg-purple-500/5',
];

const VARIATION_BADGES = [
  'bg-green-500/20 text-green-400',
  'bg-blue-500/20 text-blue-400',
  'bg-orange-500/20 text-orange-400',
  'bg-purple-500/20 text-purple-400',
];

const SCORE_LABELS: { key: keyof GeneratedSet['scores']; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'harmonicClash', label: 'Harmonic' },
  { key: 'tempoJump', label: 'Tempo' },
  { key: 'energySmoothness', label: 'Energy' },
  { key: 'transitionCleanliness', label: 'Transitions' },
  { key: 'vocalOverlapConflict', label: 'Vocal Clarity' },
  { key: 'novelty', label: 'Novelty' },
];

export default function DJSetComparison({ sets, activeSetIndex, onSelectSet }: DJSetComparisonProps) {
  if (sets.length < 2) return null;

  // Find best score for each metric
  const bestScores: Record<string, number> = {};
  for (const sl of SCORE_LABELS) {
    bestScores[sl.key] = Math.max(...sets.map(s => s.scores[sl.key]));
  }

  const overallWinnerIdx = sets.reduce(
    (best, s, i) => (s.scores.overall > sets[best].scores.overall ? i : best), 0
  );

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Variation Comparison
          {sets.some(s => s.isStemmed) && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto text-purple-400 border-purple-400/40">
              <Layers className="w-3 h-3 mr-1" /> Stem Mode Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Metric</th>
                {sets.map((set, i) => {
                  const label = set.isStemmed ? '🎛️ Stemmed' : ['🟢 Safe', '🔵 Balanced', '🟠 Wild'][i];
                  return (
                    <th key={set.planId} className="text-center py-1.5 px-1">
                      <button
                        onClick={() => onSelectSet(i)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                          i === activeSetIndex
                            ? VARIATION_BADGES[i] || VARIATION_BADGES[3]
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SCORE_LABELS.map(sl => (
                <tr key={sl.key} className="border-b border-border/10">
                  <td className="py-1.5 pr-2 text-muted-foreground">{sl.label}</td>
                  {sets.map((set, i) => {
                    const val = set.scores[sl.key];
                    const isBest = val === bestScores[sl.key] && sets.filter(s => s.scores[sl.key] === val).length === 1;
                    return (
                      <td key={set.planId} className="text-center py-1.5 px-1">
                        <span className={`font-mono text-sm ${
                          isBest ? 'text-green-400 font-bold' : val >= 80 ? 'text-foreground' : val >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {val}
                          {isBest && sl.key === 'overall' && <Trophy className="w-3 h-3 inline ml-0.5 text-yellow-400" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Energy curves comparison */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Energy Arcs</p>
          <div className="space-y-1">
            {sets.map((set, i) => {
              const label = set.isStemmed ? 'Stemmed' : ['Safe', 'Balanced', 'Wild'][i];
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500'];
              return (
                <div key={set.planId} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-14 text-right">{label}</span>
                  <div className="flex items-end gap-px h-6 flex-1">
                    {set.energyCurve.map((val, j) => (
                      <div
                        key={j}
                        className={`flex-1 rounded-t-sm ${colors[i] || colors[3]} ${
                          i === activeSetIndex ? 'opacity-100' : 'opacity-40'
                        }`}
                        style={{ height: `${val * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-1.5 pt-1">
          {sets.map((set, i) => {
            const label = set.isStemmed ? 'Stemmed' : ['Safe', 'Balanced', 'Wild'][i];
            return (
              <button
                key={set.planId}
                onClick={() => onSelectSet(i)}
                className={`flex-1 text-xs py-2 rounded-md border transition-all ${
                  i === activeSetIndex
                    ? VARIATION_COLORS[i] || VARIATION_COLORS[3]
                    : 'border-border/30 hover:border-border/60 text-muted-foreground'
                }`}
              >
                <div className="font-medium">{label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">
                  Score: {set.scores.overall}
                  {i === overallWinnerIdx && ' 👑'}
                </div>
                {set.isStemmed && (
                  <div className="text-[9px] opacity-50 mt-0.5">Per-stem transitions</div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
