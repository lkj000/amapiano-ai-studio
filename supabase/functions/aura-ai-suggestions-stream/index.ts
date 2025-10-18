import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AURA AI Suggestions - Streaming Version
 * Streams AI suggestions in real-time for better UX
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
    console.log('🎵 AURA AI Suggestions Stream - Type:', suggestion_type);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context-aware prompts
    const systemPrompt = buildSystemPrompt(suggestion_type);
    const userPrompt = buildUserPrompt(context, suggestion_type);

    console.log('📡 Starting AI stream with gemini-2.5-flash...');
    
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
        stream: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits to your workspace.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI request failed: ${response.status}`);
    }

    // Return the stream directly to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in aura-ai-suggestions-stream:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(suggestionType: string): string {
  return `You are AURA, an expert amapiano music production AI assistant. Provide clear, actionable suggestions for ${suggestionType}.

Format your response as:
1. **Title**: Brief suggestion title
2. **Why**: Explanation of the benefit
3. **How**: Step-by-step implementation
4. **Amapiano Context**: Cultural/stylistic relevance

Keep suggestions specific, practical, and culturally authentic to South African amapiano.`;
}

function buildUserPrompt(context: any, suggestionType: string): string {
  let prompt = `Analyze this production context and provide ${suggestionType} suggestions:\n\n`;
  
  if (context.genre) prompt += `Genre: ${context.genre}\n`;
  if (context.bpm) prompt += `BPM: ${context.bpm}\n`;
  if (context.key) prompt += `Key: ${context.key}\n`;
  if (context.existing_elements?.length) {
    prompt += `Existing elements: ${context.existing_elements.join(', ')}\n`;
  }
  if (context.user_intent) prompt += `\nUser's request: ${context.user_intent}\n`;
  
  prompt += `\nProvide 3 high-quality, specific suggestions.`;
  
  return prompt;
}
