/**
 * Universal Content Analysis Service for Advanced Memory Bank
 * Provides intelligent categorization, metadata extraction, and relationship detection
 * Completely configurable and adaptable to any domain, language, or project type
 */

import crypto from 'crypto';
import {
  MemoryCategory,
  ImportanceLevel,
  ContentAnalysis,
  EnhancedMemoryMetadata,
  MemoryMetadata
} from '../types/index.js';
import { ContentAnalysisConfig, ConfigurationFactory } from './content-analysis-config.js';

export class ContentAnalysisService {
  private config: ContentAnalysisConfig;
  
  constructor(config?: ContentAnalysisConfig) {
    this.config = config || ConfigurationFactory.createUniversalConfig();
  }

  /**
   * Update the configuration for this service instance
   */
  public updateConfig(config: ContentAnalysisConfig): void {
    this.config = config;
  }
  
  /**
   * Analyze memory content and generate enhanced metadata
   */
  public analyzeContent(content: string, title: string, existingMetadata?: Partial<MemoryMetadata>): ContentAnalysis {
    const analysis: ContentAnalysis = {
      category: this.detectCategory(content, title),
      importance: this.detectImportance(content, title),
      keywords: this.extractKeywords(content),
      actionItems: this.extractActionItems(content),
      progressIndicators: this.extractProgressIndicators(content),
      relationships: this.detectRelationships(content),
      quality: this.assessQuality(content)
    };

    return analysis;
  }

  /**
   * Generate enhanced metadata from content analysis
   */
  public generateEnhancedMetadata(
    content: string, 
    title: string, 
    analysis: ContentAnalysis,
    existingMetadata?: Partial<MemoryMetadata>
  ): EnhancedMemoryMetadata {
    const contentHash = this.generateContentHash(content);
    const sizeKB = this.calculateSizeKB(content);
    const estimatedReadTime = this.calculateReadTime(content);

    const enhanced: EnhancedMemoryMetadata = {
      // Inherit existing metadata
      ...existingMetadata,
      
      // Enhanced fields
      category: analysis.category.type,
      importanceLevel: analysis.importance.level,
      estimatedReadTime,
      sizeKB,
      completeness: analysis.quality.completeness,
      dependencies: analysis.relationships.dependencies,
      dependents: [], // Will be populated by relationship analysis
      relatedMemories: [], // Will be populated by cross-reference analysis
      keywords: Object.keys(analysis.keywords),
      language: this.detectLanguage(content),
      contentHash,
      version: existingMetadata?.version ? (existingMetadata.version as number) + 1 : 1,
      archived: false,
      actionItems: analysis.actionItems,
      progressIndicators: {
        completed: analysis.progressIndicators.statusKeywords.filter(k => 
          k.includes('complet') || k.includes('done') || k.includes('finished') || k.includes('ready')
        ),
        inProgress: analysis.progressIndicators.statusKeywords.filter(k => 
          k.includes('progress') || k.includes('working') || k.includes('developing')
        ),
        pending: analysis.progressIndicators.statusKeywords.filter(k => 
          k.includes('pending') || k.includes('todo') || k.includes('planned')
        )
      }
    };

    return enhanced;
  }

  /**
   * Detect memory category based on universal configurable patterns
   */
  private detectCategory(content: string, title: string): { type: MemoryCategory; confidence: number } {
    const text = (title + ' ' + content).toLowerCase();
    
    let bestMatch = MemoryCategory.REFERENCE;
    let highestScore = 0;

    // Use configurable category patterns
    for (const [categoryKey, categoryConfig] of Object.entries(this.config.categoryPatterns)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of categoryConfig.keywords) {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * categoryConfig.weight;
        }
      }
      
      // Check regex patterns
      for (const pattern of categoryConfig.patterns) {
        try {
          const regex = new RegExp(pattern, 'gi');
          const matches = text.match(regex);
          if (matches) {
            score += matches.length * categoryConfig.weight;
          }
        } catch (error) {
          // Skip invalid regex patterns
          console.warn(`Invalid regex pattern: ${pattern}`);
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = categoryKey as MemoryCategory;
      }
    }

