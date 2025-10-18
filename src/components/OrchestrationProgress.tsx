import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface OrchestrationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

interface OrchestrationProgressProps {
  steps: OrchestrationStep[];
  currentStep?: string;
}

export const OrchestrationProgress: React.FC<OrchestrationProgressProps> = ({
  steps,
  currentStep
}) => {
  const getStepIcon = (step: OrchestrationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'error':
        return <Circle className="w-5 h-5 text-destructive" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'running':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const overallProgress = (steps.filter(s => s.status === 'completed').length / steps.length) * 100;

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Step-by-step progress */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`relative flex items-start gap-3 p-3 rounded-lg transition-all ${
                step.status === 'running' ? 'bg-primary/5 ring-2 ring-primary/20' : ''
              }`}
            >
              {/* Step number/icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{step.name}</span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(step.status)}
                  >
                    {step.status}
                  </Badge>
                </div>
                
                {step.message && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.message}
                  </p>
                )}

                {/* Individual step progress */}
                {step.status === 'running' && step.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={step.progress} className="h-1" />
                  </div>
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[10px] top-8 bottom-[-12px] w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
