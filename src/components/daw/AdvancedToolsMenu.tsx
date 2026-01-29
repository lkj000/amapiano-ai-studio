/**
 * AdvancedToolsMenu - Dropdown menu for accessing isolated/advanced DAW components
 * Triggers modals via Zustand store
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Brain,
  Music,
  Scissors,
  BarChart3,
  Star,
  FlaskConical,
  Wand2,
  Layers,
  Bot,
  Gauge,
  ChevronDown,
} from 'lucide-react';
import { useDAWStore, type ModalType } from '@/stores/dawStore';

interface MenuItemConfig {
  icon: React.ElementType;
  label: string;
  description: string;
  modal: ModalType;
}

const AI_TOOLS: MenuItemConfig[] = [
  {
    icon: Brain,
    label: 'Neural Engine',
    description: 'Multi-model AI composition',
    modal: 'neuralEngine',
  },
  {
    icon: Wand2,
    label: 'Suno Workflow',
    description: 'Lyrics → Song → Stems',
    modal: 'sunoWorkflow',
  },
  {
    icon: Bot,
    label: 'Agentic Composer',
    description: 'Autonomous AI agents',
    modal: 'agenticComposer',
  },
  {
    icon: Sparkles,
    label: 'Advanced Generator',
    description: 'Fine-grained AI control',
    modal: 'advancedAIGenerator',
  },
];

const AUDIO_TOOLS: MenuItemConfig[] = [
  {
    icon: Scissors,
    label: 'Stem Separation',
    description: 'Split audio into stems',
    modal: 'stemSeparation',
  },
  {
    icon: Layers,
    label: 'Amapianorization',
    description: 'Transform to Amapiano style',
    modal: 'amapianorization',
  },
];

const TRAINING_TOOLS: MenuItemConfig[] = [
  {
    icon: BarChart3,
    label: 'Model Performance',
    description: 'AI analytics dashboard',
    modal: 'modelPerformance',
  },
  {
    icon: Star,
    label: 'Rate & Feedback',
    description: 'Train AI with ratings',
    modal: 'feedback',
  },
  {
    icon: FlaskConical,
    label: 'A/B Testing',
    description: 'Compare variants',
    modal: 'abTestComparison',
  },
];

export const AdvancedToolsMenu: React.FC = () => {
  const openModal = useDAWStore((state) => state.openModal);

  const renderMenuItem = ({ icon: Icon, label, description, modal }: MenuItemConfig) => (
    <DropdownMenuItem
      key={modal}
      onClick={() => openModal(modal)}
      className="flex items-start gap-3 py-2.5 cursor-pointer"
    >
      <Icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="flex flex-col">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Gauge className="h-4 w-4" />
          Advanced
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-background border border-border z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          AI Generation
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {AI_TOOLS.map(renderMenuItem)}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          Audio Processing
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {AUDIO_TOOLS.map(renderMenuItem)}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
          Training & Analytics
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {TRAINING_TOOLS.map(renderMenuItem)}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdvancedToolsMenu;
