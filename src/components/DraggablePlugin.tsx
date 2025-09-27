import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PluginManifest } from '@/hooks/usePluginSystem';

interface DraggablePluginProps {
  plugin: PluginManifest;
  className?: string;
}

export const DraggablePlugin: React.FC<DraggablePluginProps> = ({ plugin, className }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'plugin',
      pluginId: plugin.id,
      pluginName: plugin.name,
      pluginType: plugin.type
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Card
      className={`p-3 cursor-grab hover:shadow-md transition-all duration-200 active:cursor-grabbing ${className}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-center gap-3">
        {plugin.icon && (
          <div className="text-2xl">{plugin.icon}</div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{plugin.name}</h4>
          <p className="text-sm text-muted-foreground truncate">{plugin.description}</p>
          <div className="flex gap-1 mt-1">
            <Badge variant="secondary" className="text-xs">{plugin.type}</Badge>
            <Badge variant="outline" className="text-xs">{plugin.category}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};