/**
 * Sequential Thinking v4.0.0 - Structured problem analysis
 */

import { MemoryManager } from './memory-manager.js';
import { ThoughtResult } from '../types/index.js';

export class SequentialThinking {
  private readonly version = '4.0.0';
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  /**
   * Process a single thought in the sequential thinking chain
   */
  async processThought(
    thought: string,
    thoughtNumber: number,
    totalThoughts: number,
    nextThoughtNeeded: boolean,
    isRevision?: boolean,
    revisesThought?: number
  ): Promise<ThoughtResult> {
    try {
      // Store the thought in memory
      await this.memoryManager.storeMemory(
        `Sequential Thought ${thoughtNumber}/${totalThoughts}: ${thought}`,
        ['sequential-thinking', 'thought-process'],
        7
      );

      // Determine status based on progress
      let status = 'processing';
      if (thoughtNumber === totalThoughts && !nextThoughtNeeded) {
        status = 'complete';
      } else if (isRevision) {
        status = 'revising';
      } else if (thoughtNumber > totalThoughts * 0.8) {
        status = 'concluding';
      }

      return {
        thoughtNumber,
        totalThoughts,
        content: this.enhanceThought(thought, thoughtNumber, totalThoughts),
        status,
        nextThoughtNeeded,
      };
    } catch (error) {
      throw new Error(`Sequential thinking failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Enhance thought with context and analysis
   */
  private enhanceThought(thought: string, thoughtNumber: number, totalThoughts: number): string {
    const progress = (thoughtNumber / totalThoughts) * 100;
    const stage = this.getThoughtStage(thoughtNumber, totalThoughts);
    
    return `[${stage}] ${thought}

**Progress:** ${progress.toFixed(1)}% (${thoughtNumber}/${totalThoughts})
**Stage Analysis:** ${this.getStageDescription(stage)}`;
  }

  /**
   * Determine the current stage of thinking
   */
  private getThoughtStage(thoughtNumber: number, totalThoughts: number): string {
    const ratio = thoughtNumber / totalThoughts;
    
    if (ratio <= 0.2) return 'Problem Definition';
    if (ratio <= 0.4) return 'Analysis';
    if (ratio <= 0.6) return 'Solution Generation';
    if (ratio <= 0.8) return 'Evaluation';
    return 'Conclusion';
  }

  /**
   * Get description for the current stage
   */
  private getStageDescription(stage: string): string {
    const descriptions = {
      'Problem Definition': 'Understanding and defining the core problem',
      'Analysis': 'Breaking down the problem into components',
      'Solution Generation': 'Developing potential solutions and approaches',
      'Evaluation': 'Assessing solutions and their implications',
      'Conclusion': 'Finalizing insights and recommendations'
    };
    
    return descriptions[stage as keyof typeof descriptions] || 'Processing current thought';
  }
}
