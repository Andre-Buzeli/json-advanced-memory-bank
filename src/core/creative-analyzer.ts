import { MemoryManager } from './memory-manager.js';
import { CreativeAnalysis } from '../types/index.js';

export class CreativeAnalyzer {
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  async analyzeContent(
    content: string,
    analysisType: string = 'comprehensive',
    depth: string = 'detailed'
  ): Promise<CreativeAnalysis> {
    try {
      await this.memoryManager.storeMemory(
        `Creative analysis: ${analysisType} of ${content.length} chars`,
        ['creative-analysis', analysisType],
        6
      );

      const analysis = this.performAnalysis(content, analysisType, depth);
      return analysis;
    } catch (error) {
      throw new Error(`Creative analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateInsights(theme: string, creativityLevel: string = 'balanced', limit: number = 5): Promise<string[]> {
    const insights = [
      `Creative exploration of ${theme}`,
      `${theme} offers creative possibilities`,
      `Innovative approaches to ${theme}`
    ];
    
    return insights.slice(0, limit);
  }

  private performAnalysis(content: string, analysisType: string, depth: string): CreativeAnalysis {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      analysisType,
      depth,
      wordCount: words.length,
      sentenceCount: sentences.length,
      insights: this.generateBasicInsights(content),
      suggestions: ['Consider adding more details', 'Explore creative expressions'],
      patterns: this.extractPatterns(content),
      themes: this.extractThemes(words),
      styleElements: ['neutral tone', 'medium complexity', 'objective voice']
    };
  }

  private generateBasicInsights(content: string): string[] {
    const insights: string[] = [];
    
    if (content.includes('!')) {
      insights.push('Expressive tone detected');
    }
    
    if (content.includes('?')) {
      insights.push('Interactive elements present');
    }
    
    return insights;
  }

  private extractPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('\n-') || content.includes('\n*')) {
      patterns.push('List structure');
    }
    
    return patterns;
  }

  private extractThemes(words: string[]): string[] {
    const commonWords = words
      .filter(w => w.length > 3)
      .slice(0, 3);
    
    return commonWords;
  }
}