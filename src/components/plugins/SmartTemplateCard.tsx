import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Zap, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface SmartTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  tags: string[];
  icon: string;
  gradient: string;
  defaultParams: Record<string, { value: number; min: number; max: number; unit: string; label: string }>;
  signalChain: string[];
  prompt: string;
}

interface SmartTemplateCardProps {
  template: SmartTemplate;
  onGenerate: (template: SmartTemplate, customParams?: Record<string, number>) => void;
  isGenerating?: boolean;
}

export const SmartTemplateCard: React.FC<SmartTemplateCardProps> = ({
  template,
  onGenerate,
  isGenerating = false
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [params, setParams] = useState<Record<string, number>>(
    Object.fromEntries(
      Object.entries(template.defaultParams).map(([key, val]) => [key, val.value])
    )
  );

  const handleGenerate = () => {
    onGenerate(template, isCustomizing ? params : undefined);
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg border-2">
      {/* Genre-specific gradient overlay */}
      <div className={`absolute inset-0 opacity-5 ${template.gradient} transition-opacity group-hover:opacity-10`} />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${template.gradient} flex items-center justify-center text-2xl shadow-lg`}>
              {template.icon}
            </div>
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {template.genre}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="mt-2">{template.description}</CardDescription>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Signal Chain Preview */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Signal Chain</Label>
          <div className="flex flex-wrap gap-1.5">
            {template.signalChain.map((module, idx) => (
              <React.Fragment key={idx}>
                <Badge variant="secondary" className="text-xs font-mono">
                  {module}
                </Badge>
                {idx < template.signalChain.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Customization Panel */}
        <Collapsible open={isCustomizing} onOpenChange={setIsCustomizing}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Customize Parameters
              </span>
              {isCustomizing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {Object.entries(template.defaultParams).map(([key, config]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm">{config.label}</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {params[key]}{config.unit}
                  </span>
                </div>
                <Slider
                  value={[params[key]]}
                  onValueChange={(val) => setParams({ ...params, [key]: val[0] })}
                  min={config.min}
                  max={config.max}
                  step={(config.max - config.min) / 100}
                  className="w-full"
                />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : `Generate ${template.name}`}
        </Button>
      </CardContent>
    </Card>
  );
};
