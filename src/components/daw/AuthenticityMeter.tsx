import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gauge, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  calculateAuthenticityScore, 
  benchmarkAgainstRegion,
  REGIONAL_BENCHMARKS,
  type AuthenticityScoreResult 
} from '@/lib/audio/authenticityScoring';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AuthenticityMeterProps {
  elementScores?: {
    logDrum?: number;
    piano?: number;
    percussion?: number;
    bass?: number;
    swing?: number;
    arrangement?: number;
    production?: number;
  };
  region?: string;
  isAnalyzing?: boolean;
  onRefreshAnalysis?: () => void;
  className?: string;
}

export const AuthenticityMeter: React.FC<AuthenticityMeterProps> = ({
  elementScores = {},
  region = 'johannesburg',
  isAnalyzing = false,
  onRefreshAnalysis,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Calculate score using ML-derived weights
  const scoreResult = useMemo(() => {
    return calculateAuthenticityScore(region, elementScores);
  }, [region, elementScores]);

  // Get benchmark comparison
  const benchmark = useMemo(() => {
    const regionBenchmark = REGIONAL_BENCHMARKS[region as keyof typeof REGIONAL_BENCHMARKS];
    if (regionBenchmark) {
      return benchmarkAgainstRegion(scoreResult, regionBenchmark);
    }
    return null;
  }, [scoreResult, region]);

  // Animate score on change
  useEffect(() => {
    const target = scoreResult.totalScore;
    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = (target - animatedScore) / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setAnimatedScore(prev => {
        const next = prev + increment;
        return step >= steps ? target : next;
      });
      if (step >= steps) clearInterval(timer);
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [scoreResult.totalScore]);

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  const getRatingBadgeColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'above-average': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'average': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default: return 'bg-red-500/20 text-red-600 border-red-500/30';
    }
  };

  return (
    <Card className={cn(
      "bg-gradient-to-br from-background via-background to-primary/5 border-primary/20",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Authenticity Score</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ')} Style
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Zap className="w-3 h-3" />
              Real-time
            </Badge>
            {onRefreshAnalysis && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onRefreshAnalysis}
                disabled={isAnalyzing}
              >
                <RefreshCw className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Score Display */}
        <div className="relative flex items-center justify-center py-6">
          {/* Circular gauge background */}
          <div className="relative w-40 h-40">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${animatedScore * 4.4} 440`}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                "text-4xl font-bold tabular-nums",
                getScoreColor(animatedScore)
              )}>
                {Math.round(animatedScore)}
              </span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        {benchmark && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{benchmark.comparisonText}</span>
            </div>
            <Badge 
              variant="outline" 
              className={cn("capitalize", getRatingBadgeColor(benchmark.rating))}
            >
              {benchmark.rating.replace('-', ' ')}
            </Badge>
          </div>
        )}

        {/* Confidence Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Analysis Confidence</span>
            <span className="font-medium">{Math.round(scoreResult.confidence * 100)}%</span>
          </div>
          <Progress value={scoreResult.confidence * 100} className="h-2" />
        </div>

        {/* Component Scores Collapsible */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Component Scores
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ScrollArea className="h-48">
              <div className="space-y-3 pr-4">
                {Object.entries(scoreResult.componentScores).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={cn("font-medium tabular-nums", getScoreColor(value))}>
                        {Math.round(value)}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all",
                          getScoreGradient(value)
                        )}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* Suggestions */}
        {scoreResult.suggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Improvement Suggestions
            </Label>
            <div className="space-y-2">
              {scoreResult.suggestions.slice(0, 3).map((suggestion, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Label component for internal use
const Label: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn("text-sm font-medium", className)}>{children}</div>
);

export default AuthenticityMeter;
