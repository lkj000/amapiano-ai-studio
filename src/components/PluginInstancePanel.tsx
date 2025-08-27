import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, Power, MoreVertical, Save, 
  RotateCcw, Copy, Trash2, Download,
  Sliders, Zap, Volume2, VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import type { PluginInstance, PluginManifest, PluginParameter, PluginPreset } from '@/hooks/usePluginSystem';

interface PluginInstancePanelProps {
  instance: PluginInstance;
  manifest: PluginManifest;
  onParameterChange: (parameterId: string, value: any) => void;
  onPresetLoad: (preset: PluginPreset) => void;
  onPresetSave: (name: string) => void;
  onRemove: () => void;
  onBypassToggle: () => void;
  onClose: () => void;
}

export default function PluginInstancePanel({
  instance,
  manifest,
  onParameterChange,
  onPresetLoad,
  onPresetSave,
  onRemove,
  onBypassToggle,
  onClose
}: PluginInstancePanelProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);

  const handleParameterChange = useCallback((param: PluginParameter, value: any) => {
    onParameterChange(param.id, value);
  }, [onParameterChange]);

  const handlePresetLoad = useCallback((presetId: string) => {
    const preset = manifest.presets.find(p => p.id === presetId);
    if (preset) {
      onPresetLoad(preset);
      setSelectedPreset(presetId);
      toast.success(`Loaded preset: ${preset.name}`);
    }
  }, [manifest.presets, onPresetLoad]);

  const handlePresetSave = useCallback(() => {
    if (newPresetName.trim()) {
      onPresetSave(newPresetName.trim());
      setNewPresetName('');
      setShowPresetSave(false);
      toast.success(`Saved preset: ${newPresetName}`);
    }
  }, [newPresetName, onPresetSave]);

  const resetToDefaults = useCallback(() => {
    manifest.parameters.forEach(param => {
      onParameterChange(param.id, param.defaultValue);
    });
    setSelectedPreset('');
    toast.success('Reset to default values');
  }, [manifest.parameters, onParameterChange]);

  const renderParameter = (param: PluginParameter) => {
    const currentValue = instance.parameters[param.id] ?? param.defaultValue;

    switch (param.type) {
      case 'float':
      case 'int':
        return (
          <div key={param.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{param.name}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentValue.toFixed(param.type === 'int' ? 0 : 2)}
                  {param.unit && ` ${param.unit}`}
                </span>
              </div>
            </div>
            <Slider
              value={[currentValue]}
              onValueChange={([value]) => handleParameterChange(param, value)}
              min={param.minValue ?? 0}
              max={param.maxValue ?? 1}
              step={param.step ?? (param.type === 'int' ? 1 : 0.01)}
              className="w-full"
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={param.id} className="flex items-center justify-between">
            <label className="text-sm font-medium">{param.name}</label>
            <Switch
              checked={currentValue}
              onCheckedChange={(checked) => handleParameterChange(param, checked)}
            />
          </div>
        );

      case 'enum':
        return (
          <div key={param.id} className="space-y-2">
            <label className="text-sm font-medium">{param.name}</label>
            <Select
              value={currentValue}
              onValueChange={(value) => handleParameterChange(param, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{manifest.icon || '🔌'}</div>
            <div>
              <CardTitle className="text-lg">{instance.name}</CardTitle>
              <p className="text-sm text-muted-foreground">by {manifest.author}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={instance.bypass ? 'secondary' : 'default'}
              size="sm"
              onClick={onBypassToggle}
            >
              <Power className={`h-4 w-4 ${instance.bypass ? 'text-muted-foreground' : 'text-green-500'}`} />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={instance.bypass ? 'secondary' : 'default'}>
            {instance.bypass ? 'Bypassed' : 'Active'}
          </Badge>
          <Badge variant="outline">{manifest.type}</Badge>
          <Badge variant="outline">{manifest.version}</Badge>
          
          {instance.bypass && (
            <div className="text-xs text-muted-foreground ml-auto">
              Plugin is bypassed
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Presets */}
        {manifest.presets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Presets</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresetSave(!showPresetSave)}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
            
            <Select value={selectedPreset} onValueChange={handlePresetLoad}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset..." />
              </SelectTrigger>
              <SelectContent>
                {manifest.presets.map(preset => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex flex-col">
                      <span>{preset.name}</span>
                      {preset.description && (
                        <span className="text-xs text-muted-foreground">
                          {preset.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showPresetSave && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="flex-1 px-3 py-1 text-sm border rounded"
                  onKeyPress={(e) => e.key === 'Enter' && handlePresetSave()}
                />
                <Button size="sm" onClick={handlePresetSave}>
                  Save
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Parameters */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Parameters
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-full">
            <div className="space-y-4 pr-3">
              {manifest.parameters.map(renderParameter)}
              
              {manifest.parameters.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No parameters available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Copy current settings to clipboard
              navigator.clipboard.writeText(JSON.stringify(instance.parameters, null, 2));
              toast.success('Parameters copied to clipboard');
            }}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}