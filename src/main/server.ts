/**
 * Advanced Memory Bank MCP Server v4.0.0
 * Dynamic project detection with streamlined architecture
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolRequest,
  CallToolResult,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { MemoryManager } from '../core/memory-manager.js';
import { SequentialThinking } from '../core/sequential-thinking.js';
import { WorkflowNavigator } from '../core/workflow-navigator.js';
import { CreativeAnalyzer } from '../core/creative-analyzer.js';

export class AdvancedMemoryBankServer {
  private readonly server: Server;
  private readonly memoryManager: MemoryManager;
  private readonly sequentialThinking: SequentialThinking;
  private readonly workflowNavigator: WorkflowNavigator;
  private readonly creativeAnalyzer: CreativeAnalyzer;

  constructor() {
    this.server = new Server(
      {
        name: 'advanced-memory-bank',
        version: '4.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize all managers
    this.memoryManager = new MemoryManager();
    this.sequentialThinking = new SequentialThinking(this.memoryManager);
    this.workflowNavigator = new WorkflowNavigator(this.memoryManager);
    this.creativeAnalyzer = new CreativeAnalyzer(this.memoryManager);

    this.setupToolHandlers();
  }

  async initialize(): Promise<void> {
    console.log('[AdvancedMemoryBank] Server initialized successfully');
  }

  async connect(transport: any): Promise<void> {
    await this.server.connect(transport);
    console.log('[AdvancedMemoryBank] Connected via transport');
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      return await this.handleToolCall(request);
    });
  }

  private getAvailableTools(): Tool[] {
    return [
      // Memory Management Tools
      {
        name: 'store-memory',
        description: 'Store new memory with automatic project detection',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Memory content to store' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
            importance: { type: 'number', minimum: 1, maximum: 10, description: 'Importance level (1-10)' },
          },
          required: ['content'],
        },
      },
      {
        name: 'search-memories',
        description: 'Search memories by content or tags',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            limit: { type: 'number', minimum: 1, maximum: 100, description: 'Number of results' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get-memory',
        description: 'Get specific memory by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Memory ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list-memories',
        description: 'List all memories with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            limit: { type: 'number', minimum: 1, maximum: 100, description: 'Number of results' },
            sortBy: { type: 'string', enum: ['timestamp', 'importance'], description: 'Sort criteria' },
          },
        },
      },
      {
        name: 'update-memory',
        description: 'Update existing memory',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Memory ID' },
            content: { type: 'string', description: 'Updated content' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags' },
            importance: { type: 'number', minimum: 1, maximum: 10, description: 'Updated importance' },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete-memory',
        description: 'Delete memory by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Memory ID to delete' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get-project-info',
        description: 'Get current project context and statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Sequential Thinking Tools
      {
        name: 'sequential-thinking',
        description: 'Process complex problems with step-by-step thinking',
        inputSchema: {
          type: 'object',
          properties: {
            thought: { type: 'string', description: 'Current thinking step' },
            thoughtNumber: { type: 'number', minimum: 1, description: 'Current thought number' },
            totalThoughts: { type: 'number', minimum: 1, description: 'Estimated total thoughts' },
            nextThoughtNeeded: { type: 'boolean', description: 'Whether another thought is needed' },
            isRevision: { type: 'boolean', description: 'Whether this revises previous thinking' },
            revisesThought: { type: 'number', minimum: 1, description: 'Which thought is being revised' },
          },
          required: ['thought', 'thoughtNumber', 'totalThoughts', 'nextThoughtNeeded'],
        },
      },

      // Workflow Navigation Tools
      {
        name: 'navigate-workflow',
        description: 'Navigate and manage workflow steps',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['create', 'next', 'previous', 'jump', 'complete', 'status'] },
            workflowName: { type: 'string', description: 'Name of the workflow' },
            stepNumber: { type: 'number', minimum: 1, description: 'Step number for jump action' },
            stepContent: { type: 'string', description: 'Content for new steps' },
          },
          required: ['action'],
        },
      },

      // Creative Analysis Tools
      {
        name: 'analyze-creative-content',
        description: 'Analyze content for creative insights and patterns',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Content to analyze' },
            analysisType: { 
              type: 'string', 
              enum: ['structure', 'themes', 'style', 'patterns', 'comprehensive'],
              description: 'Type of analysis to perform'
            },
            depth: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'], description: 'Analysis depth' },
          },
          required: ['content'],
        },
      },
      {
        name: 'generate-creative-insights',
        description: 'Generate creative insights based on stored memories',
        inputSchema: {
          type: 'object',
          properties: {
            theme: { type: 'string', description: 'Theme or topic for insights' },
            creativityLevel: { type: 'string', enum: ['conservative', 'balanced', 'innovative'], description: 'Level of creativity' },
            limit: { type: 'number', minimum: 1, maximum: 20, description: 'Number of insights' },
          },
          required: ['theme'],
        },
      },
    ];
  }

  private async handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // Memory Management
        case 'store-memory':
          return await this.handleStoreMemory(args);
        case 'search-memories':
          return await this.handleSearchMemories(args);
        case 'get-memory':
          return await this.handleGetMemory(args);
        case 'list-memories':
          return await this.handleListMemories(args);
        case 'update-memory':
          return await this.handleUpdateMemory(args);
        case 'delete-memory':
          return await this.handleDeleteMemory(args);
        case 'get-project-info':
          return await this.handleGetProjectInfo(args);

        // Sequential Thinking
        case 'sequential-thinking':
          return await this.handleSequentialThinking(args);

        // Workflow Navigation
        case 'navigate-workflow':
          return await this.handleNavigateWorkflow(args);

        // Creative Analysis
        case 'analyze-creative-content':
          return await this.handleAnalyzeCreativeContent(args);
        case 'generate-creative-insights':
          return await this.handleGenerateCreativeInsights(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool '${name}': ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Memory Management Handlers
  private async handleStoreMemory(args: any): Promise<CallToolResult> {
    const memory = await this.memoryManager.storeMemory(
      args.content,
      args.tags ?? [],
      args.importance ?? 5
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `Memory stored successfully with ID: ${memory.id}`,
        },
      ],
    };
  }

  private async handleSearchMemories(args: any): Promise<CallToolResult> {
    const memories = await this.memoryManager.searchMemories(
      args.query,
      args.tags,
      args.limit ?? 10
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${memories.length} memories:\n\n${memories.map(m => 
            `**ID:** ${m.id}\n**Content:** ${m.content}\n**Tags:** ${m.tags.join(', ')}\n**Importance:** ${m.importance}\n---`
          ).join('\n')}`,
        },
      ],
    };
  }

  private async handleGetMemory(args: any): Promise<CallToolResult> {
    const memory = await this.memoryManager.getMemory(args.id);
    
    if (!memory) {
      return {
        content: [
          {
            type: 'text',
            text: `Memory with ID '${args.id}' not found`,
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `**Memory ID:** ${memory.id}\n**Content:** ${memory.content}\n**Tags:** ${memory.tags.join(', ')}\n**Importance:** ${memory.importance}\n**Created:** ${new Date(memory.timestamp).toISOString()}`,
        },
      ],
    };
  }

  private async handleListMemories(args: any): Promise<CallToolResult> {
    const memories = await this.memoryManager.listMemories(
      args.tags,
      args.limit ?? 20,
      args.sortBy ?? 'timestamp'
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${memories.length} memories:\n\n${memories.map(m => 
            `**${m.id}** (${m.importance}/10) - ${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}`
          ).join('\n')}`,
        },
      ],
    };
  }

  private async handleUpdateMemory(args: any): Promise<CallToolResult> {
    const success = await this.memoryManager.updateMemory(
      args.id,
      args.content,
      args.tags,
      args.importance
    );
    
    if (!success) {
      return {
        content: [
          {
            type: 'text',
            text: `Memory with ID '${args.id}' not found`,
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Memory '${args.id}' updated successfully`,
        },
      ],
    };
  }

  private async handleDeleteMemory(args: any): Promise<CallToolResult> {
    const success = await this.memoryManager.deleteMemory(args.id);
    
    if (!success) {
      return {
        content: [
          {
            type: 'text',
            text: `Memory with ID '${args.id}' not found`,
          },
        ],
        isError: true,
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Memory '${args.id}' deleted successfully`,
        },
      ],
    };
  }

  private async handleGetProjectInfo(args: any): Promise<CallToolResult> {
    const info = await this.memoryManager.getProjectInfo();
    
    return {
      content: [
        {
          type: 'text',
          text: `**Project:** ${info.projectName}\n**Path:** ${info.projectPath}\n**Total Memories:** ${info.totalMemories}\n**Memory Directory:** ${info.memoryDirectory}\n**Version:** ${info.version}`,
        },
      ],
    };
  }

  // Sequential Thinking Handler
  private async handleSequentialThinking(args: any): Promise<CallToolResult> {
    const result = await this.sequentialThinking.processThought(
      args.thought,
      args.thoughtNumber,
      args.totalThoughts,
      args.nextThoughtNeeded,
      args.isRevision,
      args.revisesThought
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `**Thought ${result.thoughtNumber}/${result.totalThoughts}**\n\n${result.content}\n\n**Status:** ${result.status}\n**Next needed:** ${result.nextThoughtNeeded ? 'Yes' : 'No'}`,
        },
      ],
    };
  }

  // Workflow Navigation Handler
  private async handleNavigateWorkflow(args: any): Promise<CallToolResult> {
    const result = await this.workflowNavigator.navigate(
      args.action,
      args.workflowName,
      args.stepNumber,
      args.stepContent
    );
    
    return {
      content: [
        {
          type: 'text',
          text: result.message,
        },
      ],
    };
  }

  // Creative Analysis Handlers
  private async handleAnalyzeCreativeContent(args: any): Promise<CallToolResult> {
    const analysis = await this.creativeAnalyzer.analyzeContent(
      args.content,
      args.analysisType ?? 'comprehensive',
      args.depth ?? 'detailed'
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `**Creative Analysis**\n\n${analysis.summary}\n\n**Key Insights:**\n${analysis.insights.join('\n')}\n\n**Recommendations:**\n${analysis.recommendations.join('\n')}`,
        },
      ],
    };
  }

  private async handleGenerateCreativeInsights(args: any): Promise<CallToolResult> {
    const insights = await this.creativeAnalyzer.generateInsights(
      args.theme,
      args.creativityLevel ?? 'balanced',
      args.limit ?? 5
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `**Creative Insights for "${args.theme}"**\n\n${insights.map((insight, i) => 
            `${i + 1}. ${insight}`
          ).join('\n\n')}`,
        },
      ],
    };
  }
}
