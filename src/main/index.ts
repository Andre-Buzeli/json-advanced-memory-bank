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
  // Get version from package.json (simple approach)
  let version = '3.0.1'; // fallback version
  try {
    // Simple require approach that works in compiled JS
    const fs = await import('fs');
    const path = await import('path');
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    version = packageJson.version ?? '3.0.1';
  } catch {
    // Keep fallback version if reading fails - no error handling needed
  }
  
  // Signal that server is starting
  process.stderr.write(`[@andrebuzeli/advanced-json-memory-bank] Starting server v${version}...\n`);
  
  try {
    // Try to load MCP SDK with timeout
    const importPromise = Promise.all([
      import('@modelcontextprotocol/sdk/server/stdio.js'),
      import('./server.js')
    ]);
    
    // Set timeout for imports
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Import timeout')), IMPORT_TIMEOUT));
    
    // Wait for imports or timeout
    const [sdkImport, serverImport] = await Promise.race([importPromise, timeoutPromise]) as [any, any];
    
    const { StdioServerTransport } = sdkImport;
    const { AdvancedMemoryBankServer } = serverImport;
    
    // Signal successful imports
    process.stderr.write(`[advanced-memory-bank] Modules loaded successfully\n`);
    
    // Create and run the server with MCP SDK
    const server = new AdvancedMemoryBankServer();
    await server.initialize();
    await server.connect(new StdioServerTransport());
  } catch (error: any) {
    // If error is about timeout or dependency, try standalone mode
    if (error?.code === 'ERR_MODULE_NOT_FOUND' || 
        error?.message?.includes('timeout') || 
        error?.message?.includes('504')) {
      
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