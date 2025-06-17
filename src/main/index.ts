#!/usr/bin/env node

/**
 * Advanced Memory Bank MCP v4.0.0 - Clean Entry Point
 * Dynamic project detection with simplified architecture
 * 
 * @author Andre Buzeli
 * @version 4.0.0
 * @since 2025
 */

// Handle unhandled rejections gracefully
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[advanced-memory-bank] Unhandled rejection: ${reason}\n`);
  process.exit(1);
});

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  process.stderr.write(`[advanced-memory-bank] Uncaught exception: ${error}\n`);
  process.exit(1);
});

/**
 * Start the MCP server
 */
async function startServer(): Promise<void> {
  try {
    // Dynamic imports for better error handling
    const [{ StdioServerTransport }, { AdvancedMemoryBankServer }] = await Promise.all([
      import('@modelcontextprotocol/sdk/server/stdio.js'),
      import('./server.js')
    ]);

    // Create and initialize server
    const server = new AdvancedMemoryBankServer();
    await server.initialize();
    
    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot resolve module')) {
      console.error('[advanced-memory-bank] Missing dependency: @modelcontextprotocol/sdk');
      console.error('Please install it with: npm install @modelcontextprotocol/sdk');
    } else {
      console.error(`[advanced-memory-bank] Server error: ${error}`);
    }
    process.exit(1);
  }
}

// Start the server
startServer();