    // Calculate confidence based on keyword density and threshold
    const wordCount = text.split(/\s+/).length;
    const confidence = Math.min(highestScore / (wordCount * 0.1), 1.0);
    
    // Use the configured minimum confidence for the detected category
    const categoryConfig = this.config.categoryPatterns[bestMatch];
    const minConfidence = categoryConfig?.minConfidence || 0.3;

    return {
      type: bestMatch,
      confidence: Math.max(confidence, minConfidence)
    };
  }

  /**
   * Detect importance level using configurable patterns
   */
  private detectImportance(content: string, title: string): { level: ImportanceLevel; confidence: number } {
    const text = (title + ' ' + content).toLowerCase();
    
    let bestLevel = ImportanceLevel.MEDIUM;
    let highestScore = 0;
    let bestWeight = 0;

    // Use configurable importance patterns
    for (const [levelKey, levelConfig] of Object.entries(this.config.importancePatterns)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of levelConfig.keywords) {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * levelConfig.weight;
        }
      }
      
      // Check regex patterns
      for (const pattern of levelConfig.patterns) {
        try {
          const regex = new RegExp(pattern, 'gi');
          const matches = text.match(regex);
          if (matches) {
            score += matches.length * levelConfig.weight;
          }
        } catch (error) {
          // Skip invalid regex patterns
          console.warn(`Invalid regex pattern: ${pattern}`);
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestLevel = levelKey as ImportanceLevel;
        bestWeight = levelConfig.weight;
      }
    }

    // Calculate confidence based on score and content characteristics
    let confidence = Math.min(highestScore / (text.split(/\s+/).length * 0.05), 1.0);
    
    // Adjust confidence based on weight
    confidence = Math.min(confidence * bestWeight, 1.0);
    
    // Adjust based on content length and structure
    if (content.length > 5000) {
      if (bestLevel === ImportanceLevel.LOW) bestLevel = ImportanceLevel.MEDIUM;
      confidence += 0.1;
    }

    return { 
      level: bestLevel, 
      confidence: Math.max(Math.min(confidence, 1.0), 0.3) 
    };
  }

  /**
   * Extract keywords using configurable stop words and language detection
   */
  private extractKeywords(content: string): Record<string, number> {
    const text = content.toLowerCase();
    const detectedLanguage = this.detectLanguage(content);
    
    // Use configurable stop words for detected language
    const stopWords = new Set(
      this.config.language.stopWords[detectedLanguage] || 
      this.config.language.stopWords[this.config.language.primary] || 
      []
    );

    // Extract words with unicode support for multiple languages
    const words = text.match(/\b[\w\u00C0-\u017F\u0100-\u017F]{3,}\b/g) || [];
    
    const frequency: Record<string, number> = {};
    
    words.forEach(word => {
      if (!stopWords.has(word) && word.length >= 3) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // Sort by frequency and return top keywords
    const sorted = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);

    return Object.fromEntries(sorted);
  }

  /**
   * Extract action items using configurable patterns
   */
  private extractActionItems(content: string): string[] {
    const actionItems: string[] = [];
    
    // Use configurable action item patterns
    const patterns = [
      ...this.config.actionItemPatterns.checkboxes.map(p => new RegExp(p, 'gm')),
      ...this.config.actionItemPatterns.bullets.map(p => new RegExp(p, 'gm')),
      ...this.config.actionItemPatterns.todos.map(p => new RegExp(p, 'gm')),
      ...this.config.actionItemPatterns.custom.map(p => new RegExp(p, 'gm'))
    ];

    patterns.forEach(pattern => {
      try {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // Extract the captured group or the full match
          const item = match[1] || match[0];
          if (item && item.trim().length > 0) {
            actionItems.push(item.trim());
          }
        }
      } catch (error) {
        // Skip invalid regex patterns
        console.warn(`Invalid action item pattern: ${pattern}`);
      }
    });

    return [...new Set(actionItems)].slice(0, 10); // Remove duplicates and limit to 10 items
  }

  /**
   * Extract progress indicators using configurable patterns
   */
  private extractProgressIndicators(content: string): {
    checkboxes: { total: number; completed: number };
    percentages: number[];
    statusKeywords: string[];
  } {
    // Count checkboxes using configurable patterns
    let totalCheckboxes = 0;
    let completedCheckboxes = 0;

    // Use configured patterns for completed items
    this.config.progressPatterns.completed.forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          completedCheckboxes += matches.length;
          totalCheckboxes += matches.length;
        }
      } catch (error) {
        console.warn(`Invalid completed pattern: ${pattern}`);
      }
    });

    // Count in-progress and other status indicators for total
    [
      ...this.config.progressPatterns.inProgress,
      ...this.config.progressPatterns.pending,
      ...this.config.progressPatterns.blocked
    ].forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          totalCheckboxes += matches.length;
        }
      } catch (error) {
        console.warn(`Invalid progress pattern: ${pattern}`);
      }
    });

    // Extract percentages using configurable pattern
    const percentages: number[] = [];
    try {
      const regex = new RegExp(this.config.progressPatterns.percentagePattern, 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        const percentage = parseInt(match[1] || match[0]);
        if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
          percentages.push(percentage);
        }
      }
    } catch (error) {
      console.warn(`Invalid percentage pattern: ${this.config.progressPatterns.percentagePattern}`);
    }

    // Extract status keywords using all configured patterns
    const statusKeywords: string[] = [];
    const allStatusPatterns = [
      ...this.config.progressPatterns.completed,
      ...this.config.progressPatterns.inProgress,
      ...this.config.progressPatterns.pending,
      ...this.config.progressPatterns.blocked
    ];

    allStatusPatterns.forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          statusKeywords.push(...matches.map(m => m.toLowerCase()));
        }
      } catch (error) {
        console.warn(`Invalid status pattern: ${pattern}`);
      }
    });

    return {
      checkboxes: { total: totalCheckboxes, completed: completedCheckboxes },
      percentages,
      statusKeywords: [...new Set(statusKeywords)] // Remove duplicates
    };
  }

  /**
   * Detect relationships using configurable patterns
   */
  private detectRelationships(content: string): {
    mentions: string[];
    references: string[];
    dependencies: string[];
  } {
    const mentions: string[] = [];
    const references: string[] = [];
    const dependencies: string[] = [];

    // Extract file/document references using configurable patterns
    this.config.relationshipPatterns.fileReferences.forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          mentions.push(...matches);
        }
      } catch (error) {
        console.warn(`Invalid file reference pattern: ${pattern}`);
      }
    });

    // Extract cross-references using configurable patterns
    this.config.relationshipPatterns.crossReferences.forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          references.push(...matches);
        }
      } catch (error) {
        console.warn(`Invalid cross-reference pattern: ${pattern}`);
      }
    });

    // Extract dependencies using configurable patterns
    this.config.relationshipPatterns.dependencies.forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          dependencies.push(...matches);
        }
      } catch (error) {
        console.warn(`Invalid dependency pattern: ${pattern}`);
      }
    });

    // Extract mentions using configurable patterns
    this.config.relationshipPatterns.mentions.forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          mentions.push(...matches);
        }
      } catch (error) {
        console.warn(`Invalid mention pattern: ${pattern}`);
      }
    });

    return {
      mentions: [...new Set(mentions)],
      references: [...new Set(references)],
      dependencies: [...new Set(dependencies)]
    };
  }

  /**
   * Assess content quality using configurable thresholds
   */
  private assessQuality(content: string): { completeness: number; readability: number; structure: number } {
    const length = content.length;
    const words = content.split(/\s+/).length;
    
    // Use configurable minimum content length
    const minLength = this.config.qualityThresholds.minContentLength;
    
    // Completeness based on configurable thresholds
    let completeness = 0;
    if (length >= minLength) completeness += 0.4;
    if (length >= minLength * 3) completeness += 0.3;
    if (length >= minLength * 5) completeness += 0.3;

    // Readability based on configurable sentence length range
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
    const { min, max } = this.config.qualityThresholds.sentenceLengthRange;
    let readability = avgWordsPerSentence >= min && avgWordsPerSentence <= max ? 0.8 : 0.5;
    
    // Adjust readability based on complexity indicators
    if (content.includes('```')) readability *= 0.9; // Code reduces readability slightly
    if (content.includes('http')) readability *= 0.95; // Links reduce readability slightly

    // Structure based on configurable indicators and their weights
    let structure = 0;
    const indicators = this.config.qualityThresholds.structureIndicators;
    
    // Count headers and apply weight
    const headerCount = (content.match(/^#+\s/gm) || []).length;
    if (headerCount > 0) structure += indicators.headers;
    
    // Count lists and apply weight
    const listCount = (content.match(/^[-*+]\s|^\d+\.\s/gm) || []).length;
    if (listCount > 0) structure += indicators.lists;
    
    // Count code blocks and apply weight
    const codeBlockCount = (content.match(/```/g) || []).length / 2; // Pairs of ```
    if (codeBlockCount > 0) structure += indicators.codeBlocks;
    
    // Count links and apply weight
    const linkCount = (content.match(/\[.*?\]\(.*?\)|https?:\/\/\S+/g) || []).length;
    if (linkCount > 0) structure += indicators.links;

    return {
      completeness: Math.min(completeness, 1.0),
      readability: Math.min(readability, 1.0),
      structure: Math.min(structure, 1.0)
    };
  }

  /**
   * Generate content hash for change detection
   */
  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Calculate content size in KB
   */
  private calculateSizeKB(content: string): number {
    return Math.round((Buffer.byteLength(content, 'utf8') / 1024) * 100) / 100;
  }

  /**
   * Calculate estimated reading time using configurable words per minute
   */
  private calculateReadTime(content: string): number {
    const words = content.split(/\s+/).length;
    
    // Determine content type and use appropriate WPM
    let wordsPerMinute = this.config.readingTime.wordsPerMinute.prose; // Default
    
    // Adjust for technical content
    const techIndicators = ['function', 'class', 'method', 'algorithm', 'implementation', 'api'];
    const isTechnical = techIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
    if (isTechnical) {
      wordsPerMinute = this.config.readingTime.wordsPerMinute.technical;
    }
    
    // Adjust for code content
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    const codeRatio = codeBlocks > 0 ? (codeBlocks * 100) / words : 0;
    if (codeRatio > 0.1) { // More than 10% code
      wordsPerMinute = this.config.readingTime.wordsPerMinute.code;
    }
    
    // Apply adjustment factors
    if (isTechnical) {
      wordsPerMinute *= this.config.readingTime.adjustments.complexity;
    }
    if (codeRatio > 0) {
      wordsPerMinute *= this.config.readingTime.adjustments.codeRatio;
    }
    
    const estimatedTime = words / wordsPerMinute;
    return Math.max(1, Math.round(estimatedTime));
  }

  /**
   * Detect content language using configurable detection patterns
   */
  private detectLanguage(content: string): string {
    const text = content.toLowerCase();
    const scores: Record<string, number> = {};
    
    // Initialize scores for all configured languages
    Object.keys(this.config.language.detectionPatterns).forEach(lang => {
      scores[lang] = 0;
    });

    // Score each language based on detection patterns
    for (const [language, patterns] of Object.entries(this.config.language.detectionPatterns)) {
      patterns.forEach(pattern => {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          scores[language] += matches.length;
        }
      });
    }

    // Find the language with the highest score
    let bestLanguage = this.config.language.primary;
    let highestScore = 0;
    
    for (const [language, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestLanguage = language;
      }
    }

    // Return detected language or fallback to primary
    return highestScore > 0 ? bestLanguage : this.config.language.primary;
  }
}
