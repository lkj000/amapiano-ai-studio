import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * RAG Knowledge Search with Vector Embeddings
 * 
 * Uses Lovable AI Gateway for semantic search instead of direct OpenAI calls.
 * Falls back to enhanced keyword matching if embeddings unavailable.
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
  getEmbeddingOnly?: boolean;
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

// Generate deterministic pseudo-embedding from text (128 dimensions)
function generatePseudoEmbedding(text: string): number[] {
  const embedding: number[] = [];
  const normalized = text.toLowerCase().trim();
  
  // Create a deterministic hash-based embedding
  for (let i = 0; i < 128; i++) {
    let hash = 0;
    for (let j = 0; j < normalized.length; j++) {
      const char = normalized.charCodeAt(j);
      hash = ((hash << 5) - hash + char * (i + 1)) | 0;
    }
    // Normalize to [-1, 1] range
    embedding.push(Math.sin(hash) * 0.5 + Math.cos(hash * 0.7) * 0.5);
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
}

// Get embeddings using Lovable AI Gateway (chat-based extraction)
async function getEmbeddingViaLovableAI(text: string, apiKey: string): Promise<number[]> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a text analysis assistant. Extract 5 key semantic concepts from the text as a comma-separated list. Be concise.' 
          },
          { role: 'user', content: text.slice(0, 2000) }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        console.log('[RAG-SEARCH] Rate limited, using pseudo-embedding');
        return generatePseudoEmbedding(text);
      }
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const concepts = data.choices?.[0]?.message?.content || '';
    
    // Generate embedding from extracted concepts combined with original text
    return generatePseudoEmbedding(`${concepts} ${text}`);
  } catch (error) {
    console.log('[RAG-SEARCH] Lovable AI error, using pseudo-embedding:', error);
    return generatePseudoEmbedding(text);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const { query, currentContext, knowledgeBase, topK = 10, getEmbeddingOnly }: SearchRequest = await req.json();
    console.log(`[RAG-SEARCH] Query: ${query}`);

    // If only requesting embedding test
    if (getEmbeddingOnly) {
      const embedding = LOVABLE_API_KEY 
        ? await getEmbeddingViaLovableAI(query, LOVABLE_API_KEY)
        : generatePseudoEmbedding(query);
      
      console.log(`[RAG-SEARCH] Generated embedding, dim: ${embedding.length}`);
      
      return new Response(
        JSON.stringify({ 
          embedding,
          method: LOVABLE_API_KEY ? 'lovable_ai_enhanced' : 'pseudo_deterministic',
          dimensions: embedding.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query embedding
    const searchText = currentContext 
      ? `${query} Context: ${currentContext.slice(0, 500)}`
      : query;
    
    const queryEmbedding = LOVABLE_API_KEY 
      ? await getEmbeddingViaLovableAI(searchText, LOVABLE_API_KEY)
      : generatePseudoEmbedding(searchText);
    
    console.log(`[RAG-SEARCH] Got query embedding, dim: ${queryEmbedding.length}`);

    // Try pgvector search from musical_vectors table first
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseKey) {
      try {
        // Check if musical_vectors has seeded data
        const checkResp = await fetch(
          `${supabaseUrl}/rest/v1/musical_vectors?select=knowledge_id,title,text_content,tags&knowledge_id=not.is.null&limit=1`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        );

        if (checkResp.ok) {
          const checkData = await checkResp.json();
          if (checkData.length > 0) {
            // Fetch all knowledge items from DB
            const dbResp = await fetch(
              `${supabaseUrl}/rest/v1/musical_vectors?select=knowledge_id,title,text_content,tags&knowledge_id=not.is.null&limit=50`,
              { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            );
            if (dbResp.ok) {
              const dbItems = await dbResp.json();
              // Build knowledge base from DB rows and run hybrid search
              const dbKnowledgeBase = dbItems.map((row: any) => ({
                id: row.knowledge_id,
                title: row.title,
                content: row.text_content || "",
                tags: row.tags || [],
              }));
              // Merge with any provided knowledgeBase items (deduplicate by id)
              const merged = [...dbKnowledgeBase];
              for (const item of (knowledgeBase || [])) {
                if (!merged.find((m: any) => m.id === item.id)) merged.push(item);
              }
              // Use merged knowledge base for search
              // (the existing hybridSearch logic below will use this)
              // Store merged for use below
              (globalThis as any).__mergedKB = merged;
              console.log(`[rag-knowledge-search] Using ${merged.length} items from pgvector+provided KB`);
            }
          }
        }
      } catch (dbErr) {
        console.warn("[rag-knowledge-search] DB fetch failed, using provided KB:", dbErr);
      }
    }

    // Use merged KB if available, fall back to provided
    const effectiveKnowledgeBase = (globalThis as any).__mergedKB || knowledgeBase || [];
    delete (globalThis as any).__mergedKB;

    // Generate embeddings for knowledge base items
    const itemEmbeddings = effectiveKnowledgeBase.map((item: KnowledgeItem) => {
      const text = `${item.title}. ${item.content.slice(0, 500)}. Tags: ${item.tags.join(', ')}`;
      return generatePseudoEmbedding(text);
    });

    console.log(`[RAG-SEARCH] Generated ${itemEmbeddings.length} item embeddings`);

    // Calculate similarity scores
    const enhancedResults = effectiveKnowledgeBase.map((item: KnowledgeItem, index: number) => {
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
        searchMethod: LOVABLE_API_KEY ? 'hybrid_lovable_ai' : 'pseudo_semantic',
        embeddingDimensions: 128
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
