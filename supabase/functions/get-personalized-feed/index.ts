import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FeedRequest {
  userId?: string;
  feedType: 'discover' | 'following' | 'trending';
  limit: number;
  offset: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, feedType, limit, offset }: FeedRequest = await req.json();

    console.log('Feed request:', { userId, feedType, limit, offset });

    let posts = [];

    try {
      // Try to get real posts from database
      const { data, error } = await supabase
        .rpc('get_personalized_feed', {
          p_user_id: userId || null,
          p_limit: limit,
          p_offset: offset
        });

      if (error) throw error;
      posts = data || [];

    } catch (dbError) {
      console.error('Database query failed:', dbError);
      throw new Error('Failed to fetch posts from database');
    }

    // Fetch user preferences once so they can be used for both ordering and reason labelling
    const userPrefs = userId ? await getUserPreferences(userId) : {
      favoriteGenres: [],
      followedArtists: [],
      engagementHistory: { totalLikes: 0, totalPlays: 0, averageListenTime: 0 }
    };

    // Apply AI-powered feed ordering based on user preferences
    if (userId && posts.length > 0) {
      posts = await personalizePostOrder(posts, userId, feedType, userPrefs);
    }

    // Add engagement predictions
    posts = posts.map((post: any) => ({
      ...post,
      predicted_engagement: calculateEngagementPrediction(post, feedType),
      recommendation_reason: getRecommendationReason(post, feedType, userPrefs, userId)
    }));

    const response = {
      success: true,
      posts,
      metadata: {
        feedType,
        totalPosts: posts.length,
        hasMore: posts.length === limit,
        personalized: !!userId,
        timestamp: new Date().toISOString()
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Error generating personalized feed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate personalized feed',
        details: (error as Error).message
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});

function generateDescription(genre: string, feedType: string): string {
  const descriptions: Record<string, string[]> = {
    'Classic Amapiano': [
      'Authentic log drums and soulful piano melodies define this classic amapiano masterpiece',
      'Traditional amapiano sound with deep basslines and signature South African rhythms'
    ],
    'Private School': [
      'Sophisticated jazz influences meet modern amapiano in this polished production',
      'Refined amapiano with live instrumentation and complex harmonic progressions'
    ],
    'Deep Amapiano': [
      'Deep, atmospheric soundscapes with subtle percussion and ethereal melodies',
      'Hypnotic basslines and minimal arrangement create a meditative amapiano experience'
    ],
    'Vocal': [
      'Powerful vocals soar over lush amapiano production in this emotional journey',
      'Soulful singing combines with traditional amapiano elements for maximum impact'
    ],
    'Jazz Amapiano': [
      'Jazz harmonies and improvisation meet the amapiano groove in this fusion masterpiece',
      'Sophisticated chord progressions and live saxophone elevate this amapiano composition'
    ]
  };

  const genreDescriptions = descriptions[genre] || descriptions['Classic Amapiano'];
  // Deterministic selection based on genre string so the same genre always gets the same description
  return genreDescriptions[genre.length % genreDescriptions.length];
}

// Deterministic hash for stable per-user-per-track noise (avoids Math.random() drift)
function deterministicNoise(userId: string, trackId: string): number {
  let hash = 0;
  const str = `${userId}:${trackId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  // Normalise to [-0.05, 0.05] — small stable nudge so identical base scores break ties consistently
  return ((hash % 1000) / 1000 - 0.5) * 0.1;
}

async function personalizePostOrder(
  posts: any[],
  userId: string,
  feedType: string,
  userPreferences: { favoriteGenres: string[]; followedArtists: string[]; engagementHistory: any }
) {
  return posts.sort((a, b) => {
    let scoreA = a.relevance_score || 0;
    let scoreB = b.relevance_score || 0;

    // Boost posts based on user preferences
    if (userPreferences.favoriteGenres.includes(a.genre_tags?.[0])) {
      scoreA += 2;
    }
    if (userPreferences.favoriteGenres.includes(b.genre_tags?.[0])) {
      scoreB += 2;
    }

    // Boost posts from followed artists
    if (userPreferences.followedArtists.includes(a.creator_id)) {
      scoreA += 3;
    }
    if (userPreferences.followedArtists.includes(b.creator_id)) {
      scoreB += 3;
    }

    // Time decay for discovery feed
    if (feedType === 'discover') {
      const ageA = Date.now() - new Date(a.created_at).getTime();
      const ageB = Date.now() - new Date(b.created_at).getTime();
      scoreA -= ageA / (1000 * 60 * 60 * 24); // Reduce score by age in days
      scoreB -= ageB / (1000 * 60 * 60 * 24);
    }

    // Add stable per-user-per-track noise instead of Math.random()
    scoreA += deterministicNoise(userId, String(a.id));
    scoreB += deterministicNoise(userId, String(b.id));

    return scoreB - scoreA;
  });
}

async function getUserPreferences(userId: string) {
  // Fetch real user preferences from database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !preferences) {
      return {
        favoriteGenres: [],
        followedArtists: [],
        engagementHistory: { totalLikes: 0, totalPlays: 0, averageListenTime: 0 }
      };
    }
    
    return {
      favoriteGenres: preferences.favorite_genres || [],
      followedArtists: preferences.followed_artists || [],
      engagementHistory: preferences.engagement_history || { totalLikes: 0, totalPlays: 0, averageListenTime: 0 }
    };
  } catch {
    return {
      favoriteGenres: [],
      followedArtists: [],
      engagementHistory: { totalLikes: 0, totalPlays: 0, averageListenTime: 0 }
    };
  }
}

function calculateEngagementPrediction(post: any, feedType: string): number {
  let prediction = 0;
  
  // Base prediction on historical performance
  prediction += (post.play_count / 1000) * 0.3;
  prediction += (post.like_count / 100) * 0.4;
  prediction += (post.comment_count / 10) * 0.2;
  prediction += (post.share_count / 50) * 0.1;

  // Adjust based on feed type
  switch (feedType) {
    case 'trending':
      prediction *= 1.5; // Trending posts have higher engagement potential
      break;
    case 'following':
      prediction *= 1.2; // Following posts have good engagement
      break;
    default:
      prediction *= 1.0; // Discovery baseline
  }

  return Math.min(Math.max(prediction, 0), 1); // Clamp between 0 and 1
}

function getRecommendationReason(
  post: any,
  feedType: string,
  userPrefs: { favoriteGenres: string[]; followedArtists: string[]; engagementHistory: any },
  userId?: string
): string {
  // Deterministic, data-driven reason selection

  // 1. From an artist the user follows
  if (userId && userPrefs.followedArtists.includes(post.creator_id)) {
    return 'From an artist you follow';
  }

  // 2. Matches user's top-listened genre (first favourite genre)
  const topGenre = userPrefs.favoriteGenres[0];
  if (topGenre && post.genre_tags?.includes(topGenre)) {
    return 'Matches your favorite genre';
  }

  // 3. New release — created within the last 7 days
  if (post.created_at) {
    const ageMs = Date.now() - new Date(post.created_at).getTime();
    if (ageMs < 7 * 24 * 60 * 60 * 1000) {
      return 'New release';
    }
  }

  // 4. BPM within 10 of user's average listening BPM (stored in engagementHistory)
  const avgBpm: number | undefined = userPrefs.engagementHistory?.averageListeningBpm;
  if (avgBpm && post.bpm && Math.abs(post.bpm - avgBpm) <= 10) {
    return 'Matches your preferred tempo';
  }

  // 5. Fallback
  return 'Popular in Amapiano community';
}