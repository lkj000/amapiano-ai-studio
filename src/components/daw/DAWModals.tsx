/**
 * DAWModals - Central modal renderer for all DAW components
 * Wires isolated components to the Zustand modal system
 */

import React, { Suspense, lazy } from 'react';
import { useDAWStore, useActiveModal, type ModalType } from '@/stores/dawStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components to improve initial load time
const CommunityFeedbackCard = lazy(() => 
  import('@/components/training/CommunityFeedbackCard').then(m => ({ default: m.CommunityFeedbackCard }))
);
const ModelPerformanceDashboard = lazy(() => 
  import('@/components/training/ModelPerformanceDashboard').then(m => ({ default: m.ModelPerformanceDashboard }))
);
const ABTestComparison = lazy(() => 
  import('@/components/training/ABTestComparison').then(m => ({ default: m.ABTestComparison }))
);
const NeuralMusicEngine = lazy(() => 
  import('@/components/ai/NeuralMusicEngine').then(m => ({ default: m.NeuralMusicEngine }))
);
const SunoStyleWorkflow = lazy(() => 
  import('@/components/ai/SunoStyleWorkflow')
);
const SourceSeparationEngine = lazy(() => 
  import('@/components/ai/SourceSeparationEngine').then(m => ({ default: m.SourceSeparationEngine }))
);
const AmapianorizationEngine = lazy(() => 
  import('@/components/ai/AmapianorizationEngine').then(m => ({ default: m.AmapianorizationEngine }))
);
const AgenticMusicComposer = lazy(() => 
  import('@/components/ai/AgenticMusicComposer').then(m => ({ default: m.AgenticMusicComposer }))
);
const AdvancedAIGenerator = lazy(() => 
  import('@/components/ai/AdvancedAIGenerator').then(m => ({ default: m.AdvancedAIGenerator }))
);

// Loading fallback
const ModalLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface ModalConfig {
  title: string;
  description: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

const MODAL_CONFIGS: Partial<Record<NonNullable<ModalType>, ModalConfig>> = {
  feedback: {
    title: 'Community Feedback',
    description: 'Rate this generation to help train our AI',
    size: 'md',
    component: CommunityFeedbackCard,
  },
  modelPerformance: {
    title: 'AI Model Performance',
    description: 'Analytics and metrics for the SI Neural Core',
    size: 'lg',
    component: ModelPerformanceDashboard,
  },
  abTestComparison: {
    title: 'A/B Test Comparison',
    description: 'Compare two variants and vote for the best',
    size: 'md',
    component: ABTestComparison,
  },
  neuralEngine: {
    title: 'Neural Music Engine',
    description: 'Multi-model AI composition with agentic orchestration',
    size: 'xl',
    component: NeuralMusicEngine,
  },
  sunoWorkflow: {
    title: 'Suno-Style Workflow',
    description: 'Generate full songs with lyrics, vocals, and stems',
    size: 'xl',
    component: SunoStyleWorkflow,
  },
  stemSeparation: {
    title: 'AI Stem Separation',
    description: 'Separate audio into individual instrument stems',
    size: 'xl',
    component: SourceSeparationEngine,
  },
  amapianorization: {
    title: 'Amapianorization Engine',
    description: 'Transform any audio into Amapiano style',
    size: 'lg',
    component: AmapianorizationEngine,
  },
  agenticComposer: {
    title: 'Agentic Music Composer',
    description: 'AI agents that compose music autonomously',
    size: 'xl',
    component: AgenticMusicComposer,
  },
  advancedAIGenerator: {
    title: 'Advanced AI Generator',
    description: 'Fine-grained control over AI music generation',
    size: 'lg',
    component: AdvancedAIGenerator,
  },
};

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export const DAWModals: React.FC = () => {
  const activeModal = useActiveModal();
  const closeModal = useDAWStore((state) => state.closeModal);
  const modalContext = useDAWStore((state) => state.ui.modalContext);

  // Check if current modal is one we handle
  const config = activeModal ? MODAL_CONFIGS[activeModal] : null;

  if (!config || !activeModal) {
    return null;
  }

  const Component = config.component;
  const sizeClass = SIZE_CLASSES[config.size];

  return (
    <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className={`${sizeClass} max-h-[90vh] overflow-auto bg-background`}>
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <Suspense fallback={<ModalLoader />}>
          <Component {...config.props} {...modalContext} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};

export default DAWModals;
