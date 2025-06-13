# Advanced Memory Bank MCP

A truly zero-dependency memory system for AI assistants, implementing the Model Context Protocol (MCP). This advanced version works out of the box with local file-based storage and built-in embedding algorithms, requiring no external services.

## 🚀 Features

- **Built-in Semantic Understanding**: Local embedding algorithm with zero external dependencies
- **File-based Storage**: Works completely offline with local markdown files
- **Memory Consolidation**: Automatic merging of similar content
- **Dynamic Importance**: Weight memories based on access patterns and context
- **Adaptive Pruning**: Smart memory management when limits are reached
- **Enhanced Workflows**: Visual guidance through development phases
- **Creative Analysis**: Trade-off matrices and decision support
- **Context Intelligence**: AI-powered relevant memory suggestions
- **Zero-Dependency Mode**: Complete functionality without external dependencies
- **Optional Database Integration**: PostgreSQL with pgvector available as an optional feature

## 📋 Requirements

- Node.js 18+ (ECMAScript modules support)
- Nothing else! (PostgreSQL and OpenAI are completely optional)

## 🆕 Standalone Mode (v1.0.2+)

The Advanced Memory Bank MCP now features a standalone mode that automatically activates when the MCP SDK is not available. This makes it perfect for use with `npx`:

```json
"advanced-memory-bank": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@andrebuzeli/advanced-json-memory-bank"
  ],
  "env": {
    "MEMORY_BANK_ROOT": "/path/to/memory/folder"
  }
}
```

In standalone mode:
- Basic memory operations work without any dependencies
- File-based memory storage is used without requiring PostgreSQL
- Core tools (list_projects, memory_bank_read, etc.) are fully functional
- Advanced semantic features gracefully degrade to simpler implementations

This makes deployment much easier in environments where installing dependencies might be challenging.

## 🔧 Installation

### Simple Installation (Zero Configuration)

```bash
# NPM installation
npm install @andrebuzeli/advanced-json-memory-bank

# Or use directly with npx
npx @andrebuzeli/advanced-json-memory-bank
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Andre-Buzeli/json-advanced-memory-bank.git
cd json-advanced-memory-bank

# Install dependencies
npm install

# Build the project
npm run build

# Run the MCP server
npm run start
```

## 🖥️ VS Code / Cursor Integration

Add the MCP to your VS Code or Cursor settings.json:

```json
"modelContextProtocolServers": {
  "advanced-memory-bank": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@andrebuzeli/advanced-json-memory-bank"
    ],
    "env": {
      "MEMORY_BANK_ROOT": "/path/to/memory/folder"
    }
  }
}
```

That's it! No database setup, API keys, or additional configuration required.

## 📦 MCP Tools (15 total)

### 🗃️ Core Memory Tools (6)
1. **`list_projects`** - List all projects in memory bank
2. **`list_project_files`** - List files in a specific project  
3. **`memory_bank_read`** - Read specific memory entry
4. **`memory_bank_write`** - Create new memory entry
5. **`memory_bank_update`** - Update existing memory with advanced operations
6. **`memory_bank_reset`** - Reset project with automatic backup

### 🧠 Intelligence Tools (3)
7. **`context_intelligence`** - AI-powered relevant memory suggestions
8. **`memory_analyzer`** - Analyze dependencies, orphans, and cleanup suggestions
9. **`semantic_search`** - Search memory using natural language with built-in embeddings

### ⚙️ Workflow Tools (3) 
10. **`enhanced_thinking`** - Sequential thinking with branching and visual context
11. **`workflow_navigator`** - Navigate through development workflow phases
12. **`creative_analyzer`** - Creative analysis with trade-off matrices

### 🛠️ Management Tools (3)
13. **`backup_memory`** - Create manual backup of all projects
14. **`get_project_summary`** - Get structured project overview
15. **`optimize_memory`** - Optimize memory usage and clean orphaned entries

