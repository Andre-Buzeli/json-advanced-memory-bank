#!/usr/bin/env node

/**
 * Advanced Memory Bank MCP v3.3.5 - Zero-Dependency Entry Point
 * Built-in AI embeddings using internal algorithms - No API keys required
 * Enhanced stability with standalone mode and JSON-RPC protocol compliance
 * 
 * @author Andre Buzeli
 * @version 3.3.5
 * @since 2025
 */

// Set a higher timeout for imports
const IMPORT_TIMEOUT = 30000; // 30 seconds

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`Unhandled rejection: ${reason}\n`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught exception: ${error}\n`);
});

// Wrapper for dynamic imports with fallback
async function startServer() {
  // Signal that server is starting
  process.stderr.write(`[@andrebuzeli/advanced-json-memory-bank] Starting server v1.0.0...\n`);
  
  try {
    // Try to load MCP SDK with timeout
    const importPromise = Promise.all([
      import('@modelcontextprotocol/sdk/server/stdio.js'),
      import('./server.js')
    ]);
    
    // Set timeout for imports
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Import timeout')), IMPORT_TIMEOUT));
    
    // Wait for imports or timeout
    const [sdkImport, serverImport] = await Promise.race([importPromise, timeoutPromise]);
    
    const { StdioServerTransport } = sdkImport;
    const { AdvancedMemoryBankServer } = serverImport;
    
    // Signal successful imports
    process.stderr.write(`[advanced-memory-bank] Modules loaded successfully\n`);
    
    // Create and run the server with MCP SDK
    const server = new AdvancedMemoryBankServer();
    await server.connect(new StdioServerTransport());
  } catch (error) {
    // If error is about timeout or dependency, try standalone mode
    if (error.code === 'ERR_MODULE_NOT_FOUND' || 
        error.message.includes('timeout') || 
        error.message.includes('504')) {
      
      process.stderr.write(`[advanced-memory-bank] SDK import failed, trying standalone mode\n`);
      
      try {
        // Import the fallback implementation
        const { createStandaloneServer } = await import('./standalone.js');
        await createStandaloneServer();
      } catch (fallbackError) {
        process.stderr.write(`[advanced-memory-bank] Standalone server error: ${fallbackError}\n`);
        process.stderr.write(`Advanced Memory Bank requires @modelcontextprotocol/sdk to be installed.\n`);
        process.stderr.write(`Please install it with: npm install @modelcontextprotocol/sdk\n`);
        process.exit(1);
      }
    } else {
      process.stderr.write(`[advanced-memory-bank] Server error: ${error}\n`);
      process.exit(1);
    }
  }
}

// Start the server
startServer();