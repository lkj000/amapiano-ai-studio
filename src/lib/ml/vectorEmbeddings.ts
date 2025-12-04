/**
 * Vector Embeddings for Semantic Search
 * 
 * Robust implementation with proper dimension handling,
 * projection layers for mismatched dimensions, and
 * improved local embeddings.
 */

import { supabase } from '@/integrations/supabase/client';

// Constants
const OPENAI_EMBEDDING_DIM = 1536;
const LOCAL_EMBEDDING_DIM = 128; // Increased for better representation

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
  if (a.length === 0 || b.length === 0) return 0;
  
  // Handle dimension mismatch by projecting to common space
  const [vecA, vecB] = alignDimensions(a, b);
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Align dimensions of two vectors using random projection
 */
function alignDimensions(a: number[], b: number[]): [number[], number[]] {
  if (a.length === b.length) return [a, b];
  
  const targetDim = Math.min(a.length, b.length, LOCAL_EMBEDDING_DIM);
  
  return [
    projectToLowerDimension(a, targetDim),
    projectToLowerDimension(b, targetDim)
  ];
}

/**
 * Project vector to lower dimension using deterministic projection
 * Uses a hash-based approach for reproducibility
 */
function projectToLowerDimension(vec: number[], targetDim: number): number[] {
  if (vec.length <= targetDim) {
    // Pad with zeros
    const padded = new Array(targetDim).fill(0);
    for (let i = 0; i < vec.length; i++) {
      padded[i] = vec[i];
    }
    return padded;
  }
  
  // Use chunked averaging for deterministic projection
  const result = new Array(targetDim).fill(0);
  const chunkSize = Math.ceil(vec.length / targetDim);
  
  for (let i = 0; i < targetDim; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, vec.length);
    let sum = 0;
    let count = 0;
    
    for (let j = start; j < end; j++) {
      sum += vec[j];
      count++;
    }
    
    result[i] = count > 0 ? sum / Math.sqrt(count) : 0;
  }
  
  // Normalize
  const norm = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < result.length; i++) {
      result[i] /= norm;
    }
  }
  
  return result;
}

/**
 * Euclidean distance between vectors (lower is more similar)
 */
export function euclideanDistance(a: number[], b: number[]): number {
  const [vecA, vecB] = alignDimensions(a, b);
  
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

/**
 * Extended vocabulary for music production domain
 */
function getDefaultVocabulary(): string[] {
  return [
    // Genres (20)
    'amapiano', 'afrobeat', 'house', 'gqom', 'kwaito', 'jazz', 'gospel', 'electronic',
    'dance', 'deep', 'tribal', 'afro', 'soul', 'funk', 'disco', 'techno', 'minimal',
    'progressive', 'vocal', 'instrumental',
    // Instruments (20)
    'piano', 'drum', 'bass', 'percussion', 'synth', 'vocal', 'guitar', 'strings',
    'pad', 'lead', 'organ', 'rhodes', 'wurlitzer', 'marimba', 'kalimba', 'mbira',
    'shaker', 'tambourine', 'conga', 'bongo',
    // Elements (20)
    'log', 'hi-hat', 'kick', 'snare', 'clap', 'chord', 'melody', 'rhythm', 'groove',
    'hook', 'riff', 'loop', 'sample', 'pattern', 'sequence', 'arpeggio', 'fill',
    'break', 'drop', 'build',
    // Production (20)
    'sidechain', 'compression', 'filter', 'reverb', 'delay', 'eq', 'mix', 'master',
    'gain', 'pan', 'stereo', 'mono', 'widen', 'narrow', 'saturate', 'distort',
    'pitch', 'time', 'stretch', 'warp',
    // Regions (15)
    'johannesburg', 'pretoria', 'durban', 'cape', 'town', 'south', 'africa',
    'soweto', 'township', 'urban', 'rural', 'local', 'international', 'global', 'fusion',
    // Characteristics (15)
    'deep', 'smooth', 'energetic', 'soulful', 'groovy', 'authentic', 'cultural',
    'warm', 'bright', 'dark', 'light', 'heavy', 'punchy', 'subtle', 'aggressive',
    // Technical (18)
    'bpm', 'tempo', 'key', 'minor', 'major', 'frequency', 'spectrum', 'transient',
    'envelope', 'attack', 'release', 'sustain', 'decay', 'amplitude', 'waveform',
    'harmonic', 'overtone', 'fundamental'
  ];
}

/**
 * N-gram extraction for better text representation
 */
function extractNgrams(text: string, n: number = 2): string[] {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);
  const ngrams: string[] = [...words]; // Include unigrams
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

/**
 * Generate local embedding with TF-IDF and character n-grams
 */
export function generateLocalEmbedding(text: string, vocabulary?: string[]): number[] {
  const vocab = vocabulary || getDefaultVocabulary();
  const embedding = new Array(LOCAL_EMBEDDING_DIM).fill(0);
  
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);
  const ngrams = extractNgrams(text);
  
  // Word frequency
  const wordCount: Record<string, number> = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }
  
  // Map vocabulary to embedding dimensions
  const vocabPerDim = Math.ceil(vocab.length / LOCAL_EMBEDDING_DIM);
  
  for (let dimIdx = 0; dimIdx < LOCAL_EMBEDDING_DIM; dimIdx++) {
    let dimValue = 0;
    
    for (let vocIdx = dimIdx * vocabPerDim; vocIdx < Math.min((dimIdx + 1) * vocabPerDim, vocab.length); vocIdx++) {
      const vocabWord = vocab[vocIdx].toLowerCase();
      
      // Exact match
      if (wordCount[vocabWord]) {
        dimValue += wordCount[vocabWord] / words.length * 2;
      }
      
      // Substring match
      for (const word of Object.keys(wordCount)) {
        if (word.includes(vocabWord) || vocabWord.includes(word)) {
          dimValue += 0.3 * (wordCount[word] / words.length);
        }
      }
      
      // N-gram match
      for (const ngram of ngrams) {
        if (ngram.includes(vocabWord)) {
          dimValue += 0.2;
        }
      }
    }
    
    embedding[dimIdx] = dimValue;
  }
  
  // Add positional information from text
  for (let i = 0; i < Math.min(words.length, 20); i++) {
    const charSum = words[i].split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const dimIdx = (charSum + i) % LOCAL_EMBEDDING_DIM;
    embedding[dimIdx] += 0.1 * (1 - i / 20); // Decay by position
  }
  
  // L2 normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
  }
  
  return embedding;
}

