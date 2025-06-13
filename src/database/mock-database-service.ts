/**
 * Advanced Memory Bank MCP v3.0.0 - Mock Database Service
 * For QA testing without PostgreSQL dependency
 */

import { MemoryNode } from '../types/index.js';

export class MockDatabaseService {
  private memories: Map<string, MemoryNode[]> = new Map();
  private isConnected = false;

  async connect(): Promise<void> {
    this.isConnected = true;
    console.log('✅ Mock Database connected successfully');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('✅ Mock Database disconnected');
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async storeMemory(memory: MemoryNode): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const projectMemories = this.memories.get(memory.projectName) || [];
    
    // Remove existing memory with same title
    const filteredMemories = projectMemories.filter(m => 
      m.content !== memory.content
    );
    
    // Add new memory
    filteredMemories.push({
      ...memory,
      timestamp: Date.now()
    });
    
    this.memories.set(memory.projectName, filteredMemories);
    console.log(`✅ Mock: Stored memory for project ${memory.projectName}`);
  }

  async updateMemory(memory: MemoryNode): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const projectMemories = this.memories.get(memory.projectName) || [];
    const index = projectMemories.findIndex(m => 
      m.content === memory.content
    );
    
    if (index >= 0) {
      projectMemories[index] = { ...memory, timestamp: Date.now() };
      this.memories.set(memory.projectName, projectMemories);
      console.log(`✅ Mock: Updated memory for project ${memory.projectName}`);
    } else {
      await this.storeMemory(memory);
    }
  }
  async searchMemories(
    projectName: string,
    embedding: number[],
    limit: number = 10,
    minImportance: number = 0.1
  ): Promise<MemoryNode[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const projectMemories = this.memories.get(projectName) || [];
    
    // Enhanced similarity search with actual vector operations
    const memoriesWithSimilarity = projectMemories
      .filter(m => m.importance >= minImportance && m.embedding)
      .map(memory => ({
        memory,
        similarity: this.calculateCosineSimilarity(embedding, memory.embedding!)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => {
        // Update access count for retrieved memories
        item.memory.accessCount += 1;
        return item.memory;
      });
    
    console.log(`✅ Mock: Found ${memoriesWithSimilarity.length} memories for project ${projectName} using vector similarity`);
    return memoriesWithSimilarity;
  }

  async getMemoriesByProject(projectName: string): Promise<MemoryNode[]> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const memories = this.memories.get(projectName) || [];
    console.log(`✅ Mock: Retrieved ${memories.length} memories for project ${projectName}`);
    return memories;
  }

  async updateMemoryEmbedding(
    projectName: string,
    memoryTitle: string,
    embedding: number[]
  ): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const projectMemories = this.memories.get(projectName) || [];
    const memory = projectMemories.find(m => m.summary.includes(memoryTitle));
    
    if (memory) {
      memory.embedding = embedding;
      console.log(`✅ Mock: Updated embedding for ${projectName}/${memoryTitle}`);
    }
  }

  async updateImportance(
    projectName: string,
    embedding: number[],
    similarityThreshold: number,
    decayFactor: number,
    reinforcementFactor: number
  ): Promise<void> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const projectMemories = this.memories.get(projectName) || [];
    
    // Mock importance update
    projectMemories.forEach(memory => {
      if (Math.random() > 0.5) { // Simulate similarity
        memory.importance *= reinforcementFactor;
      } else {
        memory.importance *= decayFactor;
      }
      memory.importance = Math.max(0.01, Math.min(1.0, memory.importance));
    });
    
    console.log(`✅ Mock: Updated importance for ${projectMemories.length} memories`);
  }

  async getProjectStats(projectName: string): Promise<any> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const memories = this.memories.get(projectName) || [];
    
    return {
      totalMemories: memories.length,
      avgImportance: memories.reduce((sum, m) => sum + m.importance, 0) / memories.length || 0,
      totalAccessCount: memories.reduce((sum, m) => sum + m.accessCount, 0),
      oldestMemory: Math.min(...memories.map(m => m.timestamp)),
      newestMemory: Math.max(...memories.map(m => m.timestamp))
    };
  }
  // Mock specific methods for testing
  getMockData(): Map<string, MemoryNode[]> {
    return this.memories;
  }

  clearProject(projectName: string): void {
    this.memories.delete(projectName);
    console.log(`✅ Mock: Cleared project ${projectName}`);
  }

  clearAll(): void {
    this.memories.clear();
    console.log('✅ Mock: Cleared all data');
  }

  // Advanced vector operations for enhanced testing
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
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

  // Advanced memory consolidation simulation
  async consolidateMemories(
    projectName: string,
    similarityThreshold: number = 0.85,
    minClusterSize: number = 2
  ): Promise<{ consolidated: number; clustersFound: number }> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const projectMemories = this.memories.get(projectName) || [];
    const memoriesWithEmbeddings = projectMemories.filter(m => m.embedding);
    
    if (memoriesWithEmbeddings.length < minClusterSize) {
      return { consolidated: 0, clustersFound: 0 };
    }

    // Find similar memory clusters
    const clusters: MemoryNode[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < memoriesWithEmbeddings.length; i++) {
      if (processed.has(i)) continue;

      const cluster = [memoriesWithEmbeddings[i]];
      processed.add(i);

      for (let j = i + 1; j < memoriesWithEmbeddings.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.calculateCosineSimilarity(
          memoriesWithEmbeddings[i].embedding!,
          memoriesWithEmbeddings[j].embedding!
        );

        if (similarity >= similarityThreshold) {
          cluster.push(memoriesWithEmbeddings[j]);
          processed.add(j);
        }
      }

      if (cluster.length >= minClusterSize) {
        clusters.push(cluster);
      }
    }

    // Consolidate clusters
    let consolidatedCount = 0;
    for (const cluster of clusters) {
      if (cluster.length > 1) {
        // Create consolidated memory
        const consolidatedMemory = this.createConsolidatedMemory(cluster);
        
        // Remove original memories
        const updatedMemories = projectMemories.filter(m => 
          !cluster.some(cm => cm.content === m.content)
        );
        
        // Add consolidated memory
        updatedMemories.push(consolidatedMemory);
        
        this.memories.set(projectName, updatedMemories);
        consolidatedCount += cluster.length - 1; // Net reduction
      }
    }

    console.log(`✅ Mock: Consolidated ${consolidatedCount} memories into ${clusters.length} clusters`);
    return { consolidated: consolidatedCount, clustersFound: clusters.length };
  }

  private createConsolidatedMemory(cluster: MemoryNode[]): MemoryNode {
    // Sort by importance and take the most important as base
    const sortedCluster = cluster.sort((a, b) => b.importance - a.importance);
    const baseMemory = sortedCluster[0];
    
    // Combine content and metadata
    const combinedContent = cluster.map(m => m.content).join('\n\n---\n\n');
    const combinedSummary = `CONSOLIDATED: ${cluster.map(m => m.summary).join(' | ')}`;
    
    // Calculate average embedding
    const avgEmbedding = this.calculateAverageEmbedding(cluster.map(m => m.embedding!));
    
    // Calculate combined importance (weighted average)
    const totalImportance = cluster.reduce((sum, m) => sum + m.importance, 0);
    const avgImportance = Math.min(1.0, totalImportance / cluster.length * 1.2); // Slight boost for consolidation
    
    return {
      ...baseMemory,
      content: combinedContent,
      summary: combinedSummary,
      embedding: avgEmbedding,
      importance: avgImportance,
      accessCount: cluster.reduce((sum, m) => sum + m.accessCount, 0),
      tags: [...new Set(cluster.flatMap(m => m.tags))], // Unique tags
      timestamp: Date.now()
    };
  }

  private calculateAverageEmbedding(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];
    
    const dimensions = embeddings[0].length;
    const avgEmbedding = new Array(dimensions).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        avgEmbedding[i] += embedding[i];
      }
    }
    
    // Average and normalize
    for (let i = 0; i < dimensions; i++) {
      avgEmbedding[i] /= embeddings.length;
    }
    
    return this.normalizeEmbedding(avgEmbedding);
  }

  private normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    return embedding.map(val => val / magnitude);
  }

  // Advanced memory pruning simulation
  async pruneMemories(
    projectName: string,
    maxMemories: number = 1000,
    minImportance: number = 0.1,
    maxAge: number = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds
  ): Promise<{ pruned: number; reason: string[] }> {
    if (!this.isConnected) throw new Error('Database not connected');
    
    const projectMemories = this.memories.get(projectName) || [];
    const currentTime = Date.now();
    const reasons: string[] = [];
    
    let pruned = projectMemories.filter(memory => {
      // Check importance threshold
      if (memory.importance < minImportance) {
        reasons.push(`Low importance: ${memory.importance}`);
        return false;
      }
      
      // Check age
      if (currentTime - memory.timestamp > maxAge) {
        reasons.push(`Too old: ${Math.floor((currentTime - memory.timestamp) / (24 * 60 * 60 * 1000))} days`);
        return false;
      }
      
      return true;
    });

    // If still too many, remove least important and least accessed
    if (pruned.length > maxMemories) {
      pruned.sort((a, b) => {
        // Sort by importance * access frequency
        const scoreA = a.importance * Math.log(a.accessCount + 1);
        const scoreB = b.importance * Math.log(b.accessCount + 1);
        return scoreB - scoreA;
      });
      
      const excess = pruned.length - maxMemories;
      pruned = pruned.slice(0, maxMemories);
      
      for (let i = 0; i < excess; i++) {
        reasons.push('Capacity limit exceeded');
      }
    }

    const prunedCount = projectMemories.length - pruned.length;
    this.memories.set(projectName, pruned);
    
    console.log(`✅ Mock: Pruned ${prunedCount} memories, ${pruned.length} remaining`);
    return { pruned: prunedCount, reason: reasons };
  }
}
