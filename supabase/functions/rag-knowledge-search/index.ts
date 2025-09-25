import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('RAG Knowledge Search request received');
    const { query, currentContext, knowledgeBase } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    console.log(`Enhancing search for query: "${query}"`);

    // Use AI to understand the search intent and enhance results
    const enhancedResults = await enhanceSearchWithAI(query, currentContext, knowledgeBase);
    
    return new Response(JSON.stringify({ 
      success: true,
      query,
      enhancedResults,
      totalResults: enhancedResults.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rag-knowledge-search function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function enhanceSearchWithAI(query: string, currentContext: any, knowledgeBase: any[]) {
  try {
    if (!openAIApiKey) {
      console.log('OpenAI API key not available, using fallback search');
      return performFallbackSearch(query, knowledgeBase);
    }

    // Use OpenAI to understand search intent and enhance relevance
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant specialized in amapiano music knowledge. Analyze search queries and enhance search results by understanding user intent.

            Your task:
            1. Understand the search query in the context of amapiano music production
            2. Score the relevance of each knowledge item (0-1 scale)
            3. Consider the current context (what the user is working on)
            4. Return enhanced results with improved relevance scoring

            Knowledge types:
            - cultural: South African music culture, traditions, authenticity
            - technical: Production techniques, mixing, mastering
            - artist: Specific artist analysis and styles
            - technique: Specific musical techniques and methods
            - history: Historical context and evolution

            Return a JSON array of results with enhanced scores:
            [{"id": "item_id", "score": 0.95, "reasoning": "why this is relevant"}]`
          },
          {
            role: 'user',
            content: `Search Query: "${query}"
            
            Current Context: ${currentContext ? JSON.stringify(currentContext) : 'None'}
            
            Available Knowledge Items:
            ${knowledgeBase.map((item: any, index: number) => 
              `${index + 1}. ID: ${item.id}
              Title: ${item.title}
              Type: ${item.type}
              Tags: ${item.tags.join(', ')}
              Content Preview: ${item.content.substring(0, 200)}...`
            ).join('\n\n')}
            
            Please analyze the search intent and provide enhanced relevance scores for each knowledge item.`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return performFallbackSearch(query, knowledgeBase);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    console.log('AI enhanced search response:', aiResponse);

    // Try to parse JSON response
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const enhancedResults = JSON.parse(jsonMatch[0]);
        
        // Validate and sanitize results
        return enhancedResults
          .filter((result: any) => result.id && result.score !== undefined)
          .map((result: any) => ({
            id: result.id,
            score: Math.min(Math.max(result.score, 0), 1), // Clamp between 0-1
            reasoning: result.reasoning || 'Enhanced by AI'
          }))
          .sort((a: any, b: any) => b.score - a.score);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Fallback if AI response parsing fails
    return performFallbackSearch(query, knowledgeBase);

  } catch (error) {
    console.error('AI enhancement error:', error);
    return performFallbackSearch(query, knowledgeBase);
  }
}

function performFallbackSearch(query: string, knowledgeBase: any[]) {
  console.log('Performing fallback search');
  
  const queryLower = query.toLowerCase();
  
  return knowledgeBase.map((item: any) => {
    let score = 0;
    
    // Title match (highest weight)
    if (item.title.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }
    
    // Tag matches (high weight)
    const tagMatches = item.tags.filter((tag: string) => 
      tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
    );
    score += tagMatches.length * 0.2;
    
    // Content matches (medium weight)
    const contentMatches = (item.content.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
    score += contentMatches * 0.05;
    
    // Type relevance bonus
    if (queryLower.includes('cultural') && item.type === 'cultural') score += 0.2;
    if (queryLower.includes('technical') && item.type === 'technical') score += 0.2;
    if (queryLower.includes('artist') && item.type === 'artist') score += 0.2;
    if (queryLower.includes('technique') && item.type === 'technique') score += 0.2;
    if (queryLower.includes('history') && item.type === 'history') score += 0.2;
    
    // Amapiano-specific keyword bonuses
    const amapianoKeywords = [
      'log drum', 'piano', 'bass', 'amapiano', 'south african', 
      'kabza', 'maphorisa', 'private school', 'jazz', 'township'
    ];
    
    amapianoKeywords.forEach(keyword => {
      if (queryLower.includes(keyword) && 
          (item.title.toLowerCase().includes(keyword) || 
           item.content.toLowerCase().includes(keyword) ||
           item.tags.some((tag: string) => tag.toLowerCase().includes(keyword)))) {
        score += 0.15;
      }
    });
    
    return {
      id: item.id,
      score: Math.min(score, 1), // Cap at 1.0
      reasoning: 'Fallback keyword matching'
    };
  })
  .filter((result: any) => result.score > 0)
  .sort((a: any, b: any) => b.score - a.score);
}