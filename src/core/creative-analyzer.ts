/**
 * Creative Analyzer - Advanced analysis tool with trade-off matrices and decision trees
 */

export interface AnalysisOption {
  name: string;
  description: string;
  pros?: string[];
  cons?: string[];
}

export interface AnalysisRequest {
  component: string;
  options: AnalysisOption[];
  criteria: string[];
  projectName: string;
}

export interface AnalysisResult {
  component: string;
  analysis: string;
  tradeOffMatrix: TradeOffMatrix;
  recommendation?: string;
}

export interface TradeOffMatrix {
  criteria: string[];
  options: string[];
  scores: { [key: string]: { [key: string]: number | string } };
}

export class CreativeAnalyzer {
  
  /**
   * Analyze options with trade-off matrix and decision trees
   * @param request - Analysis request
   * @returns Analysis result
   */
  async analyze(request: AnalysisRequest): Promise<string> {
    const { component, options, criteria, projectName } = request;

    // Generate comprehensive analysis
    let analysisContent = `# 🎨 Creative Analysis - ${component}\n\n`;
    analysisContent += `**Project:** ${projectName}\n`;
    analysisContent += `**Component:** ${component}\n`;
    analysisContent += `**Analysis Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
    
    // Options overview
    analysisContent += `## 📊 Options Overview\n\n`;
    options.forEach((option, index) => {
      analysisContent += `### ${index + 1}. ${option.name}\n`;
      analysisContent += `${option.description}\n\n`;
      
      if (option.pros && option.pros.length > 0) {
        analysisContent += `**Advantages:**\n`;
        option.pros.forEach((pro) => {
          analysisContent += `- ✅ ${pro}\n`;
        });
        analysisContent += `\n`;
      }
      
      if (option.cons && option.cons.length > 0) {
        analysisContent += `**Disadvantages:**\n`;
        option.cons.forEach((con) => {
          analysisContent += `- ❌ ${con}\n`;
        });
        analysisContent += `\n`;
      }
    });
    
    // Trade-off analysis matrix
    analysisContent += `## 📈 Trade-off Analysis Matrix\n\n`;
    analysisContent += `| Criterion | ${options.map(opt => opt.name).join(' | ')} |\n`;
    analysisContent += `|${'-'.repeat(10)}|${options.map(() => '-'.repeat(10)).join('|')}|\n`;
    
    criteria.forEach((criterion) => {
      const scores = this.generateCriterionScores(options, criterion);
      analysisContent += `| **${criterion}** | ${scores.join(' | ')} |\n`;
    });
    
    // Decision factors
    analysisContent += `\n## 🎯 Decision Factors\n\n`;
    analysisContent += this.generateDecisionFactors(options, criteria);
    
    // Recommendations
    analysisContent += `\n## 💡 Recommendations\n\n`;
    analysisContent += this.generateRecommendations(options, criteria);
    
    // Decision tree
    analysisContent += `\n## 🌳 Decision Tree\n\n`;
    analysisContent += this.generateDecisionTree(options, criteria);
    
    return analysisContent;
  }

  /**
   * Generate scores for a criterion across all options
   * @param options - Analysis options
   * @param criterion - Evaluation criterion
   * @returns Array of scores
   */
  private generateCriterionScores(options: AnalysisOption[], criterion: string): string[] {
    // Simple scoring algorithm based on pros/cons count and content analysis
    return options.map(option => {
      const prosCount = option.pros?.length || 0;
      const consCount = option.cons?.length || 0;
      
      // Basic scoring: more pros = higher score, more cons = lower score
      const baseScore = Math.max(1, Math.min(5, 3 + prosCount - consCount));
      
      // Add contextual scoring based on criterion keywords
      const contextScore = this.getContextualScore(option, criterion);
      const finalScore = Math.max(1, Math.min(5, Math.round((baseScore + contextScore) / 2)));
      
      return this.scoreToText(finalScore);
    });
  }

  /**
   * Get contextual score based on criterion and option content
   * @param option - Analysis option
   * @param criterion - Evaluation criterion
   * @returns Contextual score
   */
  private getContextualScore(option: AnalysisOption, criterion: string): number {
    const text = `${option.name} ${option.description} ${option.pros?.join(' ') || ''} ${option.cons?.join(' ') || ''}`.toLowerCase();
    const criterionLower = criterion.toLowerCase();
    
    // Keyword-based scoring
    if (criterionLower.includes('performance')) {
      if (text.includes('fast') || text.includes('efficient') || text.includes('optimized')) return 5;
      if (text.includes('slow') || text.includes('heavy')) return 2;
    }
    
    if (criterionLower.includes('reliability')) {
      if (text.includes('stable') || text.includes('reliable') || text.includes('tested')) return 5;
      if (text.includes('experimental') || text.includes('unstable')) return 2;
    }
    
    if (criterionLower.includes('complexity') || criterionLower.includes('simple')) {
      if (text.includes('simple') || text.includes('easy')) return 5;
      if (text.includes('complex') || text.includes('difficult')) return 2;
    }
    
    return 3; // Default neutral score
  }

