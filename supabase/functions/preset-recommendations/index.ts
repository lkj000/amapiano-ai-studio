import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserProductionHistory {
  userId: string;
  recentProjects: Array<{
    bpm: number;
    key: string;
    genre: string;
    presetUsed?: string;
    completionRate: number;
  }>;
  preferredArtists?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

interface RecommendationRequest {
  userHistory: UserProductionHistory;
  currentContext?: {
    selectedTrack?: string;
    projectBpm?: number;
    projectKey?: string;
  };
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userHistory, currentContext, limit = 5 }: RecommendationRequest = await req.json();

    console.log('Preset Recommendation Request:', {
      userId: userHistory.userId,
      projectCount: userHistory.recentProjects.length,
      context: currentContext
    });

    // Analyze user patterns
    const patterns = analyzeUserPatterns(userHistory);
    
    // Generate AI-powered recommendations
    const recommendations = generateRecommendations(patterns, currentContext, limit);
    
    // Calculate confidence scores
    const scoredRecommendations = recommendations.map(rec => ({
      ...rec,
      matchScore: calculateMatchScore(rec, patterns, currentContext),
      reasoning: generateReasoning(rec, patterns, currentContext)
    })).sort((a, b) => b.matchScore - a.matchScore);

    console.log('Generated Recommendations:', scoredRecommendations.length);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: scoredRecommendations.slice(0, limit),
        userProfile: {
          dominantBpmRange: patterns.bpmRange,
          preferredKeys: patterns.preferredKeys,
          stylePreference: patterns.stylePreference,
          experienceLevel: patterns.experienceLevel
        },
        insights: generateInsights(patterns)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Preset Recommendation Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function analyzeUserPatterns(history: UserProductionHistory) {
  const projects = history.recentProjects;
  
  // BPM analysis
  const bpms = projects.map(p => p.bpm);
  const avgBpm = bpms.reduce((a, b) => a + b, 0) / bpms.length;
  const bpmRange: [number, number] = [
    Math.max(110, avgBpm - 5),
    Math.min(125, avgBpm + 5)
  ];
  
  // Key preference analysis
  const keyCount: Record<string, number> = {};
  projects.forEach(p => {
    keyCount[p.key] = (keyCount[p.key] || 0) + 1;
  });
  const preferredKeys = Object.entries(keyCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);
  
  // Genre/style preference
  const genreCount: Record<string, number> = {};
  projects.forEach(p => {
    genreCount[p.genre] = (genreCount[p.genre] || 0) + 1;
  });
  const stylePreference = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'classic';
  
  // Experience level based on completion rates
  const avgCompletion = projects.reduce((a, b) => a + b.completionRate, 0) / projects.length;
  let experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (avgCompletion > 0.7) experienceLevel = 'advanced';
  else if (avgCompletion > 0.4) experienceLevel = 'intermediate';
  
  // Preset usage patterns
  const presetUsage = projects.filter(p => p.presetUsed).map(p => p.presetUsed);
  
  return {
    bpmRange,
    preferredKeys,
    stylePreference,
    experienceLevel,
    presetUsage,
    avgCompletion,
    projectCount: projects.length
  };
}

function generateRecommendations(
  patterns: ReturnType<typeof analyzeUserPatterns>,
  context?: RecommendationRequest['currentContext'],
  limit: number = 5
) {
  // Preset database (in production, this would query from actual preset data)
  const presets = [
    // Private School
    { id: 'kelvin-momo-signature', artist: 'Kelvin Momo', category: 'private-school', bpm: 116, key: 'F#m', difficulty: 'intermediate' },
    { id: 'mfr-souls-deep', artist: 'MFR Souls', category: 'private-school', bpm: 115, key: 'Am', difficulty: 'intermediate' },
    { id: 'vigro-deep-signature', artist: 'Vigro Deep', category: 'private-school', bpm: 113, key: 'F#m', difficulty: 'advanced' },
    { id: 'pretoria-sound', artist: 'Regional Style', category: 'private-school', bpm: 112, key: 'Em', difficulty: 'advanced' },
    { id: 'live-band-fusion', artist: 'Hybrid Style', category: 'private-school', bpm: 114, key: 'D', difficulty: 'intermediate' },
    
    // Classic
    { id: 'kabza-bounce', artist: 'Kabza De Small', category: 'classic', bpm: 118, key: 'Cm', difficulty: 'intermediate' },
    { id: 'classic-log-heavy', artist: 'Generic', category: 'classic', bpm: 118, key: 'F#m', difficulty: 'beginner' },
    { id: 'de-mthuda-groovy', artist: 'De Mthuda', category: 'classic', bpm: 118, key: 'Dm', difficulty: 'intermediate' },
    { id: 'durban-bounce', artist: 'Regional Style', category: 'classic', bpm: 120, key: 'Cm', difficulty: 'advanced' },
    { id: 'joburg-commercial', artist: 'Regional Style', category: 'classic', bpm: 118, key: 'G', difficulty: 'beginner' },
    
    // Bacardi
    { id: 'bacardi-groove', artist: 'Generic', category: 'bacardi', bpm: 112, key: 'Gm', difficulty: 'intermediate' },
    { id: 'vigro-deep-melodic', artist: 'Vigro Deep', category: 'bacardi', bpm: 114, key: 'Gm', difficulty: 'intermediate' },
    { id: 'afro-tech-blend', artist: 'Hybrid Style', category: 'bacardi', bpm: 115, key: 'Am', difficulty: 'advanced' },
    
    // Soulful
    { id: 'soulful-vocal-blend', artist: 'Generic', category: 'soulful', bpm: 116, key: 'Eb', difficulty: 'beginner' },
    { id: 'mfr-souls-uplifting', artist: 'MFR Souls', category: 'soulful', bpm: 117, key: 'C', difficulty: 'intermediate' },
    { id: 'de-mthuda-vocal', artist: 'De Mthuda', category: 'soulful', bpm: 116, key: 'Bb', difficulty: 'beginner' },
    { id: 'gospel-amapiano', artist: 'Spiritual Style', category: 'soulful', bpm: 116, key: 'C', difficulty: 'beginner' }
  ];
  
  return presets;
}

function calculateMatchScore(
  preset: any,
  patterns: ReturnType<typeof analyzeUserPatterns>,
  context?: RecommendationRequest['currentContext']
): number {
  let score = 0;
  
  // BPM match (30% weight)
  const bpmDiff = Math.abs(preset.bpm - ((patterns.bpmRange[0] + patterns.bpmRange[1]) / 2));
  score += Math.max(0, 30 - (bpmDiff * 3));
  
  // Key preference (20% weight)
  if (patterns.preferredKeys.includes(preset.key)) {
    score += 20;
  }
  
  // Style preference (25% weight)
  if (preset.category === patterns.stylePreference) {
    score += 25;
  }
  
  // Difficulty match (15% weight)
  if (preset.difficulty === patterns.experienceLevel) {
    score += 15;
  } else if (
    (preset.difficulty === 'intermediate' && patterns.experienceLevel === 'beginner') ||
    (preset.difficulty === 'beginner' && patterns.experienceLevel === 'intermediate')
  ) {
    score += 10; // Partial credit for adjacent levels
  }
  
  // Context bonus (10% weight)
  if (context?.projectBpm && Math.abs(preset.bpm - context.projectBpm) < 3) {
    score += 10;
  }
  
  return Math.min(100, score);
}

function generateReasoning(
  preset: any,
  patterns: ReturnType<typeof analyzeUserPatterns>,
  context?: RecommendationRequest['currentContext']
): string {
  const reasons: string[] = [];
  
  const avgBpm = (patterns.bpmRange[0] + patterns.bpmRange[1]) / 2;
  if (Math.abs(preset.bpm - avgBpm) < 3) {
    reasons.push(`Matches your typical ${Math.round(avgBpm)} BPM range`);
  }
  
  if (patterns.preferredKeys.includes(preset.key)) {
    reasons.push(`You frequently work in ${preset.key}`);
  }
  
  if (preset.category === patterns.stylePreference) {
    reasons.push(`Aligns with your ${patterns.stylePreference} style preference`);
  }
  
  if (preset.difficulty === patterns.experienceLevel) {
    reasons.push(`Perfect for your ${patterns.experienceLevel} skill level`);
  }
  
  if (patterns.presetUsage.includes(preset.id)) {
    reasons.push(`You've successfully used this before`);
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Popular choice for similar producers';
}

function generateInsights(patterns: ReturnType<typeof analyzeUserPatterns>): string[] {
  const insights: string[] = [];
  
  const avgBpm = (patterns.bpmRange[0] + patterns.bpmRange[1]) / 2;
  insights.push(`You typically produce at ${Math.round(avgBpm)} BPM (${patterns.bpmRange[0]}-${patterns.bpmRange[1]} range)`);
  
  insights.push(`Preferred keys: ${patterns.preferredKeys.join(', ')}`);
  
  insights.push(`Style focus: ${patterns.stylePreference} amapiano`);
  
  if (patterns.avgCompletion > 0.7) {
    insights.push(`High completion rate (${(patterns.avgCompletion * 100).toFixed(0)}%) - you finish what you start!`);
  } else if (patterns.avgCompletion < 0.4) {
    insights.push(`Try simpler presets to boost your ${(patterns.avgCompletion * 100).toFixed(0)}% completion rate`);
  }
  
  insights.push(`${patterns.projectCount} projects analyzed for personalization`);
  
  return insights;
}
