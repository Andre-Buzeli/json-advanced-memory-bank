/**
 * Advanced Memory Bank MCP v3.0.0 - Mock Embedding Service
 * For QA testing without OpenAI API dependency
 */

import { EmbeddingService } from './embedding-service.js';

export class MockEmbeddingService implements EmbeddingService {
  private isConfigured = true;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(private useDeterministicEmbeddings = true) {}

  isReady(): boolean {
    return this.isConfigured;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isConfigured) {
      throw new Error('Mock Embedding Service not configured');
    }

    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    let embedding: number[];

    if (this.useDeterministicEmbeddings) {
      // Generate deterministic embedding based on text content
      embedding = this.generateDeterministicEmbedding(text);
    } else {
      // Generate random embedding with OpenAI dimensions
      embedding = this.generateRandomEmbedding();
    }

    // Cache the embedding
    this.embeddingCache.set(text, embedding);
    
    console.log(`✅ Mock: Generated embedding for text (${text.length} chars)`);
    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      embeddings.push(await this.generateEmbedding(text));
    }
    
    console.log(`✅ Mock: Generated ${embeddings.length} embeddings in batch`);
    return embeddings;
  }

  private generateDeterministicEmbedding(text: string): number[] {
    // Generate embedding based on text characteristics
    const embedding = new Array(1536).fill(0);
    
    // Use text characteristics to create deterministic vectors
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.split('');
    
    // Base features
    const textLength = Math.min(text.length / 1000, 1);
    const wordCount = Math.min(words.length / 100, 1);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Character frequency features
    const charFreq: Record<string, number> = {};
    chars.forEach(char => {
      charFreq[char] = (charFreq[char] || 0) + 1;
    });
    
    // Generate embedding dimensions
    for (let i = 0; i < 1536; i++) {
      let value = 0;
      
      // Base semantic features
      if (i < 100) {
        // Text structure features
        value = (textLength * Math.sin(i * 0.1)) + 
                (wordCount * Math.cos(i * 0.1)) +
                (avgWordLength * Math.sin(i * 0.05));
      } else if (i < 500) {
        // Word-based features
        const wordIndex = (i - 100) % words.length;
        const word = words[wordIndex] || '';
        value = this.hashStringToFloat(word + i.toString());
      } else if (i < 1000) {
        // Character frequency features
        const charKey = String.fromCharCode(65 + (i % 26));
        const freq = charFreq[charKey.toLowerCase()] || 0;
        value = (freq / text.length) * Math.sin(i * 0.01);
      } else {
        // Contextual features
        value = this.hashStringToFloat(text.substring(0, 50) + i.toString());
      }
      
      // Normalize to [-1, 1] range and add some noise
      embedding[i] = Math.tanh(value) * (0.8 + 0.2 * Math.random());
    }
    
    // Normalize the embedding
    return this.normalizeEmbedding(embedding);
  }

  private generateRandomEmbedding(): number[] {
    const embedding = new Array(1536);
    
    for (let i = 0; i < 1536; i++) {
      // Generate random values with normal distribution
      embedding[i] = this.randomNormal() * 0.5;
    }
    
    return this.normalizeEmbedding(embedding);
  }

  private normalizeEmbedding(embedding: number[]): number[] {
    // Calculate magnitude
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    
    // Normalize to unit vector
    return embedding.map(val => val / magnitude);
  }

  private hashStringToFloat(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash / 2147483648; // Normalize to [-1, 1]
  }

  private randomNormal(): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // Testing utilities
  clearCache(): void {
    this.embeddingCache.clear();
    console.log('✅ Mock: Cleared embedding cache');
  }

  getCacheSize(): number {
    return this.embeddingCache.size;
  }

  setDeterministicMode(enabled: boolean): void {
    this.useDeterministicEmbeddings = enabled;
    console.log(`✅ Mock: Deterministic mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Simulate API errors for testing
  simulateError(shouldError: boolean = true): void {
    this.isConfigured = !shouldError;
    console.log(`✅ Mock: Error simulation ${shouldError ? 'enabled' : 'disabled'}`);
  }

  // Calculate cosine similarity between embeddings (utility for testing)
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }
}