  /**
   * Convert numeric score to descriptive text
   * @param score - Numeric score (1-5)
   * @returns Descriptive text
   */
  private scoreToText(score: number): string {
    const scoreMap: { [key: number]: string } = {
      1: '⭐ Poor',
      2: '⭐⭐ Fair', 
      3: '⭐⭐⭐ Good',
      4: '⭐⭐⭐⭐ Very Good',
      5: '⭐⭐⭐⭐⭐ Excellent'
    };
    return scoreMap[score] || '⭐⭐⭐ Good';
  }

  /**
   * Generate decision factors analysis
   * @param options - Analysis options
   * @param criteria - Evaluation criteria
   * @returns Decision factors text
   */
  private generateDecisionFactors(options: AnalysisOption[], criteria: string[]): string {
    let factors = '';
    
    factors += `### Key Considerations\n\n`;
    criteria.forEach((criterion, index) => {
      factors += `${index + 1}. **${criterion}**: `;
      factors += `Evaluate each option based on this criterion to determine the best fit.\n`;
    });
    
    factors += `\n### Risk Assessment\n\n`;
    options.forEach((option, index) => {
      const riskLevel = this.assessRisk(option);
      factors += `- **${option.name}**: ${riskLevel} risk\n`;
    });
    
    return factors;
  }

  /**
   * Assess risk level for an option
   * @param option - Analysis option
   * @returns Risk assessment
   */
  private assessRisk(option: AnalysisOption): string {
    const consCount = option.cons?.length || 0;
    const prosCount = option.pros?.length || 0;
    const riskIndicators = (option.cons || []).join(' ').toLowerCase();
    
    if (riskIndicators.includes('experimental') || riskIndicators.includes('unstable') || consCount > prosCount + 1) {
      return '🔴 High';
    } else if (consCount > prosCount || riskIndicators.includes('complex')) {
      return '🟡 Medium';
    } else {
      return '🟢 Low';
    }
  }

  /**
   * Generate recommendations
   * @param options - Analysis options
   * @param criteria - Evaluation criteria
   * @returns Recommendations text
   */
  private generateRecommendations(options: AnalysisOption[], criteria: string[]): string {
    let recommendations = '';
    
    // Find the option with the best pros/cons ratio
    const scored = options.map(option => ({
      option,
      score: (option.pros?.length || 0) - (option.cons?.length || 0)
    }));
    
    const best = scored.sort((a, b) => b.score - a.score)[0];
    
    recommendations += `### 🏆 Primary Recommendation\n\n`;
    recommendations += `**${best.option.name}** appears to be the strongest option based on:\n`;
    if (best.option.pros) {
      best.option.pros.forEach(pro => {
        recommendations += `- ${pro}\n`;
      });
    }
    
    recommendations += `\n### 🔄 Alternative Considerations\n\n`;
    const alternatives = scored.slice(1, 3);
    alternatives.forEach(alt => {
      recommendations += `- **${alt.option.name}**: Consider if ${criteria[0] || 'specific requirements'} are prioritized\n`;
    });
    
    recommendations += `\n### 📋 Implementation Strategy\n\n`;
    recommendations += `1. **Prototype**: Start with ${best.option.name} for initial implementation\n`;
    recommendations += `2. **Evaluate**: Monitor performance against key criteria\n`;
    recommendations += `3. **Iterate**: Be prepared to pivot if requirements change\n`;
    
    return recommendations;
  }

  /**
   * Generate decision tree diagram
   * @param options - Analysis options
   * @param criteria - Evaluation criteria
   * @returns Decision tree text
   */
  private generateDecisionTree(options: AnalysisOption[], criteria: string[]): string {
    let tree = '';
    
    tree += `\`\`\`\n`;
    tree += `Decision Tree for Component Selection\n`;
    tree += `\n`;
    tree += `Start: Choose Component Implementation\n`;
    tree += `├─ ${criteria[0] || 'Primary Criterion'}\n`;
    
    options.forEach((option, index) => {
      const isLast = index === options.length - 1;
      const prefix = isLast ? '└─' : '├─';
      tree += `│  ${prefix} ${option.name}\n`;
      
      if (!isLast) {
        tree += `│  │\n`;
      }
    });
    
    tree += `│\n`;
    tree += `└─ Final Decision: Evaluate based on project context\n`;
    tree += `\`\`\`\n`;
    
    return tree;
  }
}