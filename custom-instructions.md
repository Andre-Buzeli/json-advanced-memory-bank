# 📝 custom-instructions.md — Advanced Memory Bank MCP v2.1.0

## 📌 Objetivo
Este arquivo define as instruções customizadas para uso no campo "User Rules" do Cursor, otimizando a colaboração com o Advanced Memory Bank MCP (Model Context Protocol). Ele detalha a organização da memória, uso das 14 MCP tools otimizadas, padrões de workflow, melhores práticas e exemplos práticos para garantir máxima eficiência e contexto para o assistente de IA.

---

## 1️⃣ Regras Fundamentais
1. **Sempre inicie qualquer sessão lendo as memórias do projeto** (`list_memories` para visão geral com resumos).
2. **Todas as operações de memória devem ser feitas via MCP tools** (nunca manipule arquivos manualmente).
3. **Mantenha a estrutura JSON unificada**: cada projeto deve ter um arquivo JSON principal para memória estruturada.
4. **Backup automático e manual**: utilize `backup_memory` para garantir segurança dos dados.
5. **Nunca misture memórias de projetos diferentes**: mantenha o isolamento e a integridade do contexto.
6. **Use o CLI Dashboard quando disponível**: acesse `http://localhost:3001` para monitoramento em tempo real.

---

## 2️⃣ Organização da Memória
- **Memória centralizada por projeto**: Cada projeto possui um diretório dedicado e arquivos de memória (análises, status, decisões, etc.).
- **Memórias dinâmicas**: Criadas conforme necessidade (análises, decisões criativas, logs de workflow, QA, templates de implementação, etc.).
- **Templates**: Utilize os templates em `config/templates/` para decisões criativas, implementação e QA, adaptando o nível de complexidade conforme o contexto.
- **Consolidação automática**: Memórias similares são fundidas automaticamente pelo sistema.
- **Pruning inteligente**: Memórias menos relevantes são removidas quando necessário, preservando as essenciais.
- **Backup**: O sistema realiza backups automáticos a cada 10 minutos com cooldown de 2 minutos entre backups e permite backups manuais via tool.
- **Cache inteligente**: Sistema LRU que reduz operações I/O em 70% com TTL configurável.

---

## 3️⃣ Ferramentas MCP Otimizadas (14 Tools)

### 🗃️ Core Memory Tools (6)
1. **`list_projects`** - Lista todos os projetos disponíveis no memory bank
   ```json
   { "tool": "list_projects" }
   ```

2. **`list_memories`** - ⭐ **NOVA/OTIMIZADA** - Lista todas as memórias com resumos breves e diretos
   ```json
   { "projectName": "meu-projeto" }
   ```

3. **`memory_bank_read`** - Lê conteúdo de um arquivo de memória específico
   ```json
   { "projectName": "meu-projeto", "fileName": "analise.md" }
   ```

4. **`memory_bank_write`** - Cria novo arquivo de memória
   ```json
   { "projectName": "meu-projeto", "fileName": "analise.md", "content": "Análise detalhada..." }
   ```

5. **`memory_bank_update`** - Atualiza arquivo existente (suporte batch e operações avançadas)
   ```json
   { "projectName": "meu-projeto", "fileName": "notas.md", "content": "novo conteúdo", "operation": "append" }
   ```

6. **`memory_bank_reset`** - Reset completo de projeto (deleta todos os arquivos)
   ```json
   { "projectName": "meu-projeto", "createBackup": true }
   ```

### 🧠 Intelligence Tools (3)
7. **`semantic_search`** - Busca semântica por similaridade usando embeddings nativos
   ```json
   { "projectName": "meu-projeto", "query": "Como resolvemos o bug de autenticação?", "limit": 5 }
   ```

8. **`context_intelligence`** - Sugestões inteligentes de arquivos relevantes para a tarefa atual
   ```json
   { "taskDescription": "Implementar nova feature", "projectName": "meu-projeto", "maxSuggestions": 5 }
   ```

