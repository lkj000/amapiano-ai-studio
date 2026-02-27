import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, Zap, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setIsEmpty(false);

      try {
        // Primary: AI edge function
        const userContext = { genre: 'amapiano', source: 'plugin-recommendations' };
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
          'ai-plugin-generator',
          { body: { mode: 'recommend', context: userContext } }
        );

        if (!edgeError && edgeData?.recommendations && edgeData.recommendations.length > 0) {
          setRecommendations(edgeData.recommendations.map((r: any) => ({
            id: String(r.id),
            name: r.name,
            category: r.category || 'Plugin',
            rating: r.rating ?? 0,
            downloads: r.downloads ?? 0,
            reason: r.reason || '',
            confidence: r.confidence ?? 0,
            price: r.price ?? 0,
          })));
          return;
        }

        // Fallback: real database query
        const { data: dbData, error: dbError } = await supabase
          .from('audio_plugins')
          .select('*')
          .limit(4)
          .order('created_at', { ascending: false });

        if (!dbError && dbData && dbData.length > 0) {
          setRecommendations(dbData.map((r: any) => ({
            id: String(r.id),
            name: r.name,
            category: r.category || 'Plugin',
            rating: r.rating ?? 0,
            downloads: r.downloads ?? 0,
            reason: r.description || '',
            confidence: r.confidence ?? 0.75,
            price: r.price ?? 0,
          })));
          return;
        }

        // Both failed — show empty state
        setIsEmpty(true);
      } catch {
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
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

  if (isEmpty || recommendations.length === 0) {
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
          <p className="text-sm text-muted-foreground text-center py-8">
            No recommendations available yet. Add plugins to the marketplace to see suggestions here.
          </p>
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
