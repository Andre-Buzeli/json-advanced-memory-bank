/**
 * Universal Smart Summary Service for Advanced Memory Bank
 * Generates intelligent summaries based on configurable patterns and analysis
 */

import { ContentAnalysisService } from './content-analysis.js';
import { ContentAnalysisConfig, ConfigurationFactory } from './content-analysis-config.js';
import { MemoryEntry, MemoryCategory, ImportanceLevel, SmartSummary } from '../types/index.js';

export class SmartSummaryService {
  private contentAnalysis: ContentAnalysisService;
  private config: ContentAnalysisConfig;

  constructor(config?: ContentAnalysisConfig) {
    this.config = config || ConfigurationFactory.createUniversalConfig();
    this.contentAnalysis = new ContentAnalysisService(this.config);
  }

  /**
   * Generate a smart summary from a collection of memories
   */
  public generateProjectSummary(memories: MemoryEntry[], projectName: string): SmartSummary {
    const totalMemories = memories.length;
    const totalSize = memories.reduce((sum, m) => sum + (m.metadata?.sizeKB || 0), 0);
    
    // Analyze categories distribution
    const categoryStats = this.analyzeCategoryDistribution(memories);
    
    // Extract key insights
    const keyInsights = this.extractKeyInsights(memories);
    
    // Generate next actions
    const nextActions = this.extractNextActions(memories);
    
    // Identify blockers
    const blockers = this.identifyBlockers(memories);
    
    // Calculate progress
    const progressSummary = this.calculateProgressSummary(memories);
    
    // Generate overview text
    const projectStatus = this.generateOverviewText(memories, projectName);

    return {
      projectStatus,
      nextActions,
      recentProgress: this.extractRecentProgress(memories),
      blockers,
      keyDecisions: this.extractKeyDecisions(memories),
      completionEstimate: this.estimateCompletion(progressSummary),
      categoryProgress: this.calculateCategoryProgress(memories),
      criticalMemories: this.identifyCriticalMemories(memories),
      recentlyModified: this.getRecentlyModified(memories)
    };
  }

  /**
   * Analyze category distribution across memories
   */
  private analyzeCategoryDistribution(memories: MemoryEntry[]): Record<MemoryCategory, number> {
    const distribution = {} as Record<MemoryCategory, number>;
    
    // Initialize all categories with 0
    Object.values(MemoryCategory).forEach(category => {
      distribution[category] = 0;
    });
    
    // Count memories by category
    memories.forEach(memory => {
      const category = memory.metadata?.category || MemoryCategory.REFERENCE;
      distribution[category]++;
    });
    
    return distribution;
  }

  /**
   * Extract key insights from memories using configurable patterns
   */
  private extractKeyInsights(memories: MemoryEntry[]): string[] {
    const insights: string[] = [];
    const allContent = memories.map(m => m.content).join(' ');
    
    // Use configurable patterns to detect insights
    const insightPatterns = [
      'learned', 'discovered', 'found', 'realized', 'concluded',
      'aprendi', 'descobri', 'encontrei', 'percebi', 'concluí'
    ];
    
    // Extract insights from decision and analysis categories
    const relevantMemories = memories.filter(m => 
      m.metadata?.category === MemoryCategory.DECISION ||
      m.metadata?.category === MemoryCategory.ANALYSIS ||
      m.metadata?.category === MemoryCategory.RESEARCH
    );
    
    relevantMemories.forEach(memory => {
      insightPatterns.forEach(pattern => {
        const regex = new RegExp(`\\b${pattern}\\s+[^.!?]*[.!?]`, 'gi');
        const matches = memory.content.match(regex);
        if (matches) {
          insights.push(...matches.map(m => m.trim()).slice(0, 2));
        }
      });
    });
    
    // Remove duplicates and limit
    return [...new Set(insights)].slice(0, 5);
  }

  /**
   * Extract next actions from all memories
   */
  private extractNextActions(memories: MemoryEntry[]): string[] {
    const actions: string[] = [];
    
    memories.forEach(memory => {
      if (memory.metadata?.actionItems) {
        actions.push(...memory.metadata.actionItems);
      }
      
      // Extract from progress indicators
      if (memory.metadata?.progressIndicators?.pending) {
        actions.push(...memory.metadata.progressIndicators.pending);
      }
    });
    
    // Prioritize by importance level
    const prioritizedActions = this.prioritizeActions(actions, memories);
    
    return [...new Set(prioritizedActions)].slice(0, 10);
  }

