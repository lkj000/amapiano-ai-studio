import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  TrendingUp, 
  Target,
  Brain,
  Star,
  Info,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PresetRecommendation {
  id: string;
  artist: string;
  category: string;
  bpm: number;
  key: string;
  difficulty: string;
  matchScore: number;
  reasoning: string;
}

interface UserProfile {
  dominantBpmRange: [number, number];
  preferredKeys: string[];
  stylePreference: string;
  experienceLevel: string;
}

interface SmartPresetRecommendationsProps {
  userId: string;
  currentProjectBpm?: number;
  currentProjectKey?: string;
  onPresetSelect: (presetId: string) => void;
  className?: string;
}

export const SmartPresetRecommendations = ({
  userId,
  currentProjectBpm,
  currentProjectKey,
  onPresetSelect,
  className
}: SmartPresetRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<PresetRecommendation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [userId, currentProjectBpm, currentProjectKey]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // In production, this would fetch from actual database
      // For now, simulate user history
      const mockUserHistory = {
        userId,
        recentProjects: [
          { bpm: 116, key: 'F#m', genre: 'private-school', completionRate: 0.8 },
          { bpm: 118, key: 'Cm', genre: 'classic', completionRate: 0.9, presetUsed: 'kabza-bounce' },
          { bpm: 115, key: 'Am', genre: 'private-school', completionRate: 0.75 },
          { bpm: 117, key: 'F#m', genre: 'private-school', completionRate: 0.85 },
          { bpm: 114, key: 'Gm', genre: 'bacardi', completionRate: 0.7 }
        ],
        preferredArtists: ['Kelvin Momo', 'Vigro Deep'],
        skillLevel: 'intermediate' as const
      };

      const { data, error } = await supabase.functions.invoke('preset-recommendations', {
        body: {
          userHistory: mockUserHistory,
          currentContext: {
            projectBpm: currentProjectBpm,
            projectKey: currentProjectKey
          },
          limit: 5
        }
      });

      if (error) throw error;

      if (data.success) {
        setRecommendations(data.recommendations);
        setUserProfile(data.userProfile);
        setInsights(data.insights);
        toast.success('AI recommendations loaded', {
          description: `Found ${data.recommendations.length} perfect matches`
        });
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast.error('Failed to load recommendations', {
        description: 'Using fallback presets'
      });
      // Fallback recommendations
      setRecommendations([
        { id: 'kelvin-momo-signature', artist: 'Kelvin Momo', category: 'private-school', bpm: 116, key: 'F#m', difficulty: 'intermediate', matchScore: 95, reasoning: 'Best match for your style' },
        { id: 'vigro-deep-signature', artist: 'Vigro Deep', category: 'private-school', bpm: 113, key: 'F#m', difficulty: 'advanced', matchScore: 88, reasoning: 'Advanced percussion patterns' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Decent Match';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your production style...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Preset Recommendations
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                Personalized
              </Badge>
            </CardTitle>
            <CardDescription>
              Smart suggestions based on your production history
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Profile Summary */}
        {userProfile && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Your Production Profile</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">BPM Range:</span>
                <span className="ml-2 font-medium">{userProfile.dominantBpmRange[0]}-{userProfile.dominantBpmRange[1]}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Style:</span>
                <span className="ml-2 font-medium capitalize">{userProfile.stylePreference}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Keys:</span>
                <span className="ml-2 font-medium">{userProfile.preferredKeys.slice(0, 2).join(', ')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>
                <span className="ml-2 font-medium capitalize">{userProfile.experienceLevel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Insights Panel */}
        {showInsights && insights.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Your Production Insights
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
          </>
        )}

        {/* Recommendations List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Top Matches
          </h4>
          {recommendations.map((rec, index) => (
            <div
              key={rec.id}
              className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => {
                onPresetSelect(rec.id);
                toast.success(`Loaded: ${rec.artist}`, {
                  description: rec.reasoning
                });
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{rec.artist}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {rec.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {rec.reasoning}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{rec.bpm} BPM</span>
                    <span>{rec.key}</span>
                    <span className="capitalize">{rec.difficulty}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(rec.matchScore)}`}>
                      {rec.matchScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {getScoreLabel(rec.matchScore)}
                    </div>
                  </div>
                  <Progress value={rec.matchScore} className="w-16 h-1" />
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={loadRecommendations}
          className="w-full"
        >
          <Sparkles className="w-3 h-3 mr-2" />
          Refresh Recommendations
        </Button>
      </CardContent>
    </Card>
  );
};
