import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Play, RotateCcw, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AgentPhase } from './DJAgentTypes';

interface DJAgentPanelProps {
  phase: AgentPhase;
  progress: number;
  message: string;
  trackCount: number;
  onGenerate: () => void;
  onReset: () => void;
  canGenerate: boolean;
}

const PHASE_LABELS: Record<AgentPhase, { label: string; color: string }> = {
  idle: { label: 'Ready', color: 'text-muted-foreground' },
  uploading: { label: 'Uploading...', color: 'text-info' },
  analyzing: { label: 'Analyzing Tracks', color: 'text-primary' },
  planning: { label: 'Planning Set', color: 'text-accent' },
  generating_variants: { label: 'Generating Variants', color: 'text-secondary' },
  rendering: { label: 'Rendering Mix', color: 'text-primary' },
  complete: { label: 'Complete', color: 'text-success' },
  error: { label: 'Error', color: 'text-destructive' },
};

export default function DJAgentPanel({
  phase, progress, message, trackCount, onGenerate, onReset, canGenerate
}: DJAgentPanelProps) {
  const phaseInfo = PHASE_LABELS[phase];
  const isWorking = !['idle', 'complete', 'error'].includes(phase);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          DJ Agent
          <Badge variant="outline" className={`ml-auto ${phaseInfo.color}`}>
            {phase === 'complete' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {phase === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
            {isWorking && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            {phaseInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent status */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Level-5 Autonomous Performance</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {message || 'Add tracks and configure your set, then hit Generate to create an AI DJ performance.'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        {isWorking && (
          <div className="space-y-1.5">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Agent pipeline visualization */}
        <div className="grid grid-cols-5 gap-1">
          {(['analyzing', 'planning', 'generating_variants', 'rendering', 'complete'] as AgentPhase[]).map((step, i) => {
            const stepLabels = ['Analyze', 'Plan', 'Variants', 'Render', 'Done'];
            const isActive = step === phase;
            const isPast = ['analyzing', 'planning', 'generating_variants', 'rendering', 'complete'].indexOf(phase) > i;
            return (
              <div key={step} className="text-center">
                <div className={`h-1.5 rounded-full mb-1 transition-colors ${
                  isActive ? 'bg-primary animate-pulse' : isPast ? 'bg-primary/60' : 'bg-muted'
                }`} />
                <p className={`text-[10px] ${isActive ? 'text-primary font-medium' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                  {stepLabels[i]}
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onGenerate}
            disabled={!canGenerate || isWorking}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isWorking ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Generate {trackCount > 0 ? `(${trackCount} tracks)` : ''}</>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={onReset} disabled={isWorking}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
