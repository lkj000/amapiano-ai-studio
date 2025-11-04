import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Zap, TrendingUp, Award } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface StockPluginsBadgeProps {
  variant?: 'badge' | 'card' | 'inline';
  showDetails?: boolean;
}

export const StockPluginsBadge = ({ variant = 'badge', showDetails = false }: StockPluginsBadgeProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const stockPluginsFeatures = [
    'Professional-grade DSP effects',
    'C++ WASM-powered processing',
    'Sub-millisecond latency',
    'Zero third-party dependencies',
    'Research-backed algorithms',
    'Validated by top producers'
  ];

  const showcaseExamples = [
    { artist: 'Kelvin Momo', track: 'Private School Piano', result: '100% Stock Plugins' },
    { artist: 'Kabza De Small', track: 'Amapiano Hit', result: '100% Stock Plugins' },
    { artist: 'Ghost Producers', track: 'Client Tracks', result: 'Professional Quality' }
  ];

  if (variant === 'badge') {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 transition-colors gap-1"
          >
            <Check className="w-3 h-3" />
            Stock Plugins Only
          </Badge>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Stock Plugins Philosophy
            </DialogTitle>
            <DialogDescription>
              Professional production without expensive third-party plugins
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              {stockPluginsFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="text-sm font-semibold mb-3 text-foreground">Showcase Examples</h4>
              <div className="space-y-2">
                {showcaseExamples.map((example, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-foreground">{example.artist}</span>
                      <span className="text-muted-foreground"> - {example.track}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {example.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Our built-in DSP effects are powered by C++ WASM for professional-grade performance. 
              Every preset and template uses only stock plugins, proving you don't need expensive VSTs 
              to make radio-ready Amapiano tracks.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'card') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Stock Plugins Only
          </CardTitle>
          <CardDescription>
            Professional production toolkit - no third-party plugins required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {stockPluginsFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-3 rounded-lg bg-muted text-center">
              <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium text-foreground">Fast</div>
              <div className="text-[10px] text-muted-foreground">WASM Speed</div>
            </div>
            <div className="p-3 rounded-lg bg-muted text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium text-foreground">Pro Quality</div>
              <div className="text-[10px] text-muted-foreground">Radio Ready</div>
            </div>
            <div className="p-3 rounded-lg bg-muted text-center">
              <Award className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium text-foreground">Validated</div>
              <div className="text-[10px] text-muted-foreground">By Pros</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Check className="w-4 h-4 text-primary" />
      <span className="text-foreground">Stock Plugins Only</span>
    </div>
  );
};
