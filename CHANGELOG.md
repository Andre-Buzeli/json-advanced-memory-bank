# Changelog

All notable changes to the Advanced Memory Bank MCP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.5] - 2025-06-12

### Fixed
- **CRITICAL**: Corrigido problema de timeout na inicialização do servidor MCP
- **CRITICAL**: Eliminadas saídas `console.log/error` que interferiam no protocolo JSON-RPC
- Substituídas todas as operações de log por `process.stderr.write` para não afetar a comunicação
- Implementados timeouts para evitar congelamento durante imports e conexões
- Adicionado tratamento robusto para falhas de rede ao acessar o registro NPM

### Added
- Modo standalone aprimorado com melhor tratamento de erros
- Logging detalhado para diagnóstico via stderr
- Configurações no .env para controlar comportamento do servidor
- Modo offline como padrão para garantir operação em ambientes com conectividade limitada

### Changed
- Configuração padrão agora prioriza o modo standalone e sistema de arquivos
- Melhorado o tratamento de erros em todas as partes do servidor
- Atualizada documentação para incluir novos parâmetros de configuração

## [3.3.4] - 2025-06-09

### Fixed
- **CRITICAL**: Fixed `memory_bank_update` tool schema incompatibility with AI agent models
- Removed problematic `anyOf` JSON schema constraint that was causing tool registration failures
- Enhanced argument validation in `memory_bank_update` handler for better error handling
- Added robust validation for batch vs single update mode detection

### Changed
- Simplified `memory_bank_update` schema structure for maximum AI model compatibility
- Improved error messages for invalid tool arguments

## [3.3.3] - 2025-06-07

### Added
- Batch update support for `memory_bank_update`: now accepts an `updates` array to update multiple files in a single call (single-file update remains default)

### Changed
- MCP tool schema for `memory_bank_update` now supports both single and batch update modes
- Documentation (custom-instructions.md, README.md) updated with batch update usage and examples

### Fixed
- All tool schemas include `$schema` for MCP/VS Code compatibility
- Minor documentation and schema clarifications

## [3.3.0] - 2025-06-06

### Added
- Nova tool `memory_bank_delete`: permite apagar arquivos `.md` da memória de qualquer projeto (filesystem e banco, se habilitado)
- `memory_bank_update` agora aceita o parâmetro opcional `removeText`, permitindo remover trechos específicos do `.md` além de adicionar conteúdo

### Changed
- Atualização da documentação e exemplos para refletir as novas capacidades de remoção

### Fixed
- Pequenas melhorias de robustez em operações de update e delete

## [3.2.4] - 2025-06-04

### Changed
- Switched to true zero-dependency model by defaulting to file-based storage
- Made PostgreSQL database optional and disabled by default
- Enhanced built-in embedding algorithm for improved local semantic search
- Moved database packages to optionalDependencies for lighter installation

### Fixed
- Eliminated external API dependencies for embedding generation
- Simplified deployment by removing PostgreSQL requirement
- Improved integration with VS Code and Cursor AI by using only local resources

## [3.2.3] - 2025-06-04

### Added
- New standalone mode that works without external dependencies
- Automatic fallback when MCP SDK is not available
- Zero-dependency compatibility with npx command

### Changed
- Moved @modelcontextprotocol/sdk to optionalDependencies
- Improved error handling for missing dependencies

### Fixed
- Fixed issue with npx execution when SDK is not available

## [3.2.0] - 2025-06-04

### Added
- Enhanced embedding capabilities with optimized TF-IDF algorithm
- Improved vector search performance for large memory banks
- Added new memory consolidation features

### Fixed
- Memory pruning issues with high-importance documents
- Fixed memory type detection for edge cases
- Optimized PostgreSQL queries for better performance

## [3.1.2] - 2025-06-03

### Fixed
- **Critical JSON-RPC Protocol Issue**: Removed console.error output that was contaminating JSON-RPC communication
- Fixed Zod validation errors in Cursor IDE: "Invalid literal value, expected '2.0'" for jsonrpc field
- Fixed "Required" errors for undefined id and method fields in JSON-RPC messages
- Fixed "Unrecognized key(s) in object: 'event', 'message'" errors
- Improved error handling to prevent stdout/stderr contamination in MCP protocol
- All communication now strictly follows JSON-RPC 2.0 specification

### Changed
- Replaced console.error calls with proper stderr handling to avoid protocol contamination
- Enhanced error handling in server initialization and runtime

## [3.0.3] - 2024-12-19

### Fixed
- **Critical Issue**: Implemented missing core modules that were causing tool failures
- Added complete implementation for `creative-analyzer.ts` with trade-off matrices and decision trees
- Added complete implementation for `workflow-navigator.ts` with visual workflow guidance
- Added complete implementation for `sequential-thinking.ts` with branching and revision support
- All 11 MCP tools now working correctly (100% pass rate in comprehensive testing)
- Fixed module export issues preventing proper tool functionality

### Verified
- ✅ All 11 tools tested and validated: listProjects, memoryBankWrite, listProjectFiles, memoryBankRead, memoryBankUpdate, semanticSearch, contextIntelligence, memoryAnalyzer, sequentialThinking, workflowNavigator, creativeAnalyzer
- ✅ Comprehensive test suite passes with 100% success rate
- ✅ Filesystem-only mode fully functional for development and testing

## [3.0.0] - 2023-10-25

### Added
- Vector database integration using PostgreSQL with pgvector extension
- OpenAI API integration for generating embeddings
- Semantic similarity search for memory retrieval
- Memory consolidation through automatic merging of similar content
- Dynamic importance weighting based on access patterns
- Memory pruning to maintain size limits
- New `semantic_search` tool for natural language queries

### Changed
- Complete rewrite of memory storage system using PostgreSQL
- Enhanced backward compatibility for existing file-based memories
- Improved memory metadata extraction and management
- Upgraded memory analyzer with vector-based similarity detection
- More intelligent context suggestions using embeddings

### Fixed
- Issue with circular dependency detection in memory analyzer
- Memory importance calculation for frequently accessed files

## [2.5.0] - 2023-08-15

### Added
- Enhanced workflows with visual guidance
- Context intelligence tool with AI-powered suggestions
- Memory analyzer for dependency tracking and cleanup
- Creative analyzer with trade-off matrices

### Changed
- Improved memory bank file organization
- Enhanced thinking tool with visual workflow support
- Better core file separation and organization

### Fixed
- Issue with memory file updates not persisting
- Project folder creation errors in certain environments

## [2.0.0] - 2023-06-10

### Added
- Added workflow support with modes (VAN, PLAN, CREATIVE, IMPLEMENT, QA)
- Complete rewrite based on enhanced memory patterns
- Support for memory files with different types and purposes

### Changed
- Improved file organization and structure
- Better error handling and reporting
- Enhanced documentation and guidance

### Fixed
- File path handling on different OS platforms
- Memory corruption issues with concurrent writes

## [1.0.0] - 2023-04-01

### Added
- Initial release
- Basic file-based memory bank
- Project separation
- Simple file read/write operations