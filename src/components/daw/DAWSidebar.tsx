import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drum, Piano, Music, Volume2, Wand2, Zap, Plus, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HighSpeedDAWEngine } from '@/components/HighSpeedDAWEngine';

interface Instrument {
  name: string;
  icon: React.ElementType;
  description: string;
  type: string;
  color: string;
}

interface Effect {
  name: string;
  category: string;
  description: string;
}

interface DAWSidebarProps {
  showAIAssistant: boolean;
  showHighSpeedEngine: boolean;
  showUnifiedAnalysis: boolean;
  aiPrompt: string;
  isGenerating: boolean;
  onAIPromptChange: (prompt: string) => void;
  onAIGenerate: (prompt: string) => void;
  onToggleUnifiedAnalysis: () => void;
  onAddTrack: (instrument: { name: string; type: string; color: string }) => void;
  onAddEffect: (effectName: string) => void;
}

// Instruments list
const instruments: Instrument[] = [
  { name: 'Log Drum', icon: Drum, description: 'Signature Amapiano log drums', type: 'drums', color: 'bg-red-500' },
  { name: 'Piano', icon: Piano, description: 'Warm piano chords', type: 'keys', color: 'bg-blue-500' },
  { name: 'Bass', icon: Volume2, description: 'Deep, rolling bass', type: 'bass', color: 'bg-purple-500' },
  { name: 'Shakers', icon: Music, description: 'Rhythmic percussion', type: 'percussion', color: 'bg-orange-500' },
];

// Effects list
const effects: Effect[] = [
  { name: "Compressor", category: "Core", description: "Vintage-style compressor with amapiano preset" },
  { name: "Reverb", category: "Core", description: "Spatial reverb with hall and room settings" },
  { name: "Delay", category: "Core", description: "Tempo-synced delay with feedback control" },
  { name: "Limiter", category: "Core", description: "Transparent peak limiting" },
  { name: "Log Drum Saturator", category: "Amapiano", description: "Enhance log drum character" },
  { name: "Shaker Groove Engine", category: "Amapiano", description: "Intelligent percussion enhancement" },
  { name: "3D Imager", category: "Amapiano", description: "Spatial width and depth control" },
  { name: "Gospel Harmonizer", category: "Amapiano", description: "Authentic chord voicing enhancement" }
];

export const DAWSidebar: React.FC<DAWSidebarProps> = ({
  showAIAssistant,
  showHighSpeedEngine,
  showUnifiedAnalysis,
  aiPrompt,
  isGenerating,
  onAIPromptChange,
  onAIGenerate,
  onToggleUnifiedAnalysis,
  onAddTrack,
  onAddEffect,
}) => {
  return (
    <div className={cn(
      "hidden lg:block bg-muted/10 border-r border-border overflow-y-auto transition-all duration-200",
      showAIAssistant ? 'lg:w-80 xl:w-96' : 'lg:w-64 xl:w-72'
    )}>
      <Tabs defaultValue="instruments" className="h-full">
        <TabsList className="grid w-full grid-cols-3 m-2 bg-muted/20">
          <TabsTrigger 
            value="instruments" 
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
          >
            Instruments
          </TabsTrigger>
          <TabsTrigger 
            value="effects" 
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
          >
            Effects
          </TabsTrigger>
          <TabsTrigger 
            value="ai-assistant" 
            className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
          >
            AI Tools
          </TabsTrigger>
        </TabsList>

        {/* Instruments Tab */}
        <TabsContent value="instruments" className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Amapiano Instruments</h3>
            <div className="space-y-2">
              {instruments.map((instrument) => {
                const Icon = instrument.icon;
                return (
                  <Card 
                    key={instrument.name} 
                    className="p-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">{instrument.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{instrument.description}</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => onAddTrack(instrument)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="p-4 space-y-4">
          <div className="space-y-4">
            {["Core", "Amapiano"].map((category) => (
              <div key={category}>
                <h4 className="font-semibold mb-2 text-sm">{category} Effects</h4>
                <div className="space-y-1">
                  {effects
                    .filter(effect => effect.category === category)
                    .map((effect) => (
                      <Card 
                        key={effect.name} 
                        className="p-2 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{effect.name}</div>
                            <div className="text-xs text-muted-foreground">{effect.description}</div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => onAddEffect(effect.name)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="ai-assistant" className="p-4 space-y-4">
          <div>
            {/* High-Speed Engine Status */}
            {showHighSpeedEngine && (
              <div className="mb-4">
                <HighSpeedDAWEngine 
                  onInitialized={() => console.log('✓ High-speed C++ engine ready')}
                  showMetrics={true}
                />
              </div>
            )}

            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              AI Assistant
            </h3>
            
            <Card className="p-3 mb-4 bg-muted/20 border-border">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Natural Language Prompt
                  </label>
                  <Input
                    placeholder="Generate a log drum pattern..."
                    value={aiPrompt}
                    onChange={(e) => onAIPromptChange(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>
                <Button 
                  size="sm" 
                  className="w-full" 
                  onClick={() => onAIGenerate(aiPrompt)} 
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 mr-2" />
                  )}
                  Generate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={onToggleUnifiedAnalysis}
                >
                  <Sparkles className="w-3 h-3 mr-2" />
                  AI Track Analysis
                </Button>
              </div>
            </Card>

            {/* Quick Suggestions */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Suggestions</h4>
              <div className="space-y-1">
                {[
                  "Generate log drum pattern in F# minor",
                  "Add percussion layer",
                  "Create bass line",
                  "Generate piano chords"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7"
                    onClick={() => {
                      onAIPromptChange(suggestion);
                      onAIGenerate(suggestion);
                    }}
                  >
                    <Zap className="w-3 h-3 mr-2 text-primary" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DAWSidebar;
