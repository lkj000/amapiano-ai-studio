import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AURA AI Suggestions - Lovable AI Integration
 * Uses Lovable AI Gateway for intelligent music production suggestions
 */

interface SuggestionRequest {
  context: {
    current_track?: string;
    genre?: string;
    bpm?: number;
    key?: string;
    existing_elements?: string[];
    user_intent?: string;
  };
  suggestion_type: 'arrangement' | 'harmony' | 'rhythm' | 'effects' | 'mixing' | 'full_analysis';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context, suggestion_type }: SuggestionRequest = await req.json();
    console.log('🎵 AURA AI Suggestions - Type:', suggestion_type);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(suggestion_type);
    const userPrompt = buildUserPrompt(context, suggestion_type);

    console.log('📡 Calling Lovable AI with gemini-2.5-flash...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'provide_music_suggestions',
            description: 'Provide structured music production suggestions',
            parameters: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      implementation: { type: 'string' },
                      amapiano_context: { type: 'string' },
                      confidence: { type: 'number' }
                    },
                    required: ['category', 'priority', 'title', 'description', 'implementation'],
                    additionalProperties: false
                  }
                },
                overall_assessment: { type: 'string' },
                cultural_notes: { type: 'string' }
              },
              required: ['suggestions', 'overall_assessment'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_music_suggestions' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          fallback_suggestions: generateFallbackSuggestions(context, suggestion_type)
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits to your workspace.',
          fallback_suggestions: generateFallbackSuggestions(context, suggestion_type)
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Lovable AI response received');

    // Extract structured suggestions from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const suggestions = toolCall?.function?.arguments ? 
      JSON.parse(toolCall.function.arguments) : 
      { suggestions: [], overall_assessment: 'No suggestions generated' };

    return new Response(JSON.stringify({
      success: true,
      suggestions: suggestions.suggestions || [],
      overall_assessment: suggestions.overall_assessment,
      cultural_notes: suggestions.cultural_notes,
      ai_model: 'google/gemini-2.5-flash',
      powered_by: 'lovable_ai',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in aura-ai-suggestions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback_suggestions: generateFallbackSuggestions({}, 'full_analysis')
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(suggestionType: string): string {
  const basePrompt = `You are AURA, an expert amapiano music production AI assistant. You provide intelligent, culturally-authentic suggestions for amapiano music creation.

Key Amapiano Elements:
- Log drums (signature deep kick pattern)
- Piano/keyboard melodies (often jazzy, complex)
- Bass lines (deep, melodic, driving)
- Percussive elements (shakers, hi-hats, vocal chops)
- BPM typically 113-120
- Deep house influences with South African flavor

Your suggestions should be:
1. Specific and actionable
2. Culturally authentic to amapiano style
3. Technically sound for production
4. Creative yet practical`;

  const typeSpecific = {
    arrangement: '\n\nFocus on: Song structure, section transitions, build-ups, drops, energy flow',
    harmony: '\n\nFocus on: Chord progressions, key modulation, harmonic tension/release, jazz influences',
    rhythm: '\n\nFocus on: Drum patterns, log drum techniques, percussion layers, groove',
    effects: '\n\nFocus on: Reverb, delay, compression, sidechain, vocal effects, spatial effects',
    mixing: '\n\nFocus on: Level balancing, EQ, stereo imaging, depth, clarity',
    full_analysis: '\n\nProvide comprehensive analysis across all production aspects'
  };

  return basePrompt + (typeSpecific[suggestionType as keyof typeof typeSpecific] || typeSpecific.full_analysis);
}

function buildUserPrompt(context: any, suggestionType: string): string {
  let prompt = `Please analyze this amapiano production context and provide ${suggestionType} suggestions:\n\n`;
  
  if (context.genre) prompt += `Genre: ${context.genre}\n`;
  if (context.bpm) prompt += `BPM: ${context.bpm}\n`;
  if (context.key) prompt += `Key: ${context.key}\n`;
  if (context.existing_elements?.length) {
    prompt += `Existing elements: ${context.existing_elements.join(', ')}\n`;
  }
  if (context.user_intent) prompt += `\nUser's intent: ${context.user_intent}\n`;
  
  prompt += `\nProvide 3-5 high-quality suggestions that will elevate this production.`;
  
  return prompt;
}

function generateFallbackSuggestions(context: any, suggestionType: string) {
  return [
    {
      category: suggestionType,
      priority: 'high',
      title: 'Add Log Drum Pattern',
      description: 'Add the signature amapiano log drum kick pattern for authentic groove',
      implementation: 'Program a deep kick on beats 1, 1.5, 2.5, 3, with variations',
      amapiano_context: 'Essential for amapiano identity',
      confidence: 0.9
    },
    {
      category: suggestionType,
      priority: 'medium',
      title: 'Layer Piano Chords',
      description: 'Add jazzy piano chord progressions',
      implementation: 'Use 7th and 9th chords, with syncopated rhythm',
      amapiano_context: 'Creates harmonic richness',
      confidence: 0.85
    },
    {
      category: suggestionType,
      priority: 'medium',
      title: 'Add Percussive Elements',
      description: 'Layer shakers and hi-hats for groove',
      implementation: 'Add continuous 16th note shaker pattern with subtle variations',
      amapiano_context: 'Drives the rhythmic feel',
      confidence: 0.8
    }
  ];
}
