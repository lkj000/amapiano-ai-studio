/**
 * DeveloperModeToggle - Toggle switch for developer mode
 * Provides access to research/dev tools when enabled
 */

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  Code2, 
  FlaskConical, 
  Activity, 
  Bug, 
  ChevronDown,
  Shield,
  Sparkles
} from 'lucide-react';
import { useDeveloperModeStore, type UserRole } from '@/stores/developerModeStore';
import { cn } from '@/lib/utils';

interface DeveloperModeToggleProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
}

const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-muted text-muted-foreground',
  creator: 'bg-blue-500/20 text-blue-400',
  developer: 'bg-purple-500/20 text-purple-400',
  researcher: 'bg-amber-500/20 text-amber-400',
  admin: 'bg-red-500/20 text-red-400',
};

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  creator: 'Creator',
  developer: 'Developer',
  researcher: 'Researcher',
  admin: 'Admin',
};

export const DeveloperModeToggle: React.FC<DeveloperModeToggleProps> = ({
  variant = 'full',
  className,
}) => {
  const {
    isDeveloperMode,
    userRole,
    showAdvancedNav,
    showResearchTools,
    showPerformanceMetrics,
    showDebugInfo,
    setDeveloperMode,
    toggleAdvancedNav,
    toggleResearchTools,
    togglePerformanceMetrics,
    toggleDebugInfo,
  } = useDeveloperModeStore();

  if (variant === 'icon') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0',
              isDeveloperMode && 'text-purple-400',
              className
            )}
          >
            <Code2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <DeveloperModeContent
            isDeveloperMode={isDeveloperMode}
            userRole={userRole}
            showAdvancedNav={showAdvancedNav}
            showResearchTools={showResearchTools}
            showPerformanceMetrics={showPerformanceMetrics}
            showDebugInfo={showDebugInfo}
            setDeveloperMode={setDeveloperMode}
            toggleAdvancedNav={toggleAdvancedNav}
            toggleResearchTools={toggleResearchTools}
            togglePerformanceMetrics={togglePerformanceMetrics}
            toggleDebugInfo={toggleDebugInfo}
          />
        </PopoverContent>
      </Popover>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Switch
          id="dev-mode-compact"
          checked={isDeveloperMode}
          onCheckedChange={setDeveloperMode}
        />
        <Label htmlFor="dev-mode-compact" className="text-xs cursor-pointer">
          Dev Mode
        </Label>
        {isDeveloperMode && (
          <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400">
            ON
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <DeveloperModeContent
        isDeveloperMode={isDeveloperMode}
        userRole={userRole}
        showAdvancedNav={showAdvancedNav}
        showResearchTools={showResearchTools}
        showPerformanceMetrics={showPerformanceMetrics}
        showDebugInfo={showDebugInfo}
        setDeveloperMode={setDeveloperMode}
        toggleAdvancedNav={toggleAdvancedNav}
        toggleResearchTools={toggleResearchTools}
        togglePerformanceMetrics={togglePerformanceMetrics}
        toggleDebugInfo={toggleDebugInfo}
      />
    </div>
  );
};

interface DeveloperModeContentProps {
  isDeveloperMode: boolean;
  userRole: UserRole;
  showAdvancedNav: boolean;
  showResearchTools: boolean;
  showPerformanceMetrics: boolean;
  showDebugInfo: boolean;
  setDeveloperMode: (enabled: boolean) => void;
  toggleAdvancedNav: () => void;
  toggleResearchTools: () => void;
  togglePerformanceMetrics: () => void;
  toggleDebugInfo: () => void;
}

const DeveloperModeContent: React.FC<DeveloperModeContentProps> = ({
  isDeveloperMode,
  userRole,
  showAdvancedNav,
  showResearchTools,
  showPerformanceMetrics,
  showDebugInfo,
  setDeveloperMode,
  toggleAdvancedNav,
  toggleResearchTools,
  togglePerformanceMetrics,
  toggleDebugInfo,
}) => (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-purple-400" />
        <span className="font-medium text-sm">Developer Mode</span>
      </div>
      <Badge className={cn('text-xs', ROLE_COLORS[userRole])}>
        {ROLE_LABELS[userRole]}
      </Badge>
    </div>

    {/* Main Toggle */}
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-medium">Enable Dev Mode</p>
          <p className="text-xs text-muted-foreground">
            Show all research & dev tools
          </p>
        </div>
      </div>
      <Switch
        checked={isDeveloperMode}
        onCheckedChange={setDeveloperMode}
      />
    </div>

    {isDeveloperMode && (
      <>
        <Separator />
        
        {/* Granular Toggles */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Visibility Options
          </p>
          
          <ToggleOption
            icon={ChevronDown}
            label="Advanced Navigation"
            description="Show all nav categories"
            checked={showAdvancedNav}
            onCheckedChange={toggleAdvancedNav}
          />
          
          <ToggleOption
            icon={FlaskConical}
            label="Research Tools"
            description="User studies, A/B testing"
            checked={showResearchTools}
            onCheckedChange={toggleResearchTools}
          />
          
          <ToggleOption
            icon={Activity}
            label="Performance Metrics"
            description="Benchmarks & analytics"
            checked={showPerformanceMetrics}
            onCheckedChange={togglePerformanceMetrics}
          />
          
          <ToggleOption
            icon={Bug}
            label="Debug Info"
            description="Console output, state inspection"
            checked={showDebugInfo}
            onCheckedChange={toggleDebugInfo}
          />
        </div>
      </>
    )}
  </div>
);

interface ToggleOptionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}

const ToggleOption: React.FC<ToggleOptionProps> = ({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="scale-75"
    />
  </div>
);

export default DeveloperModeToggle;
