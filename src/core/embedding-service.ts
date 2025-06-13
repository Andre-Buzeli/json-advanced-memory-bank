/**
 * Advanced Memory Bank MCP v3.2.2 - Zero-Dependency Embedding Service
 * Built-in AI embeddings using internal algorithms - No API keys required
 * 
 * @author Andre Buzeli
 * @version 3.2.2
 * @since 2025
 */

import { createHash } from 'crypto';

// Dynamic LRUCache with fallback
let LRUCacheClass: any;
try {
  const lruModule = require('lru-cache');
  LRUCacheClass = lruModule.LRUCache || lruModule;
} catch (error) {
  // Fallback LRU cache implementation
  class SimpleLRUCache<K, V> {
    private cache = new Map<K, V>();
    private maxSize: number;
    
    constructor(options: { max: number; ttl?: number }) {
      this.maxSize = options.max;
    }
    
    get(key: K): V | undefined {
      return this.cache.get(key);
    }
    
    set(key: K, value: V): void {
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(key, value);
    }
  }
  
  LRUCacheClass = SimpleLRUCache;
}

/**
 * Zero-Dependency Embedding Service using internal algorithms
 * Implements TF-IDF with cosine similarity for semantic search
 */
export class EmbeddingService {
  private embeddingCache: any;
  private vocabulary: Map<string, number>;
  private idfScores: Map<string, number>;
  private documentCount: number;
  private embeddingDimension: number;
  
  constructor() {
    // Initialize cache with max 500 entries
    this.embeddingCache = new LRUCacheClass({
      max: 500,
      ttl: 1000 * 60 * 60 * 24 // 24 hour TTL
    });
    
    this.vocabulary = new Map();
    this.idfScores = new Map();
    this.documentCount = 0;
    this.embeddingDimension = 384; // Standard dimension for embeddings
  }
  /**
   * Tokenize text into normalized tokens
   * @param text - Input text to tokenize
   * @returns Array of normalized tokens
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
      .filter(token => !this.isStopWord(token));
  }

  /**
   * Check if a word is a stop word
   * @param word - Word to check
   * @returns True if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    return stopWords.has(word);
  }

  /**
   * Build vocabulary from text corpus
   * @param documents - Array of text documents
   */
  private buildVocabulary(documents: string[]): void {
    const termDocumentFreq = new Map<string, number>();
    
    for (const doc of documents) {
      const tokens = this.tokenize(doc);
      const uniqueTokens = new Set(tokens);
      
      for (const token of uniqueTokens) {
        termDocumentFreq.set(token, (termDocumentFreq.get(token) || 0) + 1);
      }
    }
    
    // Build vocabulary and calculate IDF scores
    let vocabIndex = 0;
    for (const [term, docFreq] of termDocumentFreq.entries()) {
      if (docFreq >= 2) { // Only include terms that appear in at least 2 documents
        this.vocabulary.set(term, vocabIndex++);
        const idf = Math.log(documents.length / docFreq);
        this.idfScores.set(term, idf);
      }
    }
    
    this.documentCount = documents.length;
  }

  /**
   * Create TF-IDF vector for a document
   * @param text - Input text
   * @returns TF-IDF vector
   */
  private createTfIdfVector(text: string): number[] {
    const tokens = this.tokenize(text);
    const termFreq = new Map<string, number>();
    
    // Calculate term frequencies
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }
    
    // Create vector with fixed dimension
    const vector = new Array(this.embeddingDimension).fill(0);
    
    // Fill vector with TF-IDF scores
    for (const [term, tf] of termFreq.entries()) {
      const vocabIndex = this.vocabulary.get(term);
      const idf = this.idfScores.get(term);
      
      if (vocabIndex !== undefined && idf !== undefined && vocabIndex < this.embeddingDimension) {
        const tfIdf = (tf / tokens.length) * idf;
        vector[vocabIndex] = tfIdf;
      }
    }
    
    // Add hash-based features for better representation
    this.addHashFeatures(text, vector);
    
    // Normalize vector
    return this.normalizeVector(vector);
  }

  /**
   * Add hash-based features to vector for better semantic representation
   * @param text - Input text
   * @param vector - Vector to modify
   */
  private addHashFeatures(text: string, vector: number[]): void {
    const hashFeatures = this.createHashFeatures(text);
    const startIndex = Math.floor(this.embeddingDimension * 0.7); // Use last 30% for hash features
    
    for (let i = 0; i < hashFeatures.length && startIndex + i < this.embeddingDimension; i++) {
      vector[startIndex + i] = hashFeatures[i];
    }
  }

  /**
   * Create hash-based features for semantic similarity
   * @param text - Input text
   * @returns Array of hash-based features
   */
  private createHashFeatures(text: string): number[] {
    const features: number[] = [];
    const ngrams = this.createNgrams(text, 2).concat(this.createNgrams(text, 3));
    
    for (const ngram of ngrams.slice(0, 50)) { // Limit to 50 n-grams
      const hash = createHash('sha256').update(ngram).digest();
      const feature = (hash[0] / 255) * 2 - 1; // Normalize to [-1, 1]
      features.push(feature);
    }
    
    return features;
  }

  /**
   * Create n-grams from text
   * @param text - Input text
   * @param n - N-gram size
   * @returns Array of n-grams
   */
  private createNgrams(text: string, n: number): string[] {
    const tokens = this.tokenize(text);
    const ngrams: string[] = [];
    
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    
    return ngrams;
  }

  /**
   * Normalize vector to unit length
   * @param vector - Input vector
   * @returns Normalized vector
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Generate an embedding vector for a text string using internal algorithms
   * @param text - Text to generate embedding for
   * @returns Vector embedding array
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Normalize text for cache key
    const normalizedText = text.trim().replace(/\s+/g, ' ').toLowerCase();
    const cacheKey = `internal:${normalizedText}`;
    
    // Check cache first
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      // If vocabulary is empty, build it with the current text
      if (this.vocabulary.size === 0) {
        this.buildVocabulary([text]);
      }
      
      // Create TF-IDF based embedding
      const embedding = this.createTfIdfVector(text);
      
      // Cache the result
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param a - First vector
   * @param b - Second vector
   * @returns Similarity score (0-1)
   */
  calculateSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimensions don't match: ${a.length} vs ${b.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    return dotProduct / magnitude;
  }
}