import React from 'react';
import { Aura808LogDrum } from './Aura808LogDrum';
import type { PluginInstance, PluginManifest } from '@/hooks/usePluginSystem';

interface Aura808LogDrumPanelProps {
  instance: PluginInstance;
  manifest: PluginManifest;
  audioContext: AudioContext | null;
  onParameterChange: (parameterId: string, value: number) => void;
  onClose: () => void;
}

export const Aura808LogDrumPanel: React.FC<Aura808LogDrumPanelProps> = ({
  instance,
  manifest,
  audioContext,
  onParameterChange,
  onClose
}) => {
  return (
    <div className="relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
      >
        ×
      </button>
      <Aura808LogDrum
        audioContext={audioContext}
        onParameterChange={onParameterChange}
        trackId={instance.trackId}
      />
    </div>
  );
};