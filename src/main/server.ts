/**
 * Advanced Memory Bank MCP Server
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

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Advanced Memory Bank MCP Server class
 */
export class AdvancedMemoryBankServer {
  private server: Server;
  private memoryManager: MemoryManager;
  private sequentialThinking: SequentialThinking;
  private workflowNavigator: WorkflowNavigator;
  private creativeAnalyzer: CreativeAnalyzer;

  constructor() {
    this.server = new Server(
      {
        name: '@andrebuzeli/advanced-json-memory-bank',
        version: '1.0.0',
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
   * Connect to the transport and handle initialization
   * @param transport - Transport to connect to
   */
  async connect(transport: any) {
    return new Promise<void>((resolve, reject) => {
      try {
        // Set timeout for connection
        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 60000); // 60 seconds

        // Connect with transport
        this.server.connect(transport)
          .then(() => {
            clearTimeout(connectionTimeout);
            process.stderr.write(`[@andrebuzeli/advanced-json-memory-bank] Server connected successfully\n`);
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
   * Setup MCP tool handlers
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_projects',
            description: 'List all projects in the enhanced memory bank',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'backup_memory',
            description: 'Create a manual backup of all memory bank projects',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                customBackupDir: {
                  type: 'string',
                  description: 'Custom directory to store the backup (optional)',
                },
              },
            },
          },
          {
            name: 'memory_bank_read',
            description: 'Read a memory entry from the memory bank for a specific project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'The name of the project (uses auto-detected IDE folder name if not provided)',
                },
                fileName: {
                  type: 'string',
                  description: 'The name of the memory entry (with or without .md extension)',
                },
              },
              required: ['fileName'],
            },
          },
          {
            name: 'memory_bank_write',
            description: 'Create a new memory entry in the memory bank for a specific project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'The name of the project (uses auto-detected IDE folder name if not provided)',
                },
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
          },
          {
            name: 'memory_bank_update',
            description: 'Update an existing memory entry in the project memory bank (supports batch update and advanced operations)',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'The name of the project (uses auto-detected IDE folder name if not provided)',
                },
                fileName: {
                  type: 'string',
                  description: 'The name of the memory entry (for single update)',
                },
                content: {
                  type: 'string',
                  description: 'The content to add to the memory entry (for single update)',
                },
                removeText: {
                  type: 'string',
                  description: 'Optional: Text to remove from the memory entry (for single update)',
                },
                replaceText: {
                  type: 'object',
                  description: 'Optional: Replace specific text with new text',
                  properties: {
                    find: { type: 'string', description: 'Text to find' },
                    replace: { type: 'string', description: 'Text to replace with' }
                  },
                  required: ['find', 'replace']
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
                updates: {
                  type: 'array',
                  description: 'Batch update: array of update operations',
                  items: {
                    type: 'object',
                    properties: {
                      fileName: { 
                        type: 'string', 
                        description: 'The name of the memory entry' 
                      },
                      content: { 
                        type: 'string', 
                        description: 'The content to add to the memory entry' 
                      },
                      removeText: { 
                        type: 'string', 
                        description: 'Optional: Text to remove from the memory entry' 
                      },
                      replaceText: {
                        type: 'object',
                        description: 'Optional: Replace specific text with new text',
                        properties: {
                          find: { type: 'string' },
                          replace: { type: 'string' }
                        },
                        required: ['find', 'replace']
                      },
                      operation: {
                        type: 'string',
                        enum: ['append', 'prepend', 'replace', 'insert_after', 'insert_before'],
                        description: 'How to add the content (default: append)',
                      },
                      insertAfter: { type: 'string' },
                      insertBefore: { type: 'string' }
                    },
                    required: ['fileName', 'content']
                  }
                }
              },
              required: ['projectName']
            },
          },
          {
            name: 'memory_bank_reset',
            description: 'Reset/clear all memory entries for a project by deleting the JSON file',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'The name of the project to reset',
                },
                createBackup: {
                  type: 'boolean',
                  description: 'Whether to create a backup before resetting (default: true)',
                },
              },
              required: ['projectName'],
            },
          },
          {
            name: 'enhanced_thinking',
            description: 'Enhanced sequential thinking tool with visual workflow support',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                thought: {
                  type: 'string',
                  description: 'Your current thinking step with enhanced visual context',
                },
                nextThoughtNeeded: {
                  type: 'boolean',
                  description: 'Whether another thought step is needed',
                },
                thoughtNumber: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Current thought number',
                },
                totalThoughts: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Estimated total thoughts needed',
                },
                mode: {
                  type: 'string',
                  enum: ['VAN', 'PLAN', 'CREATIVE', 'IMPLEMENT', 'QA'],
                  description: 'Current development mode for enhanced workflow',
                },
                complexityLevel: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 4,
                  description: 'Project complexity level (1-4)',
                },
                isRevision: {
                  type: 'boolean',
                  description: 'Whether this revises previous thinking',
                },
                revisesThought: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Which thought is being reconsidered',
                },
                branchFromThought: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Branching point thought number',
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
          },
          {
            name: 'workflow_navigator',
            description: 'Navigate through enhanced development workflow with visual guidance',
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
                  minimum: 1,
                  maximum: 4,
                  description: 'Project complexity level (optional, defaults to 2)',
                },
                projectName: {
                  type: 'string',
                  description: 'Name of the project',
                },
              },
              required: ['currentMode', 'targetMode', 'projectName'],
            },
          },
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
                        items: { type: 'string' },
                        description: 'Advantages of this option',
                      },
                      cons: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Disadvantages of this option',
                      },
                    },
                    required: ['name', 'description'],
                  },
                  description: 'Array of options to analyze',
                },
                criteria: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Evaluation criteria for comparison',
                },
                projectName: {
                  type: 'string',
                  description: 'Name of the project',
                },
              },
              required: ['component', 'options', 'criteria', 'projectName'],
            },
          },
          {
            name: 'context_intelligence',
            description: 'AI-powered context suggestions for relevant memory bank files based on current task',
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
                projectName: {
                  type: 'string',
                  description: 'Target project name',
                },
                maxSuggestions: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 10,
                  description: 'Maximum suggestions to return (default: 5)',
                },
              },
              required: ['taskDescription', 'projectName'],
            },
          },
          {
            name: 'memory_analyzer',
            description: 'Analyze memory bank dependencies, detect orphaned files, suggest cleanup',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Target project name',
                },
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
              required: ['projectName'],
            },
          },

          {
            name: 'optimize_json_memory',
            description: 'Optimize JSON memory file for a project by cleaning up invalid entries and reorganizing data',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Name of the project to optimize (leave empty to optimize all projects)',
                },
                options: {
                  type: 'object',
                  description: 'Optimization options',
                  properties: {
                    removeEmpty: {
                      type: 'boolean',
                      description: 'Remove empty or nearly empty entries',
                    },
                    deduplicate: {
                      type: 'boolean',
                      description: 'Find and merge duplicate entries',
                    },
                    createBackup: {
                      type: 'boolean',
                      description: 'Create a backup before optimizing (default: true)',
                    },
                  }
                }
              },
            },
          },
          {
            name: 'semantic_search',
            description: 'Search memory bank using natural language queries and semantic understanding',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'Project name to search within',
                },
                query: {
                  type: 'string',
                  description: 'Natural language search query',
                },
                limit: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 20,
                  description: 'Maximum number of results (default: 5)',
                },
                similarityThreshold: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                  description: 'Minimum similarity score (0-1, default: 0.7)',
                },
              },
              required: ['projectName', 'query'],
            },
          },
          {
            name: 'list_memories',
            description: 'List all memory entries with brief summaries for a specific project',
            inputSchema: {
              $schema: 'https://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: 'The name of the project (uses auto-detected IDE folder name if not provided)',
                },
              },
              required: ['projectName'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!args) {
          throw new Error(`No arguments provided for tool: ${name}`);
        }

        switch (name) {
          case 'list_projects':
            return await this.listProjects();
            
          case 'backup_memory':
            return await this.backupMemory(args.customBackupDir as string | undefined);

          case 'memory_bank_read':
            return await this.readMemoryBankFile(
              args.projectName as string | undefined,
              args.fileName as string
            );

          case 'memory_bank_write':
            return await this.writeMemoryBankFile(
              args.projectName as string | undefined,
              args.fileName as string,
              args.content as string
            );

          case 'memory_bank_reset':
            return await this.resetMemoryBank(
              args.projectName as string,
              args.createBackup as boolean
            );

          case 'memory_bank_update':
            // Validation for memory_bank_update
            if (!args.projectName) {
              throw new Error('projectName is required for memory_bank_update');
            }
            
            // Check if it's a batch update or single update
            if (args.updates && Array.isArray(args.updates)) {
              // Batch update
              if (args.updates.length === 0) {
                throw new Error('updates array cannot be empty');
              }
              for (const update of args.updates) {
                if (!update.fileName || !update.content) {
                  throw new Error('Each update must have fileName and content');
                }
              }
              return await this.batchUpdateMemoryBankFiles(
                args.projectName as string,
                args.updates as Array<{
                  fileName: string;
                  content: string;
                  removeText?: string;
                  replaceText?: { find: string; replace: string };
                  operation?: 'append' | 'prepend' | 'replace' | 'insert_after' | 'insert_before';
                  insertAfter?: string;
                  insertBefore?: string;
                }>
              );
            } else if (args.fileName && args.content) {
              // Single update
              const options = {
                removeText: args.removeText as string | undefined,
                replaceText: args.replaceText as { find: string; replace: string } | undefined,
                operation: (args.operation as 'append' | 'prepend' | 'replace' | 'insert_after' | 'insert_before') || 'append',
                insertAfter: args.insertAfter as string | undefined,
                insertBefore: args.insertBefore as string | undefined
              };
              return await this.updateMemoryBankFile(
                args.projectName as string,
                args.fileName as string,
                args.content as string,
                options
              );
            } else {
              throw new Error('Either provide updates array for batch update or fileName+content for single update');
            }

          case 'enhanced_thinking':
            return await this.enhancedThinking(args);

          case 'workflow_navigator':
            return await this.processWorkflowNavigator(args);

          case 'creative_analyzer':
            return await this.processCreativeAnalyzer(args);

          case 'context_intelligence':
            return await this.contextIntelligence(args);

          case 'memory_analyzer':
            return await this.memoryAnalyzer(args);
            
          case 'semantic_search':
            return await this.semanticSearch(args);
            
          case 'optimize_json_memory':
            return await this.optimizeJsonMemory(args);

          case 'list_memories':
            return await this.listMemories(args.projectName as string);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * List all projects in the memory bank
   * @returns Tool response
   */
  private async listProjects() {
    const projects = await this.memoryManager.listProjects();
    
    return {
      content: [
        {
          type: 'text',
          text: projects.join('\n'),
        },
      ],
    };
  }

  /**
   * Create a manual backup of all projects
   * @param customBackupDir - Optional custom backup directory
   * @param force - Optional flag to bypass cooldown
   * @returns Tool response
   */
  private async backupMemory(customBackupDir?: string, force?: boolean) {
    const result = await this.memoryManager.createManualBackup(customBackupDir, force);
    
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Read a memory entry from the memory bank
   * @param projectName - Project name (optional, uses auto-detected if not provided)
   * @param fileName - Memory entry name (with or without .md extension)
   * @returns Tool response
   */
  private async readMemoryBankFile(projectName: string | undefined, fileName: string) {
    const effectiveProjectName = projectName || this.memoryManager.getCurrentProjectName();
    const content = await this.memoryManager.readMemory(effectiveProjectName, fileName);
    
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  /**
   * Write a new memory entry to the memory bank
   * @param projectName - Project name (optional, uses auto-detected if not provided)
   * @param fileName - Memory entry name (with or without .md extension)
   * @param content - Memory entry content
   * @returns Tool response
   */
  private async writeMemoryBankFile(projectName: string | undefined, fileName: string, content: string) {
    const effectiveProjectName = projectName || this.memoryManager.getCurrentProjectName();
    const result = await this.memoryManager.writeMemory(effectiveProjectName, fileName, content);
    
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Reset/clear all memory entries for a project
   * @param projectName - Project name
   * @param createBackup - Whether to create a backup before resetting
   * @returns Tool response
   */
  private async resetMemoryBank(projectName: string, createBackup: boolean = true) {
    const result = await this.memoryManager.resetProjectMemory(projectName, createBackup);
    
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Update an existing memory entry in the memory bank
   * @param projectName - Project name
   * @param fileName - Memory entry name (with or without .md extension)
   * @param content - Content to add to the memory entry
   * @param options - Update options
   * @returns Tool response
   */
  private async updateMemoryBankFile(
    projectName: string, 
    fileName: string, 
    content: string, 
    options: {
      removeText?: string;
      replaceText?: { find: string; replace: string };
      operation?: 'append' | 'prepend' | 'replace' | 'insert_after' | 'insert_before';
      insertAfter?: string;
      insertBefore?: string;
    }
  ) {
    const result = await this.memoryManager.updateMemory(projectName, fileName, content, options);
    
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Get memory bank summary for a project
   * @param projectName - Project name
   * @param detailed - Whether to include detailed information
   * @returns Tool response
   */

  /**
   * Batch update memory bank files
   * @param projectName - Project name
   * @param updates - Array of updates
   * @returns Tool response
   */
  private async batchUpdateMemoryBankFiles(
    projectName: string, 
    updates: Array<{
      fileName: string;
      content: string;
      removeText?: string;
      replaceText?: { find: string; replace: string };
      operation?: 'append' | 'prepend' | 'replace' | 'insert_after' | 'insert_before';
      insertAfter?: string;
      insertBefore?: string;
    }>
  ) {
    const results = await this.memoryManager.batchUpdateMemory(projectName, updates);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  };

  /**
   * Optimize JSON memory file for a project
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async optimizeJsonMemory(args: any) {
    try {
      const options = {
        removeEmpty: args.options?.removeEmpty === true,
        deduplicate: args.options?.deduplicate === true,
        createBackup: args.options?.createBackup !== false, // Default is true
      };
      
      let result: string;
      
      if (args.projectName) {
        // Optimize a specific project
        result = await this.memoryManager.optimizeProjectJson(args.projectName, options);
      } else {
        // Optimize all projects
        result = await this.memoryManager.optimizeAllProjectsJson(options);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error optimizing JSON memory: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Enhanced thinking tool
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async enhancedThinking(args: any) {
    const result = await this.sequentialThinking.processThought(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * Workflow navigator tool
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async processWorkflowNavigator(args: any) {
    const result = await this.workflowNavigator.navigate(args);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Creative analyzer tool
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async processCreativeAnalyzer(args: any) {
    const result = await this.creativeAnalyzer.analyze(args);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Context intelligence tool
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async contextIntelligence(args: any) {
    const { taskDescription, currentContext, projectName, maxSuggestions } = args;
    const result = await this.memoryManager.getContextSuggestions(
      projectName,
      taskDescription,
      currentContext || '',
      maxSuggestions || 5
    );
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Memory analyzer tool
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async memoryAnalyzer(args: any) {
    const { projectName, analysisType, includeMetrics } = args;
    const result = await this.memoryManager.analyzeMemory(
      projectName,
      analysisType || 'all',
      includeMetrics !== false
    );
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  /**
   * Semantic search tool
   * @param args - Tool arguments
   * @returns Tool response
   */
  private async semanticSearch(args: any) {
    const { projectName, query, limit, similarityThreshold } = args;
    const searchParams = {
      project: projectName,
      query: query,
      limit: limit || 5,
      similarityThreshold: similarityThreshold || 0.7
    };
    const result = await this.memoryManager.searchMemories(searchParams);
    
    // Format result as text
    let resultText = `# 🔍 Semantic Search Results\n\n`;
    resultText += `**Query:** "${query}"\n`;
    resultText += `**Project:** ${projectName}\n`;
    resultText += `**Total Matches:** ${result.totalMatches}\n\n`;
    
    if (result.memories.length > 0) {
      resultText += `## Results:\n\n`;
      for (let i = 0; i < result.memories.length; i++) {
        const memory = result.memories[i];
        const score = result.scores ? result.scores[i] : 0.5;
        resultText += `### ${i + 1}. ${memory.title} (Score: ${Math.round(score * 10)}/10)\n\n`;
        // Show first 200 characters of content
        const preview = memory.content.slice(0, 200);
        resultText += `${preview}${memory.content.length > 200 ? '...' : ''}\n\n---\n\n`;
      }
    } else {
      resultText += `No results found for query "${query}"\n`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  }

  /**
   * List all memory entry names with brief summaries for a project
   * @param projectName - Project name
   * @returns Tool response with memory names and brief summaries
   */
  private async listMemories(projectName: string) {
    const result = await this.memoryManager.listMemoriesWithSummary(projectName);
    
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }
}