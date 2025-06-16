@echo off
cd /d "z:\MCP\MCP v2\advanced-memory-bank-mcp"
echo Building project...
npm run build
echo Build completed. Publishing...
npm publish
echo Publication completed!
echo Checking published version...
npm view @andrebuzeli/advanced-json-memory-bank version
pause
