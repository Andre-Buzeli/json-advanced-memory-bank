/**
 * Universal Configuration System for Content Analysis
 * Provides configurable patterns, keywords, and detection rules
 * that can be customized for any domain, language, or project type
 */

export interface ContentAnalysisConfig {
  /**
   * Language and localization settings
   */
  language: {
    /**
     * Primary language code (ISO 639-1)
     */
    primary: string;
    
    /**
     * Secondary languages supported
     */
    secondary: string[];
    
    /**
     * Stop words by language
     */
    stopWords: Record<string, string[]>;
    
    /**
     * Language detection patterns
     */
    detectionPatterns: Record<string, string[]>;
  };

  /**
   * Category detection patterns - completely configurable
   */
  categoryPatterns: Record<string, {
    /**
     * Keywords that indicate this category
     */
    keywords: string[];
    
    /**
     * Regular expressions for pattern matching
     */
    patterns: string[];
    
    /**
     * Weight multiplier for this category
     */
    weight: number;
    
    /**
     * Minimum confidence threshold
     */
    minConfidence: number;
  }>;

  /**
   * Importance level detection patterns
   */
  importancePatterns: {
    critical: {
      keywords: string[];
      patterns: string[];
      weight: number;
    };
    high: {
      keywords: string[];
      patterns: string[];
      weight: number;
    };
    medium: {
      keywords: string[];
      patterns: string[];
      weight: number;
    };
    low: {
      keywords: string[];
      patterns: string[];
      weight: number;
    };
  };

  /**
   * Action item extraction patterns
   */
  actionItemPatterns: {
    /**
     * Checkbox patterns (unchecked items)
     */
    checkboxes: string[];
    
    /**
     * Bullet point patterns
     */
    bullets: string[];
    
    /**
     * TODO/FIXME patterns
     */
    todos: string[];
    
    /**
     * Custom action indicators
     */
    custom: string[];
  };

  /**
   * Progress indicator patterns
   */
  progressPatterns: {
    /**
     * Completed status indicators
     */
    completed: string[];
    
    /**
     * In-progress status indicators
     */
    inProgress: string[];
    
    /**
     * Pending status indicators
     */
    pending: string[];
    
    /**
     * Blocked status indicators
     */
    blocked: string[];
    
    /**
     * Percentage extraction pattern
     */
    percentagePattern: string;
  };

  /**
   * Quality assessment thresholds
   */
  qualityThresholds: {
    /**
     * Minimum content length for meaningful analysis
     */
    minContentLength: number;
    
    /**
     * Optimal sentence length range
     */
    sentenceLengthRange: {
      min: number;
      max: number;
    };
    
    /**
     * Structure indicators and their weights
     */
    structureIndicators: {
      headers: number;
      lists: number;
      codeBlocks: number;
      links: number;
    };
  };

  /**
   * Reading time calculation settings
   */
  readingTime: {
    /**
     * Words per minute for different content types
     */
    wordsPerMinute: {
      prose: number;
      technical: number;
      code: number;
    };
    
    /**
     * Adjustment factors
     */
    adjustments: {
      complexity: number;
      codeRatio: number;
    };
  };

  /**
   * Relationship detection patterns
   */
  relationshipPatterns: {
    /**
     * File/document reference patterns
     */
    fileReferences: string[];
    
    /**
     * Cross-reference indicators
     */
    crossReferences: string[];
    
    /**
     * Dependency indicators
     */
    dependencies: string[];
    
    /**
     * Mention patterns
     */
    mentions: string[];
  };

  /**
   * Extensibility hooks for custom patterns
   */
  extensions: {
    /**
     * Custom category definitions
     */
    customCategories?: Record<string, {
      keywords: string[];
      patterns: string[];
      weight: number;
    }>;
    
    /**
     * Domain-specific patterns
     */
    domainPatterns?: Record<string, any>;
    
    /**
     * User-defined rules
     */
    userRules?: Array<{
      name: string;
      pattern: string;
      action: string;
      weight: number;
    }>;
  };
}