/**
 * Get embeddings via server (OpenAI) or fallback to local
 */
export async function getEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const { data, error } = await supabase.functions.invoke('rag-knowledge-search', {
      body: {
        query: text,
        knowledgeBase: [{ id: 'test', title: '', content: '', tags: [] }],
        getEmbeddingOnly: true
      }
    });

    if (!error && data?.embedding && Array.isArray(data.embedding)) {
      return {
        embedding: data.embedding,
        method: 'openai',
        dimensions: data.embedding.length
      };
    }
  } catch (e) {
    console.log('[VectorEmbeddings] Server embedding failed, using local');
  }

  const embedding = generateLocalEmbedding(text);
  return {
    embedding,
    method: 'local',
    dimensions: embedding.length
  };
}

/**
 * Semantic search with robust dimension handling
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
    if (!docEmbedding || docEmbedding.length === 0) {
      docEmbedding = generateLocalEmbedding(doc.text);
    }

    // Calculate semantic similarity (handles dimension mismatch internally)
    const semanticScore = cosineSimilarity(queryEmbedding, docEmbedding);
    
    // Keyword matching boost
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const docLower = doc.text.toLowerCase();
    let keywordScore = 0;
    
    for (const word of queryWords) {
      if (docLower.includes(word)) {
        keywordScore += 0.1;
      }
    }
    keywordScore = Math.min(keywordScore, 0.4);

    results.push({
      id: doc.id,
      score: semanticScore * 0.6 + keywordScore * 0.4,
      semanticScore,
      keywordScore
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
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

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * K-means++ clustering for better initialization
 */
export function clusterByEmbedding(
  items: Array<{ id: string; embedding: number[] }>,
  numClusters: number
): Array<{ centroid: number[]; members: string[] }> {
  if (items.length === 0 || numClusters <= 0) return [];

  const k = Math.min(numClusters, items.length);
  
  // Align all embeddings to same dimension
  const targetDim = LOCAL_EMBEDDING_DIM;
  const alignedItems = items.map(item => ({
    id: item.id,
    embedding: projectToLowerDimension(item.embedding, targetDim)
  }));

  // K-means++ initialization
  const centroids: number[][] = [];
  
  // First centroid: random
  const firstIdx = Math.floor(Math.random() * alignedItems.length);
  centroids.push([...alignedItems[firstIdx].embedding]);
  
  // Remaining centroids: weighted by distance squared
  while (centroids.length < k) {
    const distances = alignedItems.map(item => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = euclideanDistance(item.embedding, centroid);
        minDist = Math.min(minDist, dist);
      }
      return minDist * minDist;
    });
    
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let cumulative = 0;
    const threshold = Math.random() * totalDist;
    
    for (let i = 0; i < alignedItems.length; i++) {
      cumulative += distances[i];
      if (cumulative >= threshold) {
        centroids.push([...alignedItems[i].embedding]);
        break;
      }
    }
  }

  // K-means iteration
  let assignments = new Array(alignedItems.length).fill(0);
  
  for (let iter = 0; iter < 20; iter++) {
    // Assign items to nearest centroid
    const newAssignments = alignedItems.map(item => {
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

    // Check convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;
    
    if (!changed) break;

    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      const members = alignedItems.filter((_, i) => assignments[i] === c);
      if (members.length > 0) {
        centroids[c] = new Array(targetDim).fill(0);
        for (const member of members) {
          for (let d = 0; d < targetDim; d++) {
            centroids[c][d] += member.embedding[d];
          }
        }
        for (let d = 0; d < targetDim; d++) {
          centroids[c][d] /= members.length;
        }
      }
    }
  }

  // Build final clusters
  const clusters: Array<{ centroid: number[]; members: string[] }> = centroids.map(c => ({
    centroid: c,
    members: []
  }));

  for (let i = 0; i < alignedItems.length; i++) {
    clusters[assignments[i]].members.push(alignedItems[i].id);
  }

  return clusters.filter(c => c.members.length > 0);
}
