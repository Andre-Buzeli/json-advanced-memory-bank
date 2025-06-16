/**
 * Advanced Memory Bank MCP Server v3.0.0
 * Simplified - Auto project detection, no backup system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { MemoryManager } from '../core/memory-manager.js';
import { SequentialThinking } from '../core/sequential-thinking.js';
import { WorkflowNavigator } from '../core/workflow-navigator.js';
import { CreativeAnalyzer } from '../core/creative-analyzer.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Advanced Memory Bank MCP Server class v3.0.0
 * Simplified with auto project detection and 11 essential tools
 */
export class AdvancedMemoryBankServer {
  private server: Server;
  private memoryManager: MemoryManager;
  private sequentialThinking: SequentialThinking;
  private workflowNavigator: WorkflowNavigator;
  private creativeAnalyzer: CreativeAnalyzer;
  private version: string = '3.0.5'; // fallback version

  /**
   * Read version from package.json
   */
  private async getVersion(): Promise<string> {
    try {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      return packageJson.version ?? this.version;
    } catch {
      return this.version; // fallback if reading fails
    }
  }

  constructor() {
    // Initialize version synchronously first, will be updated in initialize()
    this.version = '3.0.5';
    
    this.server = new Server(
      {
        name: '@andrebuzeli/advanced-json-memory-bank',
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.memoryManager = new MemoryManager();
    this.sequentialThinking = new SequentialThinking();
    this.workflowNavigator = new WorkflowNavigator();
    this.creativeAnalyzer = new CreativeAnalyzer();
    this.setupToolHandlers();
  }

  /**
   * Initialize the server with correct version
   */
  async initialize(): Promise<void> {
    this.version = await this.getVersion();
    // Update server version
    (this.server as any).serverInfo.version = this.version;
  }

  /**
   * Connect to the transport and handle initialization
   */
  async connect(transport: any) {
    return new Promise<void>((resolve, reject) => {
      try {
        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 60000);

        this.server.connect(transport)
          .then(() => {
            clearTimeout(connectionTimeout);
            process.stderr.write(`[@andrebuzeli/advanced-json-memory-bank] v${this.version} connected successfully\n`);
            resolve();
          })
          .catch((error) => {
            clearTimeout(connectionTimeout);
            process.stderr.write(`[advanced-memory-bank] Connection error: ${error}\n`);
            reject(error);
          });
      } catch (error) {
        process.stderr.write(`[advanced-memory-bank] Server initialization error: ${error}\n`);
        reject(error);
      }
    });
  }

  /**
   * Setup MCP tool handlers - v3.0.0 Simplified (11 tools)
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Core Memory Tools (5) - No projectName parameter needed
          {
            name: 'list_memories',
            description: 'List all memories with brief summaries (auto-detects current project)',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {},
              required: [],
            },
          } as Tool,
          {
            name: 'memory_bank_read',
            description: 'Read memory content from current project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'The name of the memory entry (with or without .md extension)',
                },
              },
              required: ['fileName'],
            },
          } as Tool,
          {
            name: 'memory_bank_write',
            description: 'Create new memory entry in current project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'The name of the memory entry (with or without .md extension)',
                },
                content: {
                  type: 'string',
                  description: 'The content of the memory entry',
                },
              },
              required: ['fileName', 'content'],
            },
          } as Tool,
          {
            name: 'memory_bank_update',
            description: 'Update existing memory entry in current project (supports batch update)',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'The name of the memory entry (for single update)',
                },
                content: {
                  type: 'string',
                  description: 'The content to add to the memory entry (for single update)',
                },
                operation: {
                  type: 'string',
                  enum: ['append', 'prepend', 'replace', 'insert_after', 'insert_before'],
                  description: 'How to add the content (default: append)',
                },
                insertAfter: {
                  type: 'string',
                  description: 'Text marker to insert after (used with insert_after operation)',
                },
                insertBefore: {
                  type: 'string',
                  description: 'Text marker to insert before (used with insert_before operation)',
                },
                removeText: {
                  type: 'string',
                  description: 'Optional: Text to remove from the memory entry',
                },
                replaceText: {
                  type: 'object',
                  properties: {
                    find: {
                      type: 'string',
                      description: 'Text to find',
                    },
                    replace: {
                      type: 'string',
                      description: 'Text to replace with',
                    },
                  },
                  required: ['find', 'replace'],
                  description: 'Optional: Replace specific text with new text',
                },
                updates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fileName: {
                        type: 'string',
                        description: 'The name of the memory entry',
                      },
                      content: {
                        type: 'string',
                        description: 'The content to add to the memory entry',
                      },
                      operation: {
                        type: 'string',
                        enum: ['append', 'prepend', 'replace', 'insert_after', 'insert_before'],
                        description: 'How to add the content (default: append)',
                      },
                      insertAfter: {
                        type: 'string',
                        description: 'Text marker to insert after',
                      },
                      insertBefore: {
                        type: 'string',
                        description: 'Text marker to insert before',
                      },
                      removeText: {
                        type: 'string',
                        description: 'Optional: Text to remove from the memory entry',
                      },
                      replaceText: {
                        type: 'object',
                        properties: {
                          find: {
                            type: 'string',
                            description: 'Text to find',
                          },
                          replace: {
                            type: 'string',
                            description: 'Text to replace with',
                          },
                        },
                        required: ['find', 'replace'],
                      },
                    },
                    required: ['fileName', 'content'],
                  },
                  description: 'Batch update: array of update operations',
                },
              },
            },
          } as Tool,
          {
            name: 'memory_bank_reset',
            description: 'Reset/clear all memory entries for current project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {},
              required: [],
            },
          } as Tool,

          // Intelligence Tools (3)
          {
            name: 'semantic_search',
            description: 'Search memories using natural language with built-in embeddings (current project)',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language search query',
                },
                limit: {
                  type: 'integer',
                  description: 'Maximum number of results (default: 5)',
                  minimum: 1,
                  maximum: 20,
                },
                similarityThreshold: {
                  type: 'number',
                  description: 'Minimum similarity score (0-1, default: 0.7)',
                  minimum: 0,
                  maximum: 1,
                },
              },
              required: ['query'],
            },
          } as Tool,
          {
            name: 'context_intelligence',
            description: 'AI-powered relevant memory suggestions for current project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                taskDescription: {
                  type: 'string',
                  description: 'Current task or question being worked on',
                },
                currentContext: {
                  type: 'string',
                  description: 'Additional context about current work (optional)',
                },
                maxSuggestions: {
                  type: 'integer',
                  description: 'Maximum suggestions to return (default: 5)',
                  minimum: 1,
                  maximum: 10,
                },
              },
              required: ['taskDescription'],
            },
          } as Tool,
          {
            name: 'memory_analyzer',
            description: 'Analyze dependencies, detect orphaned files, suggest cleanup for current project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                analysisType: {
                  type: 'string',
                  enum: ['dependencies', 'orphans', 'cleanup', 'all'],
                  description: 'Type of analysis to perform (default: all)',
                },
                includeMetrics: {
                  type: 'boolean',
                  description: 'Include detailed metrics in response (default: true)',
                },
              },
            },
          } as Tool,

          // Workflow Tools (3)
          {
            name: 'enhanced_thinking',
            description: 'Sequential thinking with visual workflow support',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                thought: {
                  type: 'string',
                  description: 'Your current thinking step with enhanced visual context',
                },
                thoughtNumber: {
                  type: 'integer',
                  description: 'Current thought number',
                  minimum: 1,
                },
                totalThoughts: {
                  type: 'integer',
                  description: 'Estimated total thoughts needed',
                  minimum: 1,
                },
                nextThoughtNeeded: {
                  type: 'boolean',
                  description: 'Whether another thought step is needed',
                },
                mode: {
                  type: 'string',
                  enum: ['VAN', 'PLAN', 'CREATIVE', 'IMPLEMENT', 'QA'],
                  description: 'Current development mode for enhanced workflow',
                },
                complexityLevel: {
                  type: 'integer',
                  description: 'Project complexity level (1-4)',
                  minimum: 1,
                  maximum: 4,
                },
                isRevision: {
                  type: 'boolean',
                  description: 'Whether this revises previous thinking',
                },
                revisesThought: {
                  type: 'integer',
                  description: 'Which thought is being reconsidered',
                  minimum: 1,
                },
                branchFromThought: {
                  type: 'integer',
                  description: 'Branching point thought number',
                  minimum: 1,
                },
                branchId: {
                  type: 'string',
                  description: 'Branch identifier',
                },
                needsMoreThoughts: {
                  type: 'boolean',
                  description: 'If more thoughts are needed',
                },
              },
              required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts'],
            },
          } as Tool,
          {
            name: 'workflow_navigator',
            description: 'Navigate through development workflow phases with visual guidance',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                currentMode: {
                  type: 'string',
                  enum: ['VAN', 'PLAN', 'CREATIVE', 'IMPLEMENT', 'QA'],
                  description: 'Current development mode',
                },
                targetMode: {
                  type: 'string',
                  enum: ['VAN', 'PLAN', 'CREATIVE', 'IMPLEMENT', 'QA'],
                  description: 'Target development mode',
                },
                complexityLevel: {
                  type: 'integer',
                  description: 'Project complexity level (optional, defaults to 2)',
                  minimum: 1,
                  maximum: 4,
                },
              },
              required: ['currentMode', 'targetMode'],
            },
          } as Tool,
          {
            name: 'creative_analyzer',
            description: 'Advanced creative analysis tool with trade-off matrices and decision trees',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'Component or feature being analyzed',
                },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Option name',
                      },
                      description: {
                        type: 'string',
                        description: 'Option description',
                      },
                      pros: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                        description: 'Advantages of this option',
                      },
                      cons: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                        description: 'Disadvantages of this option',
                      },
                    },
                    required: ['name', 'description'],
                  },
                  description: 'Array of options to analyze',
                },
                criteria: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'Evaluation criteria for comparison',
                },
              },
              required: ['component', 'options', 'criteria'],
            },
          } as Tool,
        ],
      };
    });

    // Tool call handlers (simplified - no projectName parameters)
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'list_memories':
            return this.listMemories();

          case 'memory_bank_read':
            return this.readMemoryBankFile(args?.fileName);

          case 'memory_bank_write':
            return this.writeMemoryBankFile(args?.fileName, args?.content);

          case 'memory_bank_update':
            return this.updateMemoryBankFile(args);

          case 'memory_bank_reset':
            return this.resetMemoryBank();

          case 'semantic_search':
            return this.semanticSearch(args?.query, args?.limit, args?.similarityThreshold);

          case 'context_intelligence':
            return this.contextIntelligence(args?.taskDescription, args?.currentContext, args?.maxSuggestions);

          case 'memory_analyzer':
            return this.memoryAnalyzer(args?.analysisType, args?.includeMetrics);

          case 'enhanced_thinking':
            return this.enhancedThinking(args);

          case 'workflow_navigator':
            return this.navigateWorkflow(args?.currentMode, args?.targetMode, args?.complexityLevel);

          case 'creative_analyzer':
            return this.analyzeCreatively(args?.component, args?.options, args?.criteria);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${request.params.name}: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  // Tool implementation methods (simplified - auto-detect project)
  private async listMemories() {
    try {
      const memories = await this.memoryManager.listMemoriesWithSummary();
      return {
        content: [
          {
            type: 'text',
            text: memories,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list memories: ${error}`);
    }
  }

  private async readMemoryBankFile(fileName: string) {
    if (!fileName) {
      throw new Error('fileName is required');
    }

    try {
      const content = await this.memoryManager.readMemory(fileName);
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to read memory file: ${error}`);
    }
  }

  private async writeMemoryBankFile(fileName: string, content: string) {
    if (!fileName || !content) {
      throw new Error('fileName and content are required');
    }

    try {
      await this.memoryManager.storeMemory(fileName, content);
      return {
        content: [
          {
            type: 'text',
            text: `Memory '${fileName}' created successfully in current project`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to write memory file: ${error}`);
    }
  }

  private async updateMemoryBankFile(args: any) {
    try {
      const result = await this.memoryManager.updateMemory(args);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update memory: ${error}`);
    }
  }

  private async resetMemoryBank() {
    try {
      await this.memoryManager.resetProject();
      return {
        content: [
          {
            type: 'text',
            text: 'Project memory reset successfully',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to reset project: ${error}`);
    }
  }

  private async semanticSearch(query: string, limit?: number, similarityThreshold?: number) {
    if (!query) {
      throw new Error('query is required');
    }

    try {
      const results = await this.memoryManager.semanticSearch(query, {
        limit: limit || 5,
        similarityThreshold: similarityThreshold || 0.7
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to perform semantic search: ${error}`);
    }
  }

  private async contextIntelligence(taskDescription: string, currentContext?: string, maxSuggestions?: number) {
    if (!taskDescription) {
      throw new Error('taskDescription is required');
    }

    try {
      const suggestions = await this.memoryManager.getContextIntelligence(
        taskDescription,
        currentContext,
        maxSuggestions || 5
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(suggestions, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get context intelligence: ${error}`);
    }
  }

  private async memoryAnalyzer(analysisType?: string, includeMetrics?: boolean) {
    try {
      const analysis = await this.memoryManager.analyzeMemoryBank(
        analysisType || 'all',
        includeMetrics !== false
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze memory: ${error}`);
    }
  }

  private async enhancedThinking(args: any) {
    try {
      const result = await this.sequentialThinking.processThought(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to process thought: ${error}`);
    }
  }

  private async navigateWorkflow(currentMode: string, targetMode: string, complexityLevel?: number) {
    if (!currentMode || !targetMode) {
      throw new Error('currentMode and targetMode are required');
    }

    try {
      const navigation = await this.workflowNavigator.navigate({
        currentMode: currentMode as any,
        targetMode: targetMode as any,
        projectName: this.memoryManager.getCurrentProjectName(),
        complexityLevel: complexityLevel || 2
      });
      return {
        content: [
          {
            type: 'text',
            text: navigation,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to navigate workflow: ${error}`);
    }
  }

  private async analyzeCreatively(component: string, options: any[], criteria: string[]) {
    if (!component || !options || !criteria) {
      throw new Error('component, options, and criteria are required');
    }

    try {
      const analysis = await this.creativeAnalyzer.analyze({
        component,
        options,
        criteria,
        projectName: this.memoryManager.getCurrentProjectName()
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to perform creative analysis: ${error}`);
    }
  }
}