## 🔄 Backup System

### Automatic Backup Configuration

The system includes an automatic backup feature that creates timestamped backups every 5 minutes of the active project only.

**Environment Variables:**
```bash
# Main memory bank directory
MEMORY_BANK_ROOT=./memory-banks

# Backup directory (defaults to memory-banks/backups)
MEMORY_BANK_BACKUP=./memory-banks/backups
```

**Backup Features:**
- Automatic backups every ~5 minutes of active project only
- Organized by project: `backups/[project]/[project]_timestamp.json`
- Manual backup tool with custom directory option
- Non-intrusive operation (doesn't interrupt normal operations)
- Configurable backup directory

## 🔍 Usage Examples

### Semantic Search

```javascript
{
  "projectName": "my-project",
  "query": "How did we resolve the authentication issue?",
  "limit": 5,
  "similarityThreshold": 0.7
}
```

### Advanced Update Operations

```javascript
{
  "projectName": "my-project",
  "fileName": "notes.md",
  "content": "New content to add",
  "operation": "append",  // append, prepend, replace, insert_after, insert_before
  "targetText": "existing text"  // for insert operations
}
```

### Batch Updates

```javascript
{
  "projectName": "my-project",
  "updates": [
    { "fileName": "notes.md", "content": "New content", "operation": "append" },
    { "fileName": "summary.md", "content": "Update summary", "removeText": "old line" }
  ]
}
```

## 🎯 Why This Version?

### 🆚 **vs. Original Memory Bank**
- ✅ **Single JSON file** per project (easier to manage than multiple .md files)
- ✅ **15 vs 11 tools** (added reset, summary, optimize, advanced update operations)
- ✅ **Automatic backup system** (every 5 minutes with configurable directory)
- ✅ **Advanced update operations** (append, prepend, replace, insert_after, insert_before)
- ✅ **Production stability** (enhanced error handling and timeout management)

### 🆚 **vs. Database Solutions**
- ✅ **Zero setup** (no database installation required)
- ✅ **Portable** (entire memory bank is a single JSON file)
- ✅ **Transparent** (can view and edit memories directly)
- ✅ **Version control friendly** (JSON files work great with Git)

### 🆚 **vs. Cloud Solutions** 
- ✅ **Privacy** (everything stays local)
- ✅ **No API costs** (built-in embeddings using TF-IDF)
- ✅ **Offline capable** (works without internet)
- ✅ **No vendor lock-in** (standard JSON format)

## 🧠 Memory Management

### Memory Consolidation

Similar memories are automatically identified and merged using built-in TF-IDF embeddings to maintain a coherent memory bank:

1. Vector similarity check when new memories are added
2. Semantic similarity threshold (configurable)
3. Content merging preserves unique information
4. References updated to point to consolidated memory

### Memory Architecture

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Memory Manager │────>│ Built-in TF-IDF │────>│ Single JSON  │
│                │<────│ Embeddings      │<────│ File/Project │
└────────────────┘     └─────────────────┘     └──────────────┘
        │                                             │
        │                                             │
┌────────────────┐                            ┌──────────────┐
│ Optional DB    │<---------------------------│ Backup       │
│ (if enabled)   │                            │ System       │
└────────────────┘                            └──────────────┘
```

## 📦 NPM Package

This package is published as `@andrebuzeli/advanced-json-memory-bank` on NPM.

**Quick Start:**
```bash
npx @andrebuzeli/advanced-json-memory-bank
```

**Published Features:**
- ✅ Zero-dependency mode with built-in embeddings
- ✅ 15 MCP tools for comprehensive memory management
- ✅ Automatic backup system every 5 minutes
- ✅ Single JSON file per project architecture
- ✅ Production-ready stability enhancements

## 📝 License

MIT License - See LICENSE file for details

---

*Advanced JSON Memory Bank MCP v1.0.2 - Published on NPM as @andrebuzeli/advanced-json-memory-bank*