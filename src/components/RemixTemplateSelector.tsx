import React, { useState } from 'react';
import { useRemixTemplates } from '@/hooks/useRemixTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Zap, TrendingUp } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface RemixTemplateSelectorProps {
  onTemplateSelect: (template: any) => void;
  onClose?: () => void;
}

const RemixTemplateSelector: React.FC<RemixTemplateSelectorProps> = ({ 
  onTemplateSelect, 
  onClose 
}) => {
  const { templates, loading, useTemplate } = useRemixTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = async (template: any) => {
    setSelectedTemplate(template.id);
    await useTemplate(template.id);
    onTemplateSelect(template);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Choose Remix Style</h3>
          <p className="text-muted-foreground text-sm">Transform your track with AI-powered style templates</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Choose Remix Style
        </h3>
        <p className="text-muted-foreground text-sm">Transform your track with AI-powered style templates</p>
      </div>

      <ScrollArea className="max-h-96">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedTemplate === template.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {template.usage_count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-3">
                  {template.description}
                </CardDescription>
                
                <div className="space-y-2">
                  {/* Style Parameters Preview */}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(template.style_params).slice(0, 3).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {template.preview_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Play preview functionality
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                    )}
                    
                    <Button 
                      size="sm"
                      disabled={selectedTemplate === template.id}
                      className="ml-auto"
                    >
                      {selectedTemplate === template.id ? (
                        <LoadingSpinner size="sm" message="" />
                      ) : (
                        'Use Style'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {onClose && (
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default RemixTemplateSelector;