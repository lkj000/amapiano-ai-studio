import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * RAG Knowledge Search with Vector Embeddings
 * 
 * Uses OpenAI embeddings for semantic search instead of keyword matching.
 * This is a real AI-powered implementation for PhD research credibility.
 */

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  embedding?: number[];
}

interface SearchRequest {
  query: string;
  currentContext?: string;
  knowledgeBase: KnowledgeItem[];
  topK?: number;
}

// Compute cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

// Get embeddings from OpenAI
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit input length
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[RAG-SEARCH] Embedding API error:', error);
    throw new Error(`Embedding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Batch get embeddings for efficiency
async function getBatchEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.slice(0, 8000)),
    }),
  });

  if (!response.ok) {
    throw new Error(`Batch embedding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data.map((d: any) => d.embedding);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    const { query, currentContext, knowledgeBase, topK = 10 }: SearchRequest = await req.json();
    console.log(`[RAG-SEARCH] Query: ${query}`);

    // If no API key, fallback to enhanced keyword matching
    if (!OPENAI_API_KEY) {
      console.log('[RAG-SEARCH] No OpenAI key, using enhanced keyword fallback');
      return fallbackKeywordSearch(query, currentContext, knowledgeBase, topK, corsHeaders);
    }

    // Get query embedding (combine query with context for better relevance)
    const searchText = currentContext 
      ? `${query} Context: ${currentContext.slice(0, 500)}`
      : query;
    
    const queryEmbedding = await getEmbedding(searchText, OPENAI_API_KEY);
    console.log(`[RAG-SEARCH] Got query embedding, dim: ${queryEmbedding.length}`);

    // Get embeddings for all knowledge base items
    const texts = knowledgeBase.map(item => 
      `${item.title}. ${item.content.slice(0, 1000)}. Tags: ${item.tags.join(', ')}`
    );
    
    const itemEmbeddings = await getBatchEmbeddings(texts, OPENAI_API_KEY);
    console.log(`[RAG-SEARCH] Got ${itemEmbeddings.length} item embeddings`);

    // Calculate similarity scores
    const enhancedResults = knowledgeBase.map((item, index) => {
      const semanticScore = cosineSimilarity(queryEmbedding, itemEmbeddings[index]);
      
      // Boost score with keyword matching for hybrid search
      const queryLower = query.toLowerCase();
      let keywordBoost = 0;
      
      if (item.title.toLowerCase().includes(queryLower)) {
        keywordBoost += 0.1;
      }
      
      const tagMatches = item.tags.filter(tag => 
        tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
      ).length;
      keywordBoost += Math.min(tagMatches * 0.02, 0.1);

      return {
        id: item.id,
        score: Math.min(semanticScore + keywordBoost, 1),
        semanticScore,
        keywordBoost
      };
    });

    // Sort by combined score and take top K
    enhancedResults.sort((a, b) => b.score - a.score);
    const topResults = enhancedResults.slice(0, topK);

    console.log(`[RAG-SEARCH] Top result score: ${topResults[0]?.score.toFixed(3)}`);

    return new Response(
      JSON.stringify({ 
        enhancedResults: topResults,
        searchMethod: 'vector_embeddings',
        modelUsed: 'text-embedding-3-small'
      }),
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

// Fallback keyword search when embeddings unavailable
function fallbackKeywordSearch(
  query: string, 
  currentContext: string | undefined, 
  knowledgeBase: KnowledgeItem[], 
  topK: number,
  headers: Record<string, string>
): Response {
  const enhancedResults = knowledgeBase.map((item) => {
    let score = 0;
    const queryLower = query.toLowerCase();
    const contextLower = (currentContext || '').toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Title match with word-level scoring
    const titleLower = item.title.toLowerCase();
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 0.15;
      }
    }
    if (titleLower.includes(queryLower)) {
      score += 0.25;
    }

    // Content match with TF-IDF-like scoring
    const contentLower = item.content.toLowerCase();
    for (const word of queryWords) {
      const wordCount = (contentLower.match(new RegExp(word, 'g')) || []).length;
      const normalizedScore = Math.min(wordCount * 0.02, 0.15);
      score += normalizedScore;
    }

    // Tag match
    const tagMatches = item.tags.filter((tag) => 
      queryWords.some(word => tag.toLowerCase().includes(word))
    ).length;
    score += Math.min(tagMatches * 0.1, 0.2);

    // Context relevance
    if (currentContext) {
      const contextWords = contextLower.split(/\s+/).filter(w => w.length > 3);
      const relevantWords = contextWords.filter((word) => 
        contentLower.includes(word) || titleLower.includes(word)
      ).length;
      score += Math.min(relevantWords * 0.01, 0.1);
    }

    return {
      id: item.id,
      score: Math.min(score, 1)
    };
  });

  enhancedResults.sort((a, b) => b.score - a.score);

  return new Response(
    JSON.stringify({ 
      enhancedResults: enhancedResults.slice(0, topK),
      searchMethod: 'keyword_fallback'
    }),
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
}
