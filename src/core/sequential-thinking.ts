/**
 * Sequential Thinking - Enhanced thinking tool for complex problem solving with branching and revision support
 */

export interface ThoughtRequest {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
}

export interface ThoughtResult {
  thoughtNumber: number;
  totalThoughts: number;
  thought: string;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  analysis?: ThoughtAnalysis;
}

export interface ThoughtAnalysis {
  complexity: 'low' | 'medium' | 'high';
  coherence: number; // 0-1 score
  progression: 'linear' | 'branching' | 'circular';
  suggestions?: string[];
}

export class SequentialThinking {
  private thoughtHistory: ThoughtResult[] = [];
  
  /**
   * Process a single thought in the sequence
   * @param request - Thought request
   * @returns Processed thought result
   */
  async processThought(request: ThoughtRequest): Promise<ThoughtResult> {
    const result: ThoughtResult = {
      thoughtNumber: request.thoughtNumber,
      totalThoughts: request.totalThoughts,
      thought: this.enhanceThought(request.thought, request.thoughtNumber),
      nextThoughtNeeded: request.nextThoughtNeeded,
      isRevision: request.isRevision,
      revisesThought: request.revisesThought,
      branchFromThought: request.branchFromThought,
      branchId: request.branchId,
      needsMoreThoughts: request.needsMoreThoughts,
    };
    
    // Add analysis
    result.analysis = this.analyzeThought(request, this.thoughtHistory);
    
    // Store in history
    this.thoughtHistory.push(result);
    
    // Generate formatted output
    return result;
  }

  /**
   * Enhance thought with additional context and structure
   * @param thought - Original thought
   * @param thoughtNumber - Thought sequence number
   * @returns Enhanced thought
   */
  private enhanceThought(thought: string, thoughtNumber: number): string {
    const timestamp = new Date().toISOString();
    const thoughtId = `T${thoughtNumber.toString().padStart(3, '0')}`;
    
    let enhanced = `**[${thoughtId}]** ${thought}`;
    
    // Add structural elements based on thought patterns
    if (thought.includes('because') || thought.includes('therefore')) {
      enhanced += '\n\n*🔍 Reasoning detected: Causal relationship identified*';
    }
    
    if (thought.includes('however') || thought.includes('but')) {
      enhanced += '\n\n*⚖️ Contrast detected: Alternative perspective considered*';
    }
    
    if (thought.includes('?')) {
      enhanced += '\n\n*❓ Question detected: Further exploration needed*';
    }
    
    if (thought.includes('solution') || thought.includes('approach')) {
      enhanced += '\n\n*💡 Solution identified: Implementation pathway emerging*';
    }
    
    return enhanced;
  }

  /**
   * Analyze thought quality and progression
   * @param request - Current thought request
   * @param history - Previous thoughts
   * @returns Thought analysis
   */
  private analyzeThought(request: ThoughtRequest, history: ThoughtResult[]): ThoughtAnalysis {
    const complexity = this.assessComplexity(request.thought);
    const coherence = this.calculateCoherence(request, history);
    const progression = this.determineProgression(history);
    const suggestions = this.generateSuggestions(request, history);
    
    return {
      complexity,
      coherence,
      progression,
      suggestions
    };
  }

  /**
   * Assess thought complexity
   * @param thought - Thought content
   * @returns Complexity level
   */
  private assessComplexity(thought: string): 'low' | 'medium' | 'high' {
    const indicators = {
      high: ['multiple', 'complex', 'interconnected', 'dependencies', 'trade-offs', 'implications'],
      medium: ['consider', 'analyze', 'compare', 'evaluate', 'relationship'],
      low: ['simple', 'straightforward', 'obvious', 'clear']
    };
    
    const text = thought.toLowerCase();
    
    const highCount = indicators.high.filter(word => text.includes(word)).length;
    const mediumCount = indicators.medium.filter(word => text.includes(word)).length;
    
    if (highCount >= 2 || text.length > 200) return 'high';
    if (mediumCount >= 2 || text.length > 100) return 'medium';
    return 'low';
  }

  /**
   * Calculate coherence with previous thoughts
   * @param request - Current thought request
   * @param history - Previous thoughts
   * @returns Coherence score (0-1)
   */
  private calculateCoherence(request: ThoughtRequest, history: ThoughtResult[]): number {
    if (history.length === 0) return 1.0;
    
    const currentText = request.thought.toLowerCase();
    let totalCoherence = 0;
    let relevantThoughts = 0;
    
    // Check coherence with recent thoughts (last 3)
    const recentThoughts = history.slice(-3);
    
    for (const prevThought of recentThoughts) {
      const prevText = prevThought.thought.toLowerCase();
      const sharedWords = this.countSharedWords(currentText, prevText);
      const coherenceScore = Math.min(1.0, sharedWords / 10); // Normalize to 0-1
      
      totalCoherence += coherenceScore;
      relevantThoughts++;
    }
    
    return relevantThoughts > 0 ? totalCoherence / relevantThoughts : 1.0;
  }

  /**
   * Count shared meaningful words between two texts
   * @param text1 - First text
   * @param text2 - Second text
   * @returns Number of shared words
   */
  private countSharedWords(text1: string, text2: string): number {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    const words1 = text1.split(/\W+/).filter(word => word.length > 3 && !stopWords.has(word));
    const words2 = text2.split(/\W+/).filter(word => word.length > 3 && !stopWords.has(word));
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    let sharedCount = 0;
    for (const word of set1) {
      if (set2.has(word)) sharedCount++;
    }
    
    return sharedCount;
  }

  /**
   * Determine progression pattern
   * @param history - Thought history
   * @returns Progression type
   */
  private determineProgression(history: ThoughtResult[]): 'linear' | 'branching' | 'circular' {
    if (history.length < 2) return 'linear';
    
    const hasBranches = history.some(thought => thought.branchFromThought || thought.branchId);
    const hasRevisions = history.some(thought => thought.isRevision);
    
    if (hasBranches) return 'branching';
    if (hasRevisions) return 'circular';
    return 'linear';
  }

  /**
   * Generate suggestions for next thoughts
   * @param request - Current thought request
   * @param history - Previous thoughts
   * @returns Array of suggestions
   */
  private generateSuggestions(request: ThoughtRequest, history: ThoughtResult[]): string[] {
    const suggestions: string[] = [];
    const thought = request.thought.toLowerCase();
    
    // Suggestions based on thought content
    if (thought.includes('problem') && !thought.includes('solution')) {
      suggestions.push('Consider exploring potential solutions');
    }
    
    if (thought.includes('option') || thought.includes('alternative')) {
      suggestions.push('Analyze trade-offs between different approaches');
    }
    
    if (thought.includes('?')) {
      suggestions.push('Try to answer the questions raised');
    }
    
    if (request.thoughtNumber === request.totalThoughts && request.nextThoughtNeeded) {
      suggestions.push('Consider extending the thinking process');
    }
    
    // Suggestions based on progression
    const progression = this.determineProgression(history);
    if (progression === 'linear' && history.length > 3) {
      suggestions.push('Consider branching to explore alternative angles');
    }
    
    if (history.length > 0) {
      const lastAnalysis = history[history.length - 1].analysis;
      if (lastAnalysis && lastAnalysis.coherence < 0.5) {
        suggestions.push('Revisit previous thoughts to improve coherence');
      }
    }
    
    return suggestions;
  }

  /**
   * Get thinking summary and insights
   * @returns Summary of thought sequence
   */
  getThinkingSummary(): string {
    if (this.thoughtHistory.length === 0) {
      return 'No thoughts processed yet.';
    }
    
    const totalThoughts = this.thoughtHistory.length;
    const avgCoherence = this.thoughtHistory.reduce((sum, t) => sum + (t.analysis?.coherence || 0), 0) / totalThoughts;
    const complexityDistribution = this.getComplexityDistribution();
    const progressionType = this.determineProgression(this.thoughtHistory);
    
    let summary = `# 🧠 Sequential Thinking Summary\n\n`;
    summary += `**Total Thoughts Processed:** ${totalThoughts}\n`;
    summary += `**Average Coherence:** ${Math.round(avgCoherence * 100)}%\n`;
    summary += `**Progression Type:** ${progressionType}\n\n`;
    
    summary += `## 📊 Complexity Distribution\n`;
    summary += `- High: ${complexityDistribution.high} thoughts\n`;
    summary += `- Medium: ${complexityDistribution.medium} thoughts\n`;
    summary += `- Low: ${complexityDistribution.low} thoughts\n\n`;
    
    summary += `## 🔍 Key Insights\n`;
    const insights = this.generateInsights();
    insights.forEach(insight => {
      summary += `- ${insight}\n`;
    });
    
    return summary;
  }

  /**
   * Get complexity distribution
   * @returns Complexity distribution
   */
  private getComplexityDistribution(): { high: number; medium: number; low: number } {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    this.thoughtHistory.forEach(thought => {
      if (thought.analysis) {
        distribution[thought.analysis.complexity]++;
      }
    });
    
    return distribution;
  }

  /**
   * Generate insights from thought sequence
   * @returns Array of insights
   */
  private generateInsights(): string[] {
    const insights: string[] = [];
    
    if (this.thoughtHistory.length === 0) return insights;
    
    const avgCoherence = this.thoughtHistory.reduce((sum, t) => sum + (t.analysis?.coherence || 0), 0) / this.thoughtHistory.length;
    
    if (avgCoherence > 0.8) {
      insights.push('High coherence maintained throughout thinking process');
    } else if (avgCoherence < 0.5) {
      insights.push('Consider improving thought coherence and connections');
    }
    
    const hasRevisions = this.thoughtHistory.some(t => t.isRevision);
    if (hasRevisions) {
      insights.push('Iterative refinement approach detected - good for complex problems');
    }
    
    const hasBranches = this.thoughtHistory.some(t => t.branchFromThought);
    if (hasBranches) {
      insights.push('Exploratory branching used - effective for considering alternatives');
    }
    
    const complexityTrend = this.analyzeComplexityTrend();
    if (complexityTrend === 'increasing') {
      insights.push('Complexity increasing over time - diving deeper into details');
    } else if (complexityTrend === 'decreasing') {
      insights.push('Complexity decreasing over time - converging toward solution');
    }
    
    return insights;
  }

  /**
   * Analyze complexity trend over time
   * @returns Trend direction
   */
  private analyzeComplexityTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.thoughtHistory.length < 3) return 'stable';
    
    const complexityScores = this.thoughtHistory.map(t => {
      switch (t.analysis?.complexity) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });
    
    const firstHalf = complexityScores.slice(0, Math.floor(complexityScores.length / 2));
    const secondHalf = complexityScores.slice(Math.floor(complexityScores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.3) return 'increasing';
    if (difference < -0.3) return 'decreasing';
    return 'stable';
  }

  /**
   * Reset thinking history
   */
  reset(): void {
    this.thoughtHistory = [];
  }
}