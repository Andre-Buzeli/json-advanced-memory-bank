/**
 * Standalone server implementation that doesn't rely on MCP SDK
 * This provides basic functionality when the SDK is not available
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Simple JSON-RPC implementation
class JsonRpcServer {
  private stdin: NodeJS.ReadStream;
  private stdout: NodeJS.WriteStream;
  private buffer: string = '';
  private handlers: Map<string, Function> = new Map();

  constructor() {
    this.stdin = process.stdin;
    this.stdout = process.stdout;
  }

  registerMethod(method: string, handler: Function): void {
    this.handlers.set(method, handler);
  }

  start(): void {
    this.stdin.setEncoding('utf8');
    this.stdin.on('data', (chunk) => this.handleInput(chunk.toString()));
    this.stdin.on('error', (error) => {
      process.stderr.write(`[standalone] STDIN error: ${error}\n`);
    });
    
    // Send ready notification
    process.stderr.write(`[standalone] Starting standalone server\n`);
    this.sendNotification('ready', {});
    process.stderr.write(`[standalone] Ready notification sent\n`);
  }

  private handleInput(chunk: string): void {
    this.buffer += chunk;
    
    // Process complete messages
    while (true) {
      const headerMatch = this.buffer.match(/^Content-Length: (\d+)\r\n\r\n/);
      if (!headerMatch) break;
      
      const contentLength = parseInt(headerMatch[1], 10);
      const headerEnd = headerMatch[0].length;
      
      if (this.buffer.length < headerEnd + contentLength) break;
      
      const content = this.buffer.slice(headerEnd, headerEnd + contentLength);
      this.buffer = this.buffer.slice(headerEnd + contentLength);
      
      try {
        const message = JSON.parse(content);
        this.processMessage(message);
      } catch (error) {
        console.error('Failed to parse JSON-RPC message:', error);
      }
    }
  }

  private processMessage(message: any): void {
    if (!message.id || !message.method) {
      process.stderr.write(`[standalone] Invalid message: missing id or method\n`);
      return;
    }
    
    const handler = this.handlers.get(message.method);
    if (handler) {
      process.stderr.write(`[standalone] Processing method: ${message.method}\n`);
      
      Promise.resolve()
        .then(() => handler(message.params))
        .then((result) => {
          process.stderr.write(`[standalone] Method ${message.method} succeeded\n`);
          this.sendResponse(message.id, result);
        })
        .catch((error) => {
          process.stderr.write(`[standalone] Method ${message.method} failed: ${error}\n`);
          this.sendError(message.id, error.message);
        });
    } else {
      process.stderr.write(`[standalone] Method not found: ${message.method}\n`);
      this.sendError(message.id, `Method not found: ${message.method}`);
    }
  }

  private sendResponse(id: string | number, result: any): void {
    const response = JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    });
    
    const headers = `Content-Length: ${Buffer.byteLength(response)}\r\n\r\n`;
    this.stdout.write(headers + response);
  }

  private sendError(id: string | number, message: string): void {
    const response = JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message
      }
    });
    
    const headers = `Content-Length: ${Buffer.byteLength(response)}\r\n\r\n`;
    this.stdout.write(headers + response);
  }

  private sendNotification(method: string, params: any): void {
    const notification = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params
    });
    
    const headers = `Content-Length: ${Buffer.byteLength(notification)}\r\n\r\n`;
    this.stdout.write(headers + notification);
  }
}

// Basic memory manager for the standalone mode
class SimpleMemoryManager {
  private memoryRoot: string;
  
  constructor() {
    this.memoryRoot = process.env.MEMORY_BANK_ROOT || path.resolve(process.cwd(), 'memory-banks');
    fs.ensureDirSync(this.memoryRoot);
  }
  
  async listProjects(): Promise<string[]> {
    try {
      const contents = await fs.readdir(this.memoryRoot);
      const projects = [];
      
      for (const item of contents) {
        const itemPath = path.join(this.memoryRoot, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          projects.push(item);
        }
      }
      
      return projects;
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  }
  
  async readMemory(project: string, memoryName: string): Promise<string | null> {
    try {
      const projectPath = path.join(this.memoryRoot, project);
      
      if (!await fs.pathExists(projectPath)) {
        return null;
      }
      
      const memoryPath = path.join(projectPath, `${memoryName}.md`);
      
      if (!await fs.pathExists(memoryPath)) {
        return null;
      }
      
      return await fs.readFile(memoryPath, 'utf8');
    } catch (error) {
      console.error('Error reading memory:', error);
      return null;
    }
  }
  
  async writeMemory(project: string, memoryName: string, content: string): Promise<boolean> {
    try {
      const projectPath = path.join(this.memoryRoot, project);
      await fs.ensureDir(projectPath);
      
      const memoryPath = path.join(projectPath, `${memoryName}.md`);
      await fs.writeFile(memoryPath, content);
      
      return true;
    } catch (error) {
      console.error('Error writing memory:', error);
      return false;
    }
  }
  
  async listFiles(project: string): Promise<string[]> {
    try {
      const projectPath = path.join(this.memoryRoot, project);
      
      if (!await fs.pathExists(projectPath)) {
        return [];
      }
      
      const contents = await fs.readdir(projectPath);
      return contents.filter(item => item.endsWith('.md')).map(item => item.replace(/\.md$/, ''));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
}

// Create and run the standalone server
export async function createStandaloneServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stderr.write(`[standalone] Creating standalone server...\n`);
    
    // Set timeout for startup
    const startupTimeout = setTimeout(() => {
      process.stderr.write(`[standalone] Startup timeout\n`);
      reject(new Error('Standalone server startup timeout'));
    }, 30000);
    
    try {
      const server = new JsonRpcServer();
      const memoryManager = new SimpleMemoryManager();
      
      process.stderr.write(`[standalone] Simple Memory Manager initialized\n`);
      
      // Register basic methods
      server.registerMethod('list_projects', async () => {
        const projects = await memoryManager.listProjects();
        return { projects };
      });
      
      server.registerMethod('list_project_files', async (params: any) => {
        const { projectName } = params;
        const files = await memoryManager.listFiles(projectName);
        return { files };
      });
      
      server.registerMethod('memory_bank_read', async (params: any) => {
        const { projectName, memoryName } = params;
        const content = await memoryManager.readMemory(projectName, memoryName);
        return { content: content || '' };
      });
      
      server.registerMethod('memory_bank_write', async (params: any) => {
        const { projectName, memoryName, content } = params;
        const success = await memoryManager.writeMemory(projectName, memoryName, content);
        return { success };
      });
      
      server.registerMethod('memory_bank_update', async (params: any) => {
        const { projectName, memoryName, content } = params;
        const success = await memoryManager.writeMemory(projectName, memoryName, content);
        return { success };
      });
      
      // Register simple methods
      server.registerMethod('get_model_context_protocol_info', async () => {
        return {
          name: 'advanced-memory-bank-mcp-standalone',
          version: '3.3.5',
          description: 'Standalone version of Advanced Memory Bank MCP',
        };
      });
      
      server.registerMethod('list_tools', async () => {
        return {
          tools: [
            {
              name: 'list_projects',
              description: 'List all available projects',
              parameters: {
                type: 'object',
                properties: {},
                required: []
              }
            },
            {
              name: 'list_project_files',
              description: 'List files within a project',
              parameters: {
                type: 'object',
                properties: {
                  projectName: {
                    type: 'string',
                    description: 'The name of the project'
                  }
                },
                required: ['projectName']
              }
            },
            {
              name: 'memory_bank_read',
              description: 'Read memory content',
              parameters: {
                type: 'object',
                properties: {
                  projectName: {
                    type: 'string',
                    description: 'The name of the project'
                  },
                  memoryName: {
                    type: 'string',
                    description: 'The name of the memory file'
                  }
                },
                required: ['projectName', 'memoryName']
              }
            },
            {
              name: 'memory_bank_write',
              description: 'Create new memory',
              parameters: {
                type: 'object',
                properties: {
                  projectName: {
                    type: 'string',
                    description: 'The name of the project'
                  },
                  memoryName: {
                    type: 'string',
                    description: 'The name of the memory file'
                  },
                  content: {
                    type: 'string',
                    description: 'The content of the memory file'
                  }
                },
                required: ['projectName', 'memoryName', 'content']
              }
            },
            {
              name: 'memory_bank_update',
              description: 'Update existing memory',
              parameters: {
                type: 'object',
                properties: {
                  projectName: {
                    type: 'string',
                    description: 'The name of the project'
                  },
                  memoryName: {
                    type: 'string',
                    description: 'The name of the memory file'
                  },
                  content: {
                    type: 'string',
                    description: 'The content of the memory file'
                  }
                },
                required: ['projectName', 'memoryName', 'content']
              }
            }
          ]
        };
      });
      
      // Start the server
      server.start();
      
      clearTimeout(startupTimeout);
      process.stderr.write(`[standalone] Server started successfully\n`);
      
      resolve();
    } catch (error) {
      clearTimeout(startupTimeout);
      process.stderr.write(`[standalone] Server error: ${error}\n`);
      reject(error);
    }
  });
}
