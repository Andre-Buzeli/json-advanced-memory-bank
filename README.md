# Advanced Memory Bank MCP

> **v4.0.0** - Dynamic Project Detection & Memory Management

Um servidor MCP (Model Context Protocol) avançado que gerencia memórias automaticamente com detecção dinâmica de projetos IDE.

## ✨ Características Principais

- 🎯 **Detecção Automática de Projeto**: Identifica automaticamente o nome do projeto aberto no IDE
- 🧠 **Gestão Inteligente de Memória**: Armazena e recupera memórias contextualizadas por projeto
- 🔍 **Busca Avançada**: Busca por conteúdo, tags e contexto
- 📊 **Análise de Conteúdo**: Análise automática de sentimento, estrutura e palavras-chave
- 🤔 **Pensamento Sequencial**: Sistema de análise estruturada de problemas
- 🌊 **Navegação de Fluxos**: Analisa e otimiza workflows
- 🎨 **Análise Criativa**: Perspectivas criativas sobre conteúdo
- 🗂️ **Organização Dinâmica**: Sem hardcoding - memórias organizadas automaticamente por projeto

## 🚀 Instalação Rápida

```bash
npm install @andrebuzeli/advanced-json-memory-bank
```

## 📋 Configuração

### Dependências Obrigatórias
- `@modelcontextprotocol/sdk`: SDK oficial do MCP
- `node.js`: v18 ou superior

### Dependências Opcionais
- PostgreSQL com pgvector (para casos avançados)

## 🛠️ Uso

### Como Servidor MCP
```bash
npx advanced-json-memory-bank
```

### Integração com VS Code/Cursor
Adicione ao seu arquivo de configuração MCP:

```json
{
  "servers": {
    "advanced-memory-bank": {
      "command": "npx",
      "args": ["@andrebuzeli/advanced-json-memory-bank"],
      "env": {}
    }
  }
}
```

## 🔧 Ferramentas Disponíveis

### Gestão de Memória
- `store_memory`: Armazena nova memória com tags e importância
- `search_memories`: Busca memórias por conteúdo ou tags
- `get_recent_memories`: Recupera memórias recentes
- `delete_memory`: Remove memória específica
- `cleanup_memories`: Limpa memórias antigas automaticamente

### Análise e Insights
- `analyze_content`: Análise de conteúdo (resumo, palavras-chave, sentimento, estrutura)
- `sequential_thinking`: Análise estruturada de problemas
- `navigate_workflow`: Análise e otimização de workflows
- `creative_analysis`: Análise criativa de conteúdo

### Informações do Sistema
- `get_memory_stats`: Estatísticas de memórias e projeto detectado

## 💡 Detecção Dinâmica de Projeto

O sistema detecta automaticamente:

1. **Nome do Workspace VS Code/Cursor**
2. **Nome do diretório atual** (evitando pastas de usuário)
3. **Nome do package.json** (removendo scopes npm)
4. **Detecção de repositório Git**

### Estrutura de Arquivos
```
~/.advanced-memory-bank/
├── meu-projeto/
│   ├── mem-abc123.json
│   └── mem-def456.json
└── outro-projeto/
    └── mem-ghi789.json
```

## 📊 Exemplos de Uso

### Armazenar Memória
```javascript
{
  "tool": "store_memory",
  "arguments": {
    "content": "Implementei uma função de cache com LRU",
    "tags": ["cache", "performance", "typescript"],
    "importance": 8
  }
}
```

### Buscar Memórias
```javascript
{
  "tool": "search_memories",
  "arguments": {
    "query": "cache",
    "limit": 5
  }
}
```

### Análise de Conteúdo
```javascript
{
  "tool": "analyze_content",
  "arguments": {
    "content": "Código complexo aqui...",
    "analysisType": "structure"
  }
}
```

## 🔄 Desenvolvimento

### Scripts Disponíveis
```bash
npm run build    # Compila TypeScript
npm run start    # Executa servidor
npm run dev      # Compila e executa
npm run clean    # Limpa pasta dist
```

### Estrutura do Projeto
```
src/
├── core/
│   ├── memory-manager.ts      # Gestão principal de memórias
│   ├── sequential-thinking.ts # Análise sequencial
│   ├── workflow-navigator.ts  # Navegação de workflows
│   ├── creative-analyzer.ts   # Análise criativa
│   └── project/              # Detecção de projeto
├── main/
│   ├── index.ts              # Ponto de entrada
│   └── server.ts             # Servidor MCP principal
└── types/
    └── index.ts              # Definições de tipos
```

## 🔐 Segurança

- **Sandbox de Memórias**: Cada projeto tem sua pasta isolada
- **Validação de Entrada**: Todos os inputs são validados
- **Tratamento de Erros**: Gerenciamento robusto de erros
- **Limpeza Automática**: Remove memórias antigas de baixa importância

## 🐛 Solução de Problemas

### Memórias não aparecem?
- Verifique se está no diretório correto do projeto
- Confirme que o nome do projeto foi detectado corretamente com `get_memory_stats`

### Erro de permissão?
- Verifique permissões de escrita em `~/.advanced-memory-bank/`

### Falha na detecção de projeto?
- Execute em um diretório de projeto válido
- Evite pastas de usuário ou sistema

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/andrebuzeli/advanced-json-memory-bank/issues)
- **Discussões**: [GitHub Discussions](https://github.com/andrebuzeli/advanced-json-memory-bank/discussions)

---

**Criado por Andre Buzeli (@andrebuzeli)**  
*Advanced JSON Memory Bank - Memória inteligente para seus projetos*