9. **`memory_analyzer`** - Análise de dependências, órfãos e sugestões de limpeza
   ```json
   { "projectName": "meu-projeto", "analysisType": "all", "includeMetrics": true }
   ```

### ⚙️ Workflow Tools (3)
10. **`enhanced_thinking`** - Pensamento sequencial com branching e revisão
    ```json
    { "thought": "Analisando arquitetura...", "nextThoughtNeeded": true, "thoughtNumber": 1, "totalThoughts": 5 }
    ```

11. **`workflow_navigator`** - Navegação visual entre modos de desenvolvimento
    ```json
    { "currentMode": "PLAN", "targetMode": "IMPLEMENT", "projectName": "meu-projeto" }
    ```

12. **`creative_analyzer`** - Análise criativa de trade-offs com matrizes de decisão
    ```json
    { "component": "Database", "options": [{"name": "PostgreSQL", "pros": ["ACID"], "cons": ["Complexidade"]}], "criteria": ["Performance", "Custo"], "projectName": "meu-projeto" }
    ```

### 🔄 Advanced Tools (2)
13. **`backup_memory`** - Backup manual de todos os projetos
    ```json
    { "customBackupDir": "./backups" }
    ```

14. **`optimize_json_memory`** - Otimização do arquivo JSON de memória
    ```json
    { "projectName": "meu-projeto", "options": { "removeEmpty": true, "deduplicate": true } }
    ```

---

## 4️⃣ Workflow e Modos de Operação
- **5 modos principais**: VAN → PLAN → CREATIVE → IMPLEMENT → QA
- **Transições visuais**: Use diagramas Mermaid para mapear mudanças de modo e dependências
- **Complexidade**: 4 níveis suportados (1 a 4) — escolha templates adequados ao nível
- **Context Guidance**: Sempre consulte o modo atual antes de sugerir ações ou decisões
- **Documentação de workflow**: Registre transições, decisões e aprendizados em arquivos de memória específicos
- **CLI Dashboard**: Monitore métricas em tempo real via `http://localhost:3001`

---

## 5️⃣ Padrões de Uso e Melhores Práticas

### ✅ DO (Práticas Recomendadas):
- **Use sempre as ferramentas MCP** para operações de memória
- **Use `list_memories` para visão geral** com resumos breves das memórias
- **Utilize batch updates** para múltiplas alterações
- **Mantenha backups regulares** (automático + manual quando necessário)
- **Documente decisões importantes** em arquivos de memória usando templates
- **Use `semantic_search`** para encontrar decisões e contextos anteriores
- **Aproveite `context_intelligence`** para sugestões de arquivos relevantes
- **Utilize `memory_analyzer`** para manter o projeto organizado
- **Use `enhanced_thinking`** para decisões complexas com múltiplos passos
- **Monitore performance** via CLI dashboard quando disponível
- **Aproveite o cache LRU** que reduz I/O em 70%

### ❌ DON'T (Práticas Proibidas):
- **Não edite arquivos de memória manualmente** — use sempre as MCP tools
- **Não ignore a listagem de memórias** — use `list_memories` para contexto inicial
- **Não misture memórias de projetos diferentes** — mantenha isolamento
- **Não apague arquivos core sem backup** — use `backup_memory` primeiro
- **Não ignore sugestões do `context_intelligence`** — são baseadas em análise semântica
- **Não faça múltiplos backups em sequência** — respeite o cooldown de 2 minutos
- **Não negligencie a limpeza** — use `memory_analyzer` regularmente

---

## 6️⃣ Exemplos Práticos de Uso

### 📖 Início de Sessão (Sempre):
```json
// 1. Listar projetos disponíveis
{ "tool": "list_projects" }

// 2. Ver todas as memórias com resumos breves ⭐ NOVA ABORDAGEM
{ "tool": "list_memories", "arguments": { "projectName": "meu-projeto" } }
{ "tool": "memory_bank_read", "arguments": { "projectName": "meu-projeto", "fileName": "summary.md" } }

// 3. Buscar contexto relevante
{ "tool": "context_intelligence", "arguments": { "taskDescription": "Implementar nova feature", "projectName": "meu-projeto" } }
```

### 🔍 Busca e Análise:
```json
// Buscar decisões anteriores
{ "tool": "semantic_search", "arguments": { "projectName": "meu-projeto", "query": "Como implementamos autenticação?" } }

// Analisar dependências e órfãos
{ "tool": "memory_analyzer", "arguments": { "projectName": "meu-projeto", "analysisType": "all" } }

// Pensamento estruturado para decisões complexas
{ "tool": "enhanced_thinking", "arguments": { "thought": "Preciso analisar as opções de banco de dados...", "nextThoughtNeeded": true, "thoughtNumber": 1, "totalThoughts": 3 } }
```

### 💾 Atualizações e Backup:
```json
// Listar memórias com resumos breves (nova abordagem principal) ⭐
{ "tool": "list_memories", "arguments": { "projectName": "meu-projeto" } }

// Backup manual antes de mudanças importantes
{ "tool": "backup_memory", "arguments": { "customBackupDir": "./backups/pre-refactor" } }

// Batch update para múltiplas alterações
{ "tool": "memory_bank_update", "arguments": { "projectName": "meu-projeto", "updates": [
  { "fileName": "status.md", "content": "Em desenvolvimento", "operation": "update" },
  { "fileName": "notas.md", "content": "Nova funcionalidade implementada", "operation": "append" }
] } }
```

### 🎨 Análise Criativa:
```json
// Análise de trade-offs para decisões técnicas
{ "tool": "creative_analyzer", "arguments": {
  "component": "Frontend Framework",
  "options": [
    { "name": "React", "pros": ["Ecosistema maduro", "Performance"], "cons": ["Curva de aprendizado"] },
    { "name": "Vue", "pros": ["Simplicidade", "Documentação"], "cons": ["Ecosistema menor"] }
  ],
  "criteria": ["Performance", "Produtividade", "Manutenibilidade"],
  "projectName": "meu-projeto"
} }
```

---

## 7️⃣ Estrutura JSON de Memória
```json
{
  "project": "meu-projeto",
  "summary": "Visão geral do projeto...",
  "memories": {
    "summary.md": "Resumo executivo do projeto...",
    "analise-arquitetura.md": "Análise detalhada da arquitetura...",
    "decisoes-tecnicas.md": "Log de decisões técnicas tomadas..."
  },
  "workflow": {
    "mode": "IMPLEMENT",
    "complexity": 3,
    "lastTransition": "2025-06-14T10:30:00Z"
  },
  "metadata": {
    "lastUpdated": "2025-06-15T10:30:00Z",
    "totalMemories": 12,
    "backupEnabled": true,
    "cacheHitRate": 0.73
  }
}
```

---

## 8️⃣ CLI Development Dashboard

### 🖥️ Acesso e Funcionalidades:
- **URL**: `http://localhost:3001`
- **Comando**: `npm run dev` ou `node scripts/dev-server.js`
- **Features**:
  - Métricas de cache em tempo real
  - Estatísticas de backup
  - Monitoramento de projetos
  - APIs REST para integração

### 📊 Endpoints Disponíveis:
- `/` - Dashboard principal
- `/api/stats` - Estatísticas JSON
- `/api/refresh` - Forçar atualização de dados

---

## 9️⃣ Integração com VS Code / Cursor
- Configure o MCP server no settings.json do Cursor/VS Code conforme README
- Use variáveis de ambiente: `MEMORY_BANK_ROOT`, `MEMORY_BANK_BACKUP`
- Sempre habilite backup automático
- Utilize o campo User Rules para inserir este arquivo e garantir que o assistente siga as práticas do projeto
- Aproveite o cache LRU para performance otimizada
- Use o CLI dashboard para monitoramento durante desenvolvimento

---

## 🔟 Performance e Otimização

### ⚡ Cache Inteligente:
- **LRU Cache**: Reduz I/O em 70%
- **TTL Configurável**: Entries expiram automaticamente
- **Hit/Miss Stats**: Métricas via CLI dashboard
- **Memory Limit**: Controle de uso de memória

### 💾 Backup Inteligente:
- **Cooldown**: 2 minutos entre backups automáticos
- **Limpeza Automática**: Máximo 25 backups por projeto
- **Validação**: Verificação de integridade
- **Estrutura Organizada**: Backups agrupados por projeto

### 🔍 Detecção Automática:
- **Nome do Projeto**: Detectado via `process.cwd()`
- **Sanitização**: Remove caracteres inválidos
- **Override Manual**: Permite nome customizado
- **Fallback**: Nome padrão se detecção falhar

---

## 1️⃣1️⃣ Troubleshooting Avançado

### 🔧 Problemas Comuns:
- **Cache Miss Alto**: Verifique TTL e patterns de acesso
- **Backup Excessivo**: Respeite cooldown de 2 minutos
- **Memória Alta**: Use `optimize_json_memory` regularmente
- **Órfãos**: Execute `memory_analyzer` para limpeza

### 🛠️ Comandos de Manutenção:
```json
// Otimizar memória JSON
{ "tool": "optimize_json_memory", "arguments": { "projectName": "meu-projeto" } }

// Análise completa do projeto
{ "tool": "memory_analyzer", "arguments": { "projectName": "meu-projeto", "analysisType": "all" } }

// Reset com backup de segurança
{ "tool": "backup_memory", "arguments": {} }
{ "tool": "memory_bank_reset", "arguments": { "projectName": "meu-projeto", "createBackup": true } }
```

---

## 1️⃣2️⃣ Referências e Templates
- Consulte sempre `list_memories` para visão geral do projeto
- Use templates de memória em `config/templates/` (creative, implementation, QA)
- Exemplos de uso das 14 tools otimizadas estão documentados no README
- Consulte a análise completa do codebase para entender arquitetura e padrões
- Use o CLI dashboard para métricas em tempo real
- Consulte memórias de modularização para entender arquitetura avançada

---

## 1️⃣3️⃣ Atualização e Evolução
- Revise e atualize este arquivo conforme o projeto evoluir
- Adapte as regras para novos modos, ferramentas ou workflows
- Incorpore feedback da equipe e da IA para melhoria contínua
- Monitore performance via CLI dashboard
- Use métricas de cache para otimizações

---

## 🚀 NOVIDADES v2.1.0 - SISTEMA OTIMIZADO

### ✅ Melhorias Principais:
- **14 tools otimizadas** (removidas 2 tools desnecessárias)
- **`list_memories` aprimorada** com resumos breves automáticos
- **Interface mais limpa** sem informações desnecessárias
- **Resumos inteligentes** extraídos automaticamente
- **Sistema mais direto** e focado na qualidade

### 🎯 Foco na Simplicidade:
- Menos tools, mais qualidade
- Resumos breves e diretos
- Interface limpa sem "baboseira"
- Funcionalidade otimizada

### 📋 Exemplos da Nova `list_memories`:
```
# 📋 Memories: advanced-memory-bank-mcp

**Total:** 13 memories

1. **analise-memoria-calibrador-melhorias-mcp** - 🔧 ANÁLISE E MELHORIAS DO MCP SERVER
2. **conclusao-final-sistema-universal** - 🎉 CONCLUSÃO: ADVANCED MEMORY BANK MCP - SISTEMA UNIVERSAL COMPLETO
3. **implementacao-melhorias-mcp-progresso** - 🚀 IMPLEMENTAÇÃO DAS MELHORIAS DO MCP - CONCLUSÃO FINAL
4. **publicacao-versao-2.1.0-otimizada** - 🚀 PUBLICAÇÃO VERSÃO 2.1.0 - SISTEMA OTIMIZADO E SIMPLIFICADO
5. **simplificacao-sistema-tools-otimizadas** - 🎯 SIMPLIFICAÇÃO COMPLETA DO SISTEMA - TOOLS OTIMIZADAS

---
*Updated: 2025-06-16*
```

---

*Advanced Memory Bank MCP v2.1.0 - Sistema Otimizado com 14 Tools Focadas na Qualidade*