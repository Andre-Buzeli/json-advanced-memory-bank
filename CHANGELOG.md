# Changelog

All notable changes to the Advanced JSON Memory Bank MCP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-06-13

### Fixed
- **CRITICAL**: Eliminated all warnings from VS Code logs that interfered with MCP protocol
- **CRITICAL**: Fixed backup system to only backup active project instead of all projects
- Corrected inconsistent name references from old "advanced-memory-bank" to "@andrebuzeli/advanced-json-memory-bank"
- Updated all log messages to use consistent package name and version
- Made debug logs conditional with DEBUG_MEMORY_BANK=true environment variable

### Added
- **Project-specific backup system**: Backup only the active project every 5 minutes
- Automatic project tracking in memory manager
- Organized backup structure: `backups/[project]/[project]_timestamp.json`
- Created clean project structure with docs/ and scripts/ folders

### Changed
- **Backup architecture**: From backing up all projects to backing up only active project
- **Log behavior**: Debug messages only appear with DEBUG_MEMORY_BANK=true
- **Project organization**: Moved technical docs to docs/ and utility scripts to scripts/
- **Name consistency**: All references now use "@andrebuzeli/advanced-json-memory-bank"

### Removed
- 5 obsolete files: README-v1.0.0.md, retry-publish.js, run-test.js, test-schema.js, typescript-fixes.ts
- Eliminated "Failed to parse message" warnings from MCP protocol

## [1.0.1] - 2025-06-12

### Changed
- **Package name**: Published to NPM with scoped name "@andrebuzeli/advanced-json-memory-bank"
- **Repository**: Updated package.json to point to correct GitHub repository
- Binary configuration updated for scoped package

## [1.0.0] - 2025-06-12

### Added
- **Initial NPM publication** as "advanced-json-memory-bank"
- **15 MCP tools** for comprehensive memory management
- **Zero-dependency mode** with built-in TF-IDF embeddings
- **Automatic backup system** every 5 minutes with configurable directory
- **Single JSON file architecture** per project (migrated from multiple .md files)
- **Advanced update operations**: append, prepend, replace, insert_after, insert_before
- **Batch update support** for updating multiple files in one operation
- **Project reset functionality** with automatic backup
- **Standalone mode** for environments without MCP SDK

### Architecture
- **Built-in AI embeddings** using TF-IDF algorithm (no API keys required)
- **Modular TypeScript** architecture with ESM modules
- **Optional PostgreSQL** support with zero-dependency fallback
- **Enhanced stability** with timeout handling and robust error management
- **Visual workflow** system with 5 development modes

### MCP Tools (15 total)
#### Core Memory Tools (6)
1. `list_projects` - List all projects in memory bank
2. `list_project_files` - List files in a specific project  
3. `memory_bank_read` - Read specific memory entry
4. `memory_bank_write` - Create new memory entry
5. `memory_bank_update` - Update existing memory with advanced operations
6. `memory_bank_reset` - Reset project with automatic backup

#### Intelligence Tools (3)
7. `context_intelligence` - AI-powered relevant memory suggestions
8. `memory_analyzer` - Analyze dependencies, orphans, and cleanup suggestions
9. `semantic_search` - Search memory using natural language with built-in embeddings

#### Workflow Tools (3) 
10. `enhanced_thinking` - Sequential thinking with branching and visual context
11. `workflow_navigator` - Navigate through development workflow phases
12. `creative_analyzer` - Creative analysis with trade-off matrices

#### Management Tools (3)
13. `backup_memory` - Create manual backup of all projects
14. `get_project_summary` - Get structured project overview
15. `optimize_memory` - Optimize memory usage and clean orphaned entries

### Production Ready
- **Enhanced stability** with comprehensive error handling
- **Timeout management** for all async operations
- **Graceful degradation** when optional components unavailable
- **Zero-configuration** setup for immediate use

---

*Advanced JSON Memory Bank MCP - Published on NPM as @andrebuzeli/advanced-json-memory-bank*