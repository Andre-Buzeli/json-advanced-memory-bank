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

## 🆕 Standalone Mode (v3.2.3+)

The Advanced Memory Bank MCP now features a standalone mode that automatically activates when the MCP SDK is not available. This makes it perfect for use with `npx`:

```json
"advanced-memory-bank": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@andrebuzeli/advanced-memory-bank"
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
npm install @andrebuzeli/advanced-memory-bank

# Or use directly with npx
npx @andrebuzeli/advanced-memory-bank
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/andrebuzeli/advanced-memory-bank.git
cd advanced-memory-bank-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run the MCP server
npm run start
```

## 💾 Database Setup

### Setting Up PostgreSQL with pgvector

1. Install PostgreSQL 14 or later
2. Install pgvector extension:

```sql
CREATE EXTENSION vector;
```

3. Create a database for memory storage:

```sql
CREATE DATABASE memory_bank;
```

4. Run the initialization script:

```bash
npm run db:init
```

This will:
- Create necessary tables for memory storage
- Set up indexes for vector similarity search
- Initialize the memory structure

## 🖥️ VS Code / Cursor Integration

Add the MCP to your VS Code or Cursor settings.json:

```json
"modelContextProtocolServers": {
  "advanced-memory-bank": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@andrebuzeli/advanced-memory-bank"
    ],
    "env": {
      "MEMORY_BANK_ROOT": "/path/to/memory/folder"
    }
  }
}
```

That's it! No database setup, API keys, or additional configuration required.

## 🔄 Memory System Architecture

### Memory Storage Architecture

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Memory Manager │────>│ Built-in Vector │────>│ Local        │
│                │<────│ Embeddings      │<────│ File System  │
└────────────────┘     └─────────────────┘     └──────────────┘
        │                                             │
        │                                             │
┌────────────────┐                            ┌──────────────┐
│ Optional DB    │<---------------------------│ Memory Banks │
│ (if enabled)   │                            │ Directory    │
└────────────────┘                            └──────────────┘
```

### Memory Types

The system maintains various types of memories:

- **Core Memories**: Always present (`summary.md`, `status.md`, etc.)
- **Dynamic Memories**: Created as needed (analyses, creative decisions, etc.)

## 🔄 Backup System

### Automatic Backup Configuration

The system includes an automatic backup feature that creates timestamped backups every 5 minutes.

**Environment Variables:**

```bash
# Main memory bank directory
MEMORY_BANK_ROOT=./memory-banks

# Backup directory (defaults to memory-banks/backups)  
MEMORY_BANK_BACKUP=./memory-banks/backups
```

**Backup Features:**

- Automatic backups every ~5 minutes
- Timestamped backup files with date and time
- Manual backup tool with custom directory option
- Non-intrusive operation (doesn't interrupt normal operations)
- Configurable backup directory

### Manual Backup Tool

Use the `backup_memory` tool to create manual backups:

```json
{
  "tool": "backup_memory",
  "arguments": {
    "customBackupDir": "/path/to/custom/backup/directory"
  }
}
```

**Backup File Format:**

Backups are saved with format: `memory-bank_YYYY-MM-DD_HH-MM-SS.json`

Example: `project1_2025-06-12_14-30-45.json`

## 🔄 Backup System

### Automatic Backup Configuration

The system includes an automatic backup feature that creates timestamped backups every 5 minutes.

**Environment Variables:**
```bash
# Main memory bank directory
MEMORY_BANK_ROOT=./memory-banks

# Backup directory (defaults to memory-banks/backups)
MEMORY_BANK_BACKUP=./memory-banks/backups
```

**Backup Features:**
- Automatic backups every ~5 minutes
- Timestamped backup files with date and time
- Manual backup tool with custom directory option
- Non-intrusive operation (doesn't interrupt normal operations)
- Configurable backup directory

### Manual Backup Tool

Use the `backup_memory` tool to create manual backups:

```json
{
  "tool": "backup_memory",
  "arguments": {
    "customBackupDir": "/path/to/custom/backup/directory"  // Optional
  }
}
```

**Backup File Format:**
Backups are saved with format: `memory-bank_YYYY-MM-DD_HH-MM-SS.json`

Example: `project1_2025-06-12_14-30-45.json`

## 📦 MCP Tools

### Basic Tools

- `list_projects`: List all available projects
- `backup_memory`: Create a manual backup of all memory bank projects
- `memory_bank_read`: Read memory content
- `memory_bank_write`: Create new memory
- `memory_bank_update`: Update existing memory

### Advanced Tools

- `semantic_search`: Search memory using natural language
- `context_intelligence`: AI-powered memory suggestions
- `enhanced_thinking`: Sequential thinking with visual context
- `creative_analyzer`: Decision analysis with trade-offs
- `workflow_navigator`: Visual guidance through workflow states
- `memory_analyzer`: Analyze memory dependencies and suggest cleanup

### New in v3.3.0

- `memory_bank_delete`: Apaga um arquivo `.md` da memória do projeto (filesystem e banco, se habilitado)
- `memory_bank_update`: Agora aceita o parâmetro opcional `removeText` para remover um trecho específico do `.md` além de adicionar conteúdo

### 🆕 Batch Update Support (v3.3.3)

The `memory_bank_update` tool now supports batch updates. You can update a single file as before, or update multiple files in one call:

#### Single Update Example
```js
memory_bank_update({
  projectName: "my-project",
  fileName: "notes.md",
  content: "New content for notes.md"
})
```

#### Batch Update Example
```js
memory_bank_update({
  projectName: "my-project",
  updates: [
    { fileName: "notes.md", content: "New content for notes.md" },
    { fileName: "summary.md", content: "Update summary", removeText: "old line" }
  ]
})
```

- The default is single update (fileName + content). For multiple files, use the `updates` array.
- The optional `removeText` parameter can be used in both modes to remove a specific snippet from a file.

### Exemplo de uso

#### Apagar um arquivo `.md`:
```javascript
{
  "projectName": "meu-projeto",
  "fileName": "anotacoes.md"
}
```

#### Remover trecho específico de um `.md`:
```javascript
{
  "projectName": "meu-projeto",
  "fileName": "anotacoes.md",
  "removeText": "trecho a ser removido"
}
```

#### Adicionar conteúdo e remover trecho ao mesmo tempo:
```javascript
{
  "projectName": "meu-projeto",
  "fileName": "anotacoes.md",
  "content": "novo conteúdo a ser adicionado",
  "removeText": "trecho antigo"
}
```

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

### Context Intelligence

```javascript
{
  "taskDescription": "Implement JWT authentication",
  "projectName": "my-project",
  "currentContext": "Working on the backend API",
  "maxSuggestions": 5
}
```

### Memory Analysis

```javascript
{
  "projectName": "my-project",
  "analysisType": "all",
  "includeMetrics": true
}
```

## 🧠 Memory Management

### Memory Consolidation

Similar memories are automatically identified and merged to maintain a coherent memory bank:

1. Vector similarity check when new memories are added
2. Semantic similarity threshold (configurable)
3. Content merging preserves unique information
4. References updated to point to consolidated memory

### Memory Pruning

When memory limits are reached:

1. Importance score calculation based on:
   - Access frequency
   - Recency of access
   - Centrality in reference graph
   - Custom importance flags
2. Least important memories are pruned
3. Core memories are always preserved

## 📝 License

MIT License - See LICENSE file for details