  /**
   * Identify potential blockers from memories
   */
  private identifyBlockers(memories: MemoryEntry[]): string[] {
    const blockers: string[] = [];
    
    // Look for blocked progress indicators - remove this since it's not in the type
    memories.forEach(memory => {
      // Look for issue category memories with high importance
      if (memory.metadata?.category === MemoryCategory.ISSUE &&
          memory.metadata?.importanceLevel === ImportanceLevel.HIGH) {
        // Extract potential blocker from title or first line
        const firstLine = memory.content.split('\n')[0];
        if (firstLine.length > 10 && firstLine.length < 100) {
          blockers.push(firstLine.replace(/^#+\s*/, ''));
        }
      }
    });
    
    // Use configurable patterns to detect blocker keywords
    const blockerPatterns = this.config.progressPatterns.blocked;
    memories.forEach(memory => {
      blockerPatterns.forEach(pattern => {
        try {
          const regex = new RegExp(pattern, 'gi');
          const matches = memory.content.match(regex);
          if (matches) {
            blockers.push(...matches.slice(0, 2));
          }
        } catch (error) {
          // Skip invalid patterns
        }
      });
    });
    
    return [...new Set(blockers)].slice(0, 5);
  }

  /**
   * Calculate overall progress summary
   */
  private calculateProgressSummary(memories: MemoryEntry[]): {
    overallCompleteness: number;
    totalTasks: number;
    completedTasks: number;
  } {
    let totalTasks = 0;
    let completedTasks = 0;
    
    memories.forEach(memory => {
      const progressIndicators = memory.metadata?.progressIndicators;
      if (progressIndicators) {
        const completed = progressIndicators.completed?.length || 0;
        const inProgress = progressIndicators.inProgress?.length || 0;
        const pending = progressIndicators.pending?.length || 0;
        
        totalTasks += completed + inProgress + pending;
        completedTasks += completed;
      }
    });
    
    const overallCompleteness = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    return {
      overallCompleteness: Math.round(overallCompleteness * 100) / 100,
      totalTasks,
      completedTasks
    };
  }

  /**
   * Calculate average importance across all memories
   */
  private calculateAverageImportance(memories: MemoryEntry[]): number {
    const importanceScores = {
      [ImportanceLevel.LOW]: 1,
      [ImportanceLevel.MEDIUM]: 2,
      [ImportanceLevel.HIGH]: 3,
      [ImportanceLevel.CRITICAL]: 4
    };
    
    const scores = memories.map(m => 
      importanceScores[m.metadata?.importanceLevel || ImportanceLevel.MEDIUM]
    );
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average * 100) / 100;
  }

  /**
   * Generate overview text based on project analysis
   */
  private generateOverviewText(memories: MemoryEntry[], projectName: string): string {
    const totalMemories = memories.length;
    const primaryCategory = this.getMostCommonCategory(memories);
    const progressSummary = this.calculateProgressSummary(memories);
    const avgImportance = this.calculateAverageImportance(memories);
    
    // Generate overview based on detected language
    const sampleContent = memories.slice(0, 3).map(m => m.content).join(' ');
    const detectedLanguage = this.contentAnalysis['detectLanguage'](sampleContent);
    
    if (detectedLanguage === 'pt' || detectedLanguage.startsWith('pt')) {
      return this.generatePortugueseOverview(projectName, totalMemories, primaryCategory, progressSummary, avgImportance);
    } else {
      return this.generateEnglishOverview(projectName, totalMemories, primaryCategory, progressSummary, avgImportance);
    }
  }

  /**
   * Generate Portuguese overview
   */
  private generatePortugueseOverview(
    projectName: string, 
    totalMemories: number, 
    primaryCategory: MemoryCategory,
    progressSummary: any,
    avgImportance: number
  ): string {
    const completenessPercent = Math.round(progressSummary.overallCompleteness * 100);
    const categoryText = this.getCategoryTextPT(primaryCategory);
    
    return `Projeto ${projectName} contém ${totalMemories} memórias, ` +
           `focado principalmente em ${categoryText}. ` +
           `Progresso atual: ${completenessPercent}% (${progressSummary.completedTasks}/${progressSummary.totalTasks} tarefas). ` +
           `Importância média: ${avgImportance}/4. ` +
           `Sistema inteligente detectou padrões e fornece insights automáticos.`;
  }

  /**
   * Generate English overview
   */
  private generateEnglishOverview(
    projectName: string, 
    totalMemories: number, 
    primaryCategory: MemoryCategory,
    progressSummary: any,
    avgImportance: number
  ): string {
    const completenessPercent = Math.round(progressSummary.overallCompleteness * 100);
    const categoryText = this.getCategoryTextEN(primaryCategory);
    
    return `Project ${projectName} contains ${totalMemories} memories, ` +
           `primarily focused on ${categoryText}. ` +
           `Current progress: ${completenessPercent}% (${progressSummary.completedTasks}/${progressSummary.totalTasks} tasks). ` +
           `Average importance: ${avgImportance}/4. ` +
           `Intelligent system detected patterns and provides automatic insights.`;
  }

  /**
   * Get most common category across memories
   */
  private getMostCommonCategory(memories: MemoryEntry[]): MemoryCategory {
    const distribution = this.analyzeCategoryDistribution(memories);
    let maxCount = 0;
    let mostCommon = MemoryCategory.REFERENCE;
    
    for (const [category, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = category as MemoryCategory;
      }
    }
    
    return mostCommon;
  }

  /**
   * Prioritize actions based on memory importance
   */
  private prioritizeActions(actions: string[], memories: MemoryEntry[]): string[] {
    // This is a simplified prioritization - could be enhanced
    return actions.sort((a, b) => {
      // Prioritize shorter, more actionable items
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.localeCompare(b);
    });
  }

  /**
   * Get category text in Portuguese
   */
  private getCategoryTextPT(category: MemoryCategory): string {
    const translations = {
      [MemoryCategory.RESEARCH]: 'pesquisa',
      [MemoryCategory.DECISION]: 'tomada de decisão',
      [MemoryCategory.IMPLEMENTATION]: 'implementação',
      [MemoryCategory.STATUS]: 'status e progresso',
      [MemoryCategory.GUIDE]: 'guias e documentação',
      [MemoryCategory.ANALYSIS]: 'análise de dados',
      [MemoryCategory.MEETING]: 'reuniões e discussões',
      [MemoryCategory.ISSUE]: 'problemas e soluções',
      [MemoryCategory.IDEA]: 'ideias e brainstorming',
      [MemoryCategory.REFERENCE]: 'materiais de referência'
    };
    return translations[category] || 'conteúdo geral';
  }

  /**
   * Get category text in English
   */
  private getCategoryTextEN(category: MemoryCategory): string {
    const translations = {
      [MemoryCategory.RESEARCH]: 'research',
      [MemoryCategory.DECISION]: 'decision making',
      [MemoryCategory.IMPLEMENTATION]: 'implementation',
      [MemoryCategory.STATUS]: 'status and progress',
      [MemoryCategory.GUIDE]: 'guides and documentation',
      [MemoryCategory.ANALYSIS]: 'data analysis',
      [MemoryCategory.MEETING]: 'meetings and discussions',
      [MemoryCategory.ISSUE]: 'issues and solutions',
      [MemoryCategory.IDEA]: 'ideas and brainstorming',
      [MemoryCategory.REFERENCE]: 'reference materials'
    };
    return translations[category] || 'general content';
  }

  /**
   * Extract recent progress from memories
   */
  private extractRecentProgress(memories: MemoryEntry[]): string[] {
    const progress: string[] = [];
    
    memories.forEach(memory => {
      if (memory.metadata?.progressIndicators?.completed) {
        progress.push(...memory.metadata.progressIndicators.completed);
      }
    });
    
    return [...new Set(progress)].slice(0, 5);
  }

  /**
   * Extract key decisions from memories
   */
  private extractKeyDecisions(memories: MemoryEntry[]): string[] {
    const decisions: string[] = [];
    
    const decisionMemories = memories.filter(m => 
      m.metadata?.category === MemoryCategory.DECISION &&
      m.metadata?.importanceLevel !== ImportanceLevel.LOW
    );
    
    decisionMemories.forEach(memory => {
      const firstLine = memory.content.split('\n')[0];
      if (firstLine.length > 10 && firstLine.length < 100) {
        decisions.push(firstLine.replace(/^#+\s*/, ''));
      }
    });
    
    return [...new Set(decisions)].slice(0, 5);
  }

  /**
   * Estimate project completion
   */
  private estimateCompletion(progressSummary: any): string {
    const completeness = progressSummary.overallCompleteness;
    
    if (completeness >= 0.9) return 'Nearly complete';
    if (completeness >= 0.7) return 'In final phase';
    if (completeness >= 0.5) return 'Halfway complete';
    if (completeness >= 0.3) return 'Early progress';
    return 'Just started';
  }

  /**
   * Calculate progress by category
   */
  private calculateCategoryProgress(memories: MemoryEntry[]): Record<MemoryCategory, number> {
    const progress = {} as Record<MemoryCategory, number>;
    
    Object.values(MemoryCategory).forEach(category => {
      const categoryMemories = memories.filter(m => m.metadata?.category === category);
      
      if (categoryMemories.length === 0) {
        progress[category] = 0;
        return;
      }
      
      let totalTasks = 0;
      let completedTasks = 0;
      
      categoryMemories.forEach(memory => {
        const progressIndicators = memory.metadata?.progressIndicators;
        if (progressIndicators) {
          const completed = progressIndicators.completed?.length || 0;
          const inProgress = progressIndicators.inProgress?.length || 0;
          const pending = progressIndicators.pending?.length || 0;
          
          totalTasks += completed + inProgress + pending;
          completedTasks += completed;
        }
      });
      
      progress[category] = totalTasks > 0 ? completedTasks / totalTasks : 0.5;
    });
    
    return progress;
  }

  /**
   * Identify critical memories needing attention
   */
  private identifyCriticalMemories(memories: MemoryEntry[]): string[] {
    const critical = memories
      .filter(m => m.metadata?.importanceLevel === ImportanceLevel.CRITICAL)
      .map(m => m.title)
      .slice(0, 5);
    
    return critical;
  }

  /**
   * Get recently modified memories
   */
  private getRecentlyModified(memories: MemoryEntry[]): string[] {
    const recent = memories
      .filter(m => m.lastUpdated) // Filter out entries without lastUpdated
      .sort((a, b) => {
        // Ensure we have Date objects
        const dateA = a.lastUpdated instanceof Date ? a.lastUpdated : new Date(a.lastUpdated);
        const dateB = b.lastUpdated instanceof Date ? b.lastUpdated : new Date(b.lastUpdated);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(m => m.title);
    
    return recent;
  }
}
