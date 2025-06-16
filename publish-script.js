const { execSync } = require('child_process');
const path = require('path');

console.log('Starting NPM publication process...');

try {
    // Change to project directory
    process.chdir('Z:\\MCP\\MCP v2\\advanced-memory-bank-mcp');
    console.log('Changed to directory:', process.cwd());
    
    // Check NPM auth
    console.log('Checking NPM authentication...');
    const whoami = execSync('npm whoami', { encoding: 'utf8' });
    console.log('Authenticated as:', whoami.trim());
    
    // Check current version
    console.log('Checking current package version...');
    const currentVersion = execSync('npm view @andrebuzeli/advanced-json-memory-bank version', { encoding: 'utf8' });
    console.log('Current published version:', currentVersion.trim());
    
    // Publish
    console.log('Publishing version 1.3.5...');
    const publishResult = execSync('npm publish', { encoding: 'utf8' });
    console.log('Publication result:', publishResult);
    
    console.log('Publication completed successfully!');
    
} catch (error) {
    console.error('Error during publication:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
}
