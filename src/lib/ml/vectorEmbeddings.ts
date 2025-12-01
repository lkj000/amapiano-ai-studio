/**
 * Vector Embeddings for Semantic Search
 * 
 * Client-side implementation for generating and comparing embeddings
 * using a lightweight approach when API is not available.
 * 
 * For production: Uses server-side OpenAI embeddings
 * For fallback: Uses TF-IDF inspired local embeddings
 */

import { supabase } from '@/integrations/supabase/client';

export interface EmbeddingResult {
  embedding: number[];
  method: 'openai' | 'local';
  dimensions: number;
}

export interface SearchResult {
  id: string;
  score: number;
  semanticScore?: number;
  keywordScore?: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  
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

/**
 * Euclidean distance between vectors (lower is more similar)
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

/**
 * Local TF-IDF inspired embedding generation
 * Creates a simple bag-of-words style embedding
 */
export function generateLocalEmbedding(text: string, vocabulary?: string[]): number[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  // Use provided vocabulary or create from text
  const vocab = vocabulary || getDefaultVocabulary();
  const embedding = new Array(vocab.length).fill(0);
  
  // Word frequency
  const wordCount: Record<string, number> = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  
  // Create embedding based on vocabulary
  for (let i = 0; i < vocab.length; i++) {
    const vocabWord = vocab[i].toLowerCase();
    
    // Exact match
    if (wordCount[vocabWord]) {
      embedding[i] = wordCount[vocabWord] / words.length;
    }
    
    // Partial match bonus
    for (const word of Object.keys(wordCount)) {
      if (word.includes(vocabWord) || vocabWord.includes(word)) {
        embedding[i] += 0.5 * (wordCount[word] / words.length);
      }
    }
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
  }
  
  return embedding;
}

/**
 * Default vocabulary for music production domain
 */
function getDefaultVocabulary(): string[] {
  return [
    // Genres
    'amapiano', 'afrobeat', 'house', 'gqom', 'kwaito', 'jazz', 'gospel',
    // Instruments
    'piano', 'drum', 'bass', 'percussion', 'synth', 'vocal', 'guitar', 'strings',
    // Elements
    'log', 'shaker', 'hi-hat', 'kick', 'snare', 'chord', 'melody', 'rhythm',
    // Production
    'sidechain', 'compression', 'filter', 'reverb', 'delay', 'eq', 'mix', 'master',
    // Regions
    'johannesburg', 'pretoria', 'durban', 'cape', 'town', 'south', 'africa',
    // Characteristics
    'deep', 'smooth', 'energetic', 'soulful', 'groovy', 'authentic', 'cultural',
    // Technical
    'bpm', 'tempo', 'key', 'minor', 'major', 'frequency', 'spectrum', 'transient',
    // Actions
    'create', 'add', 'remove', 'adjust', 'enhance', 'generate', 'analyze',
    // Quality
    'professional', 'quality', 'high', 'low', 'medium', 'loud', 'quiet'
  ];
}

/**
 * Get embeddings via server (OpenAI) or fallback to local
 */
export async function getEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    // Try server-side embeddings via edge function
    const { data, error } = await supabase.functions.invoke('rag-knowledge-search', {
      body: {
        query: text,
        knowledgeBase: [{ id: 'test', title: '', content: '', tags: [] }],
        getEmbeddingOnly: true
      }
    });

    if (!error && data?.embedding) {
      return {
        embedding: data.embedding,
        method: 'openai',
        dimensions: data.embedding.length
      };
    }
  } catch (e) {
    console.log('[VectorEmbeddings] Server embedding failed, using local');
  }

  // Fallback to local embedding
  const embedding = generateLocalEmbedding(text);
  return {
    embedding,
    method: 'local',
    dimensions: embedding.length
  };
}

/**
 * Semantic search using embeddings
 */
export async function semanticSearch(
  query: string,
  documents: Array<{ id: string; text: string; embedding?: number[] }>,
  topK = 10
): Promise<SearchResult[]> {
  const queryResult = await getEmbedding(query);
  const queryEmbedding = queryResult.embedding;

  const results: SearchResult[] = [];

  for (const doc of documents) {
    // Get or generate document embedding
    let docEmbedding = doc.embedding;
    if (!docEmbedding) {
      docEmbedding = generateLocalEmbedding(doc.text);
    }

    // Ensure same dimensions (use local if mismatch)
    if (docEmbedding.length !== queryEmbedding.length) {
      docEmbedding = generateLocalEmbedding(doc.text);
      // Regenerate query embedding with local method if needed
      if (docEmbedding.length !== queryEmbedding.length) {
        continue; // Skip incompatible documents
      }
    }

    const semanticScore = cosineSimilarity(queryEmbedding, docEmbedding);
    
    // Add keyword matching boost
    const queryWords = query.toLowerCase().split(/\s+/);
    const docWords = doc.text.toLowerCase();
    let keywordScore = 0;
    for (const word of queryWords) {
      if (word.length > 2 && docWords.includes(word)) {
        keywordScore += 0.1;
      }
    }
    keywordScore = Math.min(keywordScore, 0.3);

    results.push({
      id: doc.id,
      score: semanticScore * 0.7 + keywordScore,
      semanticScore,
      keywordScore
    });
  }

  // Sort by score and return top K
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

/**
 * Find similar items using embeddings
 */
export function findSimilar(
  targetEmbedding: number[],
  candidates: Array<{ id: string; embedding: number[] }>,
  topK = 5
): Array<{ id: string; similarity: number }> {
  const results = candidates.map(candidate => ({
    id: candidate.id,
    similarity: cosineSimilarity(targetEmbedding, candidate.embedding)
  }));

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK);
}

/**
 * Cluster items by embedding similarity
 */
export function clusterByEmbedding(
  items: Array<{ id: string; embedding: number[] }>,
  numClusters: number
): Array<{ centroid: number[]; members: string[] }> {
  if (items.length === 0 || numClusters <= 0) return [];

  // Simple k-means clustering
  const dimensions = items[0].embedding.length;
  
  // Initialize centroids randomly
  const centroids: number[][] = [];
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numClusters, items.length); i++) {
    centroids.push([...shuffled[i].embedding]);
  }

  // Iterate
  for (let iter = 0; iter < 10; iter++) {
    // Assign items to nearest centroid
    const assignments: number[] = items.map(item => {
      let minDist = Infinity;
      let nearest = 0;
      for (let c = 0; c < centroids.length; c++) {
        const dist = euclideanDistance(item.embedding, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          nearest = c;
        }
      }
      return nearest;
    });

    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      const members = items.filter((_, i) => assignments[i] === c);
      if (members.length > 0) {
        const newCentroid = new Array(dimensions).fill(0);
        for (const member of members) {
          for (let d = 0; d < dimensions; d++) {
            newCentroid[d] += member.embedding[d];
          }
        }
        for (let d = 0; d < dimensions; d++) {
          centroids[c][d] = newCentroid[d] / members.length;
        }
      }
    }
  }

  // Build final clusters
  const clusters: Array<{ centroid: number[]; members: string[] }> = centroids.map(c => ({
    centroid: c,
    members: []
  }));

  for (const item of items) {
    let minDist = Infinity;
    let nearest = 0;
    for (let c = 0; c < centroids.length; c++) {
      const dist = euclideanDistance(item.embedding, centroids[c]);
      if (dist < minDist) {
        minDist = dist;
        nearest = c;
      }
    }
    clusters[nearest].members.push(item.id);
  }

  return clusters.filter(c => c.members.length > 0);
}
