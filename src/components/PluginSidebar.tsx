import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, X, ChevronDown, ChevronRight } from 'lucide-react';
import { DraggablePlugin } from './DraggablePlugin';
import { usePluginSystem } from '@/hooks/usePluginSystem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PluginSidebarProps {
  audioContext: AudioContext | null;
  onClose: () => void;
}

export const PluginSidebar: React.FC<PluginSidebarProps> = ({ audioContext, onClose }) => {
  const { installedPlugins } = usePluginSystem(audioContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Drums', 'Instruments']));

  const filteredPlugins = installedPlugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categorizedPlugins = filteredPlugins.reduce((acc, plugin) => {
    const category = plugin.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(plugin);
    return acc;
  }, {} as Record<string, typeof filteredPlugins>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <Card className="w-72 lg:w-80 xl:w-96 h-full flex flex-col bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Plugin Library</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="px-4 py-2">
          <p className="text-sm text-muted-foreground">
            Drag plugins onto tracks to add them
          </p>
        </div>
        
        <ScrollArea className="h-full px-4">
          <div className="space-y-4 pb-4">
            {Object.entries(categorizedPlugins).map(([category, plugins]) => (
              <Collapsible 
                key={category}
                open={expandedCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-2 h-auto font-medium"
                  >
                    <span>{category} ({plugins.length})</span>
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-2">
                  {plugins.map(plugin => (
                    <DraggablePlugin 
                      key={plugin.id} 
                      plugin={plugin}
                      className="ml-2"
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
            
            {Object.keys(categorizedPlugins).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-2" />
                <p>No plugins found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};