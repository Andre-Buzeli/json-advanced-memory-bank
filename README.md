# Advanced Memory Bank MCP v3.0.0 - Auto-Project Detection

Uma sistema de memória inteligente com detecção automática de projeto para assistentes IA, implementando o Model Context Protocol (MCP). Esta versão revolucionária elimina a necessidade de configuração manual de projetos e oferece 11 tools simplificadas.

## 🚀 Novidades v3.0.0 - Auto-Project Detection

- **🎯 Zero Configuração**: Nunca mais precisar passar `projectName` - detecção automática total
- **✅ 11 Tools Simplificadas**: Removidas funcionalidades desnecessárias de backup e múltiplos projetos
- **🔍 Detecção Inteligente**: Sempre usa a pasta aberta no IDE automaticamente
- **🧹 Interface Ultra Limpa**: Sem parâmetros confusos, foco na simplicidade absoluta
- **⚡ Performance Otimizada**: Sistema mais rápido e direto sem lógica desnecessária

## 🛠️ 11 Tools Disponíveis

### 🗃️ Core Memory Tools (5)

1. **`list_memories`** - Lista memórias com resumos breves (sem projectName!)
2. **`memory_bank_read`** - Lê memória específica do projeto atual
3. **`memory_bank_write`** - Cria nova memória no projeto atual
4. **`memory_bank_update`** - Atualiza memória (batch support, projeto atual)
5. **`memory_bank_reset`** - Reset completo do projeto atual

### 🧠 Intelligence Tools (3)

1. **`semantic_search`** - Busca semântica inteligente no projeto atual
2. **`context_intelligence`** - Sugestões contextuais do projeto atual
3. **`memory_analyzer`** - Análise de dependências do projeto atual

### ⚙️ Workflow Tools (3)

1. **`enhanced_thinking`** - Pensamento sequencial
2. **`workflow_navigator`** - Navegação de modos
3. **`creative_analyzer`** - Análise criativa

## 📋 Requirements

- Node.js 18+ (ECMAScript modules support)
- Nothing else! (PostgreSQL and OpenAI are completely optional)

## 🆕 Standalone Mode (v3.0.0+)

The Advanced Memory Bank MCP now features auto-detection mode that automatically uses the current IDE workspace folder:

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

In v3.0.0:
- **Zero configuration** - automatically detects project from IDE workspace
- **11 simplified tools** - removed unnecessary backup and multi-project features
- **Clean interface** - no more projectName parameter needed
- **Smart detection** - always uses current folder opened in IDE

## 🔧 Instalação

### Instalação Simples (Zero Configuração)

```bash
# Instalação via NPM
npm install @andrebuzeli/advanced-json-memory-bank

# Ou use diretamente com npx
npx @andrebuzeli/advanced-json-memory-bank
```

### Configuração no VS Code/Cursor

Adicione ao seu `settings.json`:

```json
{
  "mcpServers": {
    "advanced-memory-bank": {
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
}
```

## ⭐ Exemplo de Uso - Simplicidade Total v3.0.0

A nova abordagem elimina completamente a necessidade de especificar projeto:

```json
{
  "tool": "list_memories"
}
```

**Resultado automático do projeto atual:**

```
# 📋 Memories: advanced-memory-bank-mcp

**Total:** 5 memories

1. **configuracao-inicial** - Setup do projeto com Node.js e dependências básicas
2. **implementacao-api** - Desenvolvimento da API REST com autenticação JWT
3. **testes-unitarios** - Criação de testes para validação das funções principais
4. **deploy-producao** - Deploy no Heroku com configuração de variáveis de ambiente
5. **bugs-resolvidos** - Lista de bugs encontrados e suas respectivas correções

---
*Updated: 2025-06-16*
```

### Todas as Tools São Assim Agora

```json
// Antes (v2.1.0)
{"tool": "memory_bank_write", "arguments": {"projectName": "meu-projeto", "fileName": "nota.md", "content": "..."}}

// Agora (v3.0.0) - MUITO MAIS SIMPLES!
{"tool": "memory_bank_write", "arguments": {"fileName": "nota.md", "content": "..."}}
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

## 🔍 Usage Examples

### Semantic Search (v3.0.0 - No projectName needed!)

```javascript
{
  "query": "How did we resolve the authentication issue?",
  "limit": 5,
  "similarityThreshold": 0.7
}
```

### Context Intelligence (v3.0.0)

```javascript
{
  "taskDescription": "Implement JWT authentication",
  "currentContext": "Working on the backend API",
  "maxSuggestions": 5
}
```

### Memory Analysis (v3.0.0)

```javascript
{
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

## 📈 Benefícios da v3.0.0

- ✅ **Zero Configuração**: Nunca mais especificar `projectName`
- ✅ **Menos Tools**: 11 vs 14 (removidas as desnecessárias)
- ✅ **Mais Confiável**: Sempre usa a pasta do IDE atual
- ✅ **Interface Mais Limpa**: Parâmetros simplificados
- ✅ **Performance**: Sistema mais rápido e direto

---

Esta versão representa a evolução definitiva do Advanced Memory Bank MCP, focando na simplicidade absoluta e zero configuração manual.

## 📝 License

MIT License - See LICENSE file for details