# Advanced Memory Bank MCP Configuration

# Example VS Code/Cursor MCP configuration
# Add this to your MCP settings file

```json
{
  "mcpServers": {
    "advanced-memory-bank": {
      "command": "npx",
      "args": ["@andrebuzeli/advanced-json-memory-bank"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

# Environment Variables (optional)
# Create a .env file in your project root:

```bash
# Optional: Override default memory directory
# MEMORY_DIR=/custom/path/to/memories

# Optional: Set log level
# LOG_LEVEL=info

# Optional: Maximum memories per project
# MAX_MEMORIES=10000

# Optional: Cleanup interval in milliseconds
# CLEANUP_INTERVAL=86400000
```

# Project Detection
The system automatically detects your project name from:
1. VS Code workspace name
2. Current directory name
3. package.json name field
4. Git repository root

# Memory Storage
Memories are stored in: `~/.advanced-memory-bank/{project-name}/`

Each memory is a JSON file with structure:
```json
{
  "id": "mem-timestamp-random",
  "content": "Your memory content",
  "tags": ["tag1", "tag2"],
  "importance": 7,
  "timestamp": 1703123456789,
  "projectContext": "detected-project-name"
}
```

# Tool Usage Examples

## Store Memory
```json
{
  "tool": "store_memory",
  "arguments": {
    "content": "Implemented user authentication with JWT tokens",
    "tags": ["auth", "jwt", "security"],
    "importance": 8
  }
}
```

## Search Memories
```json
{
  "tool": "search_memories",
  "arguments": {
    "query": "authentication",
    "limit": 5
  }
}
```

## Analyze Content
```json
{
  "tool": "analyze_content",
  "arguments": {
    "content": "Complex code or documentation here...",
    "analysisType": "summary"
  }
}
```
