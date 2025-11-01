import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, Zap, Star } from 'lucide-react';

interface RecommendedPlugin {
  id: string;
  name: string;
  category: string;
  rating: number;
  downloads: number;
  reason: string;
  confidence: number;
  price: number;
}

export function AIPluginRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate AI recommendation generation
    setTimeout(() => {
      setRecommendations([
        {
          id: '1',
          name: 'Amapiano Bass Generator',
          category: 'Instrument',
          rating: 4.8,
          downloads: 1247,
          reason: 'Complements your recent synth purchases',
          confidence: 0.92,
          price: 1299,
        },
        {
          id: '2',
          name: 'Log Drum Enhancer',
          category: 'Effect',
          rating: 4.6,
          downloads: 892,
          reason: 'Popular with users who bought similar effects',
          confidence: 0.87,
          price: 999,
        },
        {
          id: '3',
          name: 'VAST Reverb Pro',
          category: 'Effect',
          rating: 4.9,
          downloads: 2134,
          reason: 'Top-rated in your preferred genre',
          confidence: 0.95,
          price: 1999,
        },
        {
          id: '4',
          name: 'Piano Roll Delay Ultra',
          category: 'Effect',
          rating: 4.7,
          downloads: 1523,
          reason: 'Frequently purchased together',
          confidence: 0.89,
          price: 1499,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return { label: 'Highly Recommended', variant: 'default' as const };
    if (confidence >= 0.8) return { label: 'Recommended', variant: 'secondary' as const };
    return { label: 'Suggested', variant: 'outline' as const };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>Generating personalized suggestions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Recommendations
        </CardTitle>
        <CardDescription>
          Personalized plugin suggestions based on your workflow and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((plugin) => {
            const confidenceBadge = getConfidenceBadge(plugin.confidence);
            return (
              <Card key={plugin.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{plugin.name}</h4>
                        <Badge variant={confidenceBadge.variant}>
                          {confidenceBadge.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {plugin.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {plugin.downloads.toLocaleString()} downloads
                        </span>
                        <Badge variant="outline">{plugin.category}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">{plugin.reason}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${plugin.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {(plugin.confidence * 100).toFixed(0)}% match
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div className="text-xl font-bold">
                        ${(plugin.price / 100).toFixed(2)}
                      </div>
                      <Button size="sm">
                        View Plugin
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">How recommendations work</p>
              <p className="text-muted-foreground">
                Our AI analyzes your purchase history, workflow patterns, and preferences to suggest plugins 
                that complement your existing setup and match your production style.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
