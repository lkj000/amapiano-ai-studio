import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Zap,
  Bell,
  BarChart3,
  Settings,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface PerformanceOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onGenerateDemoData?: () => void;
}

const steps = [
  {
    title: 'Welcome to Performance Monitoring',
    description: 'Track and optimize your music generation performance in real-time.',
    icon: Activity,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This dashboard provides comprehensive insights into:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Generation latency and throughput metrics</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>WASM acceleration performance tracking</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Cost analysis and budget monitoring</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Anomaly detection with ML algorithms</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Real-time Metrics',
    description: 'Monitor key performance indicators as they happen.',
    icon: Zap,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The dashboard displays four critical metrics:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border rounded-lg">
            <div className="text-xs font-medium text-muted-foreground">Avg Latency</div>
            <div className="text-lg font-bold mt-1">Target: 180ms</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-xs font-medium text-muted-foreground">Speedup Factor</div>
            <div className="text-lg font-bold mt-1">Up to 5x faster</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-xs font-medium text-muted-foreground">Throughput</div>
            <div className="text-lg font-bold mt-1">Generations tracked</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-xs font-medium text-muted-foreground">Monthly Costs</div>
            <div className="text-lg font-bold mt-1">Budget monitoring</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Testing & Baselines',
    description: 'Simulate metrics and establish performance baselines.',
    icon: BarChart3,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use the Testing tab to:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Generate sample performance metrics</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Simulate anomaly detection scenarios</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Establish 30-day performance baselines</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Compare current vs. baseline performance</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: 'Alerts & Auto-Remediation',
    description: 'Stay informed and automatically fix issues.',
    icon: Bell,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure intelligent monitoring:
        </p>
        <div className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="font-medium text-sm mb-1">Email & Slack Notifications</div>
            <p className="text-xs text-muted-foreground">
              Get alerted when critical issues are detected
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-medium text-sm mb-1">Auto-Remediation Rules</div>
            <p className="text-xs text-muted-foreground">
              Automatically respond to performance degradation
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-medium text-sm mb-1">ML Anomaly Detection</div>
            <p className="text-xs text-muted-foreground">
              Advanced algorithms identify unusual patterns
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Get Started',
    description: 'Ready to start monitoring your performance?',
    icon: Settings,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          To see the dashboard in action, you can:
        </p>
        <div className="space-y-3">
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="font-medium text-sm mb-2 flex items-center gap-2">
              <Badge>Recommended</Badge>
              Generate Demo Data
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Populate the dashboard with realistic sample metrics to explore all features
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="font-medium text-sm mb-2">Use Real Generation</div>
            <p className="text-xs text-muted-foreground">
              Start generating music to see real-time performance data
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export function PerformanceOnboardingWizard({
  open,
  onClose,
  onGenerateDemoData,
}: PerformanceOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleGenerateDemoData = () => {
    onGenerateDemoData?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle>{step.title}</DialogTitle>
              <DialogDescription>{step.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {step.content}
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-1 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {isLastStep && onGenerateDemoData && (
              <Button
                variant="outline"
                onClick={handleGenerateDemoData}
              >
                Generate Demo Data
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
