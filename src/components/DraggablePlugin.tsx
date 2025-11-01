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
      className={`group p-4 cursor-grab hover:shadow-xl hover:scale-105 transition-all duration-300 active:cursor-grabbing active:scale-95 border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50 ${className}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-center gap-3">
        {plugin.icon && (
          <div className="text-3xl group-hover:scale-110 transition-transform p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20">
            {plugin.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate group-hover:text-primary transition-colors">{plugin.name}</h4>
          <p className="text-sm text-muted-foreground truncate leading-relaxed">{plugin.description}</p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-xs font-medium">{plugin.type}</Badge>
            <Badge variant="outline" className="text-xs">{plugin.category}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
