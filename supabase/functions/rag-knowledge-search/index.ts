import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, currentContext, knowledgeBase } = await req.json();
    console.log(`[RAG-SEARCH] Query: ${query}`);

    const enhancedResults = knowledgeBase.map((item: any) => {
      let score = 0;
      const queryLower = query.toLowerCase();
      const contextLower = (currentContext || '').toLowerCase();

      // Title match
      if (item.title.toLowerCase().includes(queryLower)) {
        score += 0.4;
      }

      // Content match
      const contentMatches = (item.content.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
      score += Math.min(contentMatches * 0.05, 0.3);

      // Tag match
      const tagMatches = item.tags.filter((tag: string) => 
        tag.toLowerCase().includes(queryLower)
      ).length;
      score += Math.min(tagMatches * 0.1, 0.2);

      // Context relevance
      if (currentContext) {
        const contextWords = contextLower.split(/\s+/);
        const relevantWords = contextWords.filter((word: string) => 
          item.content.toLowerCase().includes(word) || item.title.toLowerCase().includes(word)
        ).length;
        score += Math.min(relevantWords * 0.02, 0.1);
      }

      return {
        id: item.id,
        score: Math.min(score, 1)
      };
    });

    enhancedResults.sort((a: any, b: any) => b.score - a.score);

    return new Response(
      JSON.stringify({ enhancedResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[RAG-SEARCH] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Search failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