/**
 * Default configuration factory for different domains
 */
export class ConfigurationFactory {
  
  /**
   * Create a universal default configuration
   */
  static createUniversalConfig(): ContentAnalysisConfig {
    return {
      language: {
        primary: 'en',
        secondary: ['es', 'fr', 'de', 'pt', 'zh', 'ja', 'ru'],
        stopWords: {
          'en': ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
          'pt': ['que', 'para', 'com', 'uma', 'mais', 'ser', 'ter', 'este', 'essa', 'como'],
          'es': ['que', 'para', 'con', 'una', 'más', 'ser', 'tener', 'este', 'esa', 'como'],
          'fr': ['que', 'pour', 'avec', 'une', 'plus', 'être', 'avoir', 'ce', 'cette', 'comment'],
          'de': ['dass', 'für', 'mit', 'eine', 'mehr', 'sein', 'haben', 'dieser', 'diese', 'wie']
        },
        detectionPatterns: {
          'en': ['the', 'and', 'this', 'that', 'with', 'have', 'will', 'would', 'could', 'should'],
          'pt': ['que', 'para', 'este', 'essa', 'com', 'ter', 'será', 'seria', 'pode', 'deve'],
          'es': ['que', 'para', 'este', 'esa', 'con', 'tener', 'será', 'sería', 'puede', 'debe'],
          'fr': ['que', 'pour', 'ce', 'cette', 'avec', 'avoir', 'sera', 'serait', 'peut', 'doit'],
          'de': ['dass', 'für', 'dieser', 'diese', 'mit', 'haben', 'wird', 'würde', 'kann', 'soll']
        }
      },

      categoryPatterns: {
        'research': {
          keywords: ['research', 'study', 'analysis', 'investigation', 'explore', 'examine', 'survey', 'review', 'pesquisa', 'estudo', 'análise', 'investigação'],
          patterns: [
            '\\b(research|study|analysis|investigation|explore|examine)\\b',
            '\\b(pesquisa|estudo|análise|investigação|explorar|examinar)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        },
        'decision': {
          keywords: ['decision', 'choose', 'option', 'recommendation', 'best', 'comparison', 'vs', 'versus', 'decisão', 'escolher', 'opção', 'recomendação'],
          patterns: [
            '\\b(decision|choose|option|recommendation|comparison|vs|versus)\\b',
            '\\b(decisão|escolher|opção|recomendação|comparação)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        },
        'implementation': {
          keywords: ['implementation', 'develop', 'create', 'build', 'construct', 'make', 'code', 'implementação', 'desenvolver', 'criar', 'construir'],
          patterns: [
            '\\b(implementation|develop|create|build|construct|code)\\b',
            '\\b(implementação|desenvolver|criar|construir|código)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        },
        'status': {
          keywords: ['status', 'progress', 'update', 'current', 'state', 'situation', 'progresso', 'atualização', 'atual', 'estado', 'situação'],
          patterns: [
            '\\b(status|progress|update|current|state)\\b',
            '\\b(progresso|atualização|atual|estado|situação)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        },
        'guide': {
          keywords: ['guide', 'how', 'tutorial', 'instruction', 'manual', 'step', 'guia', 'como', 'tutorial', 'instrução', 'manual', 'passo'],
          patterns: [
            '\\b(guide|tutorial|instruction|manual|how\\s+to|step\\s+by\\s+step)\\b',
            '\\b(guia|tutorial|instrução|manual|como|passo\\s+a\\s+passo)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        },
        'issue': {
          keywords: ['problem', 'error', 'bug', 'issue', 'failure', 'trouble', 'fix', 'problema', 'erro', 'falha', 'questão', 'solução'],
          patterns: [
            '\\b(problem|error|bug|issue|failure|trouble|fix)\\b',
            '\\b(problema|erro|bug|falha|questão|solução)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        },
        'idea': {
          keywords: ['idea', 'concept', 'brainstorm', 'inspiration', 'creative', 'innovation', 'ideia', 'conceito', 'inspiração', 'criativo', 'inovação'],
          patterns: [
            '\\b(idea|concept|brainstorm|inspiration|creative|innovation)\\b',
            '\\b(ideia|conceito|inspiração|criativo|inovação)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        },
        'meeting': {
          keywords: ['meeting', 'discussion', 'call', 'conference', 'agenda', 'minutes', 'reunião', 'discussão', 'chamada', 'conferência', 'agenda', 'ata'],
          patterns: [
            '\\b(meeting|discussion|call|conference|agenda|minutes)\\b',
            '\\b(reunião|discussão|chamada|conferência|agenda|ata)\\b'
          ],
          weight: 1.0,
          minConfidence: 0.3
        }
      },

      importancePatterns: {
        critical: {
          keywords: ['critical', 'urgent', 'emergency', 'crucial', 'vital', 'essential', 'crítico', 'urgente', 'emergência', 'crucial', 'vital', 'essencial'],
          patterns: ['\\b(critical|urgent|emergency|crucial|vital|essential)\\b', '\\b(crítico|urgente|emergência|crucial|vital|essencial)\\b'],
          weight: 1.0
        },
        high: {
          keywords: ['important', 'priority', 'significant', 'major', 'key', 'importante', 'prioridade', 'significativo', 'principal', 'chave'],
          patterns: ['\\b(important|priority|significant|major|key)\\b', '\\b(importante|prioridade|significativo|principal|chave)\\b'],
          weight: 0.8
        },
        medium: {
          keywords: ['moderate', 'normal', 'standard', 'regular', 'moderado', 'normal', 'padrão', 'regular'],
          patterns: ['\\b(moderate|normal|standard|regular)\\b', '\\b(moderado|normal|padrão|regular)\\b'],
          weight: 0.5
        },
        low: {
          keywords: ['optional', 'minor', 'nice', 'future', 'maybe', 'opcional', 'menor', 'futuro', 'talvez'],
          patterns: ['\\b(optional|minor|nice\\s+to\\s+have|future|maybe)\\b', '\\b(opcional|menor|futuro|talvez)\\b'],
          weight: 0.3
        }
      },

      actionItemPatterns: {
        checkboxes: [
          '\\[\\s*\\]\\s*(.+)',
          '\\[\\s*-\\s*\\]\\s*(.+)',
          '☐\\s*(.+)'
        ],
        bullets: [
          '^\\s*[-*+]\\s+(.+)',
          '^\\s*\\d+\\.\\s+(.+)',
          '^\\s*[a-zA-Z]\\)\\s+(.+)'
        ],
        todos: [
          '(?:TODO|FIXME|HACK|NOTE|XXX):\\s*(.+)',
          '(?:TODO|FIXME|HACK|NOTA|XXX):\\s*(.+)'
        ],
        custom: [
          '(?:action|next|follow\\s+up):\\s*(.+)',
          '(?:ação|próximo|acompanhar):\\s*(.+)'
        ]
      },

      progressPatterns: {
        completed: [
          'completed?', 'finished?', 'done', 'ready', 'complete',
          'concluído', 'terminado', 'feito', 'pronto', 'completo'
        ],
        inProgress: [
          'in\\s+progress', 'working', 'developing', 'ongoing', 'current',
          'em\\s+progresso', 'trabalhando', 'desenvolvendo', 'em\\s+andamento', 'atual'
        ],
        pending: [
          'pending', 'todo', 'planned', 'upcoming', 'next',
          'pendente', 'planejado', 'próximo', 'futuro'
        ],
        blocked: [
          'blocked?', 'stuck', 'waiting', 'on\\s+hold', 'paused',
          'bloqueado', 'travado', 'esperando', 'pausado'
        ],
        percentagePattern: '\\b(\\d{1,3})%\\b'
      },

      qualityThresholds: {
        minContentLength: 50,
        sentenceLengthRange: {
          min: 5,
          max: 30
        },
        structureIndicators: {
          headers: 0.3,
          lists: 0.2,
          codeBlocks: 0.2,
          links: 0.1
        }
      },

      readingTime: {
        wordsPerMinute: {
          prose: 200,
          technical: 150,
          code: 100
        },
        adjustments: {
          complexity: 0.8,
          codeRatio: 0.6
        }
      },

      relationshipPatterns: {
        fileReferences: [
          '\\b[\\w\\-_.]+\\.(md|txt|doc|pdf|json|xml|csv)\\b',
          '\\b[\\w\\-_.]+\\.(js|ts|py|java|cpp|cs|php|rb)\\b'
        ],
        crossReferences: [
          '(?:see|check|refer\\s+to|view|look\\s+at)\\s+[\\w\\s\\-_.]+',
          '(?:ver|verificar|consultar|visualizar|olhar)\\s+[\\w\\s\\-_.]+',
          '\\[([^\\]]+)\\]\\([^\\)]+\\)' // Markdown links
        ],
        dependencies: [
          '(?:depends?\\s+on|requires?|needs?|based\\s+on)\\s+[\\w\\s\\-_.]+',
          '(?:depende|requer|precisa|baseado\\s+em)\\s+[\\w\\s\\-_.]+',
          '(?:prerequisite|dependency):\\s*[\\w\\s\\-_.]+'
        ],
        mentions: [
          '@[\\w\\-_.]+',
          '#[\\w\\-_.]+',
          '\\b[A-Z][\\w\\-_.]*[A-Z][\\w\\-_.]*\\b' // CamelCase
        ]
      },

      extensions: {
        customCategories: {},
        domainPatterns: {},
        userRules: []
      }
    };
  }

  /**
   * Create configuration for software development projects
   */
  static createSoftwareDevelopmentConfig(): ContentAnalysisConfig {
    const base = this.createUniversalConfig();
    
    // Add software-specific patterns
    base.categoryPatterns['architecture'] = {
      keywords: ['architecture', 'design', 'pattern', 'framework', 'structure', 'arquitetura', 'padrão', 'estrutura'],
      patterns: ['\\b(architecture|design\\s+pattern|framework|structure)\\b', '\\b(arquitetura|padrão|estrutura)\\b'],
      weight: 1.0,
      minConfidence: 0.3
    };

    base.categoryPatterns['testing'] = {
      keywords: ['test', 'testing', 'unit', 'integration', 'qa', 'quality', 'teste', 'testagem', 'qualidade'],
      patterns: ['\\b(test|testing|unit|integration|qa|quality)\\b', '\\b(teste|testagem|qualidade)\\b'],
      weight: 1.0,
      minConfidence: 0.3
    };

    return base;
  }

  /**
   * Create configuration for business/management projects
   */
  static createBusinessConfig(): ContentAnalysisConfig {
    const base = this.createUniversalConfig();
    
    // Add business-specific patterns
    base.categoryPatterns['strategy'] = {
      keywords: ['strategy', 'plan', 'goal', 'objective', 'target', 'estratégia', 'plano', 'meta', 'objetivo', 'alvo'],
      patterns: ['\\b(strategy|plan|goal|objective|target)\\b', '\\b(estratégia|plano|meta|objetivo|alvo)\\b'],
      weight: 1.0,
      minConfidence: 0.3
    };

    base.categoryPatterns['finance'] = {
      keywords: ['budget', 'cost', 'revenue', 'finance', 'money', 'orçamento', 'custo', 'receita', 'financeiro', 'dinheiro'],
      patterns: ['\\b(budget|cost|revenue|finance|money)\\b', '\\b(orçamento|custo|receita|financeiro|dinheiro)\\b'],
      weight: 1.0,
      minConfidence: 0.3
    };

    return base;
  }

  /**
   * Merge user configuration with default configuration
   */
  static mergeWithUserConfig(baseConfig: ContentAnalysisConfig, userConfig: Partial<ContentAnalysisConfig>): ContentAnalysisConfig {
    // Deep merge configurations
    return this.deepMerge(baseConfig, userConfig);
  }

  /**
   * Deep merge two objects
   */
  private static deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}
