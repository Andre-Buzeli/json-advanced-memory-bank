# 📝 custom-instructions.md — Advanced Memory Bank MCP v3.0.0

## 📌 Objetivo
Este arquivo define as instruções customizadas para uso no campo "User Rules" do Cursor, otimizando a colaboração com o Advanced Memory Bank MCP (Model Context Protocol) v3.0.0. Esta versão revolucionária elimina a necessidade de especificar `projectName` em todas as tools, usando detecção automática baseada na pasta aberta no IDE.

---

## 1️⃣ Regras Fundamentais
1. **Sempre inicie qualquer sessão lendo as memórias do projeto** (`list_memories` - sem precisar de projectName!).
2. **Todas as operações de memória são automáticas** - nunca mais especificar projeto manualmente.
3. **O sistema detecta automaticamente** a pasta aberta no IDE como projeto ativo.
4. **Zero configuração necessária** - tudo funciona automaticamente.
5. **11 tools simplificadas** - removidas funcionalidades desnecessárias de backup e múltiplos projetos.

---

## 2️⃣ Revolução v3.0.0 - Auto-Detection
- **Detecção Automática Total**: Usa `process.cwd()` para identificar projeto atual
- **Sem Parâmetro `projectName`**: Todas as 11 tools funcionam sem especificar projeto
- **Interface Ultra Limpa**: Parâmetros reduzidos ao essencial
- **Zero Confusão**: Sem múltiplos projetos ou configurações complexas
- **Lógica Simplificada**: Removido sistema de backup automático e manual

---

## 3️⃣ Ferramentas MCP Simplificadas (11 Tools)

### 🗃️ Core Memory Tools (5)
1. **`list_memories`** - ⭐ **SEM projectName!** - Lista memórias com resumos breves
   ```json
   { "tool": "list_memories" }
   ```

2. **`memory_bank_read`** - Lê memória específica do projeto atual
   ```json
   { "fileName": "analise.md" }
   ```

3. **`memory_bank_write`** - Cria nova memória no projeto atual
   ```json
   { "fileName": "analise.md", "content": "Análise detalhada..." }
   ```

4. **`memory_bank_update`** - Atualiza memória existente (batch support)
   ```json
   { "fileName": "notas.md", "content": "novo conteúdo", "operation": "append" }
   ```

5. **`memory_bank_reset`** - Reset completo do projeto atual
   ```json
   { "createBackup": false }
   ```

### 🧠 Intelligence Tools (3)
6. **`semantic_search`** - Busca semântica no projeto atual
   ```json
   { "query": "Como resolvemos o bug de autenticação?", "limit": 5 }
   ```

7. **`context_intelligence`** - Sugestões inteligentes do projeto atual
   ```json
   { "taskDescription": "Implementar nova feature", "maxSuggestions": 5 }
   ```

8. **`memory_analyzer`** - Análise de dependências do projeto atual
   ```json
   { "analysisType": "all", "includeMetrics": true }
   ```

### ⚙️ Workflow Tools (3)
9. **`enhanced_thinking`** - Pensamento sequencial com branching
    ```json
    { "thought": "Analisando arquitetura...", "nextThoughtNeeded": true, "thoughtNumber": 1, "totalThoughts": 5 }
    ```

10. **`workflow_navigator`** - Navegação visual entre modos
    ```json
    { "currentMode": "PLAN", "targetMode": "IMPLEMENT" }
    ```

11. **`creative_analyzer`** - Análise criativa de trade-offs
    ```json
    { "component": "Database", "options": [{"name": "PostgreSQL", "pros": ["ACID"], "cons": ["Complexidade"]}], "criteria": ["Performance", "Custo"] }
    ```

---

## 4️⃣ Padrões de Uso v3.0.0

### ✅ DO (Práticas Recomendadas):
- **Use sempre as ferramentas MCP** sem especificar projectName
- **Use `list_memories` para visão geral** (primeira tool a usar sempre!)
- **Aproveite a simplicidade** - todas as tools detectam projeto automaticamente
- **Utilize batch updates** para múltiplas alterações
- **Documente decisões importantes** em arquivos de memória
- **Use `semantic_search`** para encontrar contextos anteriores
- **Aproveite `context_intelligence`** para sugestões relevantes

### ❌ DON'T (Práticas Proibidas):
- **Não especifique projectName** - não existe mais esse parâmetro!
- **Não tente configurar múltiplos projetos** - sistema usa apenas projeto atual
- **Não ignore `list_memories`** - sempre use para contexto inicial
- **Não tente fazer backup manual** - funcionalidade foi removida
- **Não edite arquivos de memória manualmente** - use sempre as MCP tools

---

## 5️⃣ Exemplos Práticos v3.0.0

### 📖 Início de Sessão (Sempre):
```json
// 1. Ver todas as memórias ⭐ MUITO MAIS SIMPLES!
{ "tool": "list_memories" }

// 2. Ler memória específica se necessário
{ "tool": "memory_bank_read", "arguments": { "fileName": "summary.md" } }

// 3. Buscar contexto relevante
{ "tool": "context_intelligence", "arguments": { "taskDescription": "Implementar nova feature" } }
```

### 🔍 Busca e Análise:
```json
// Buscar decisões anteriores
{ "tool": "semantic_search", "arguments": { "query": "Como implementamos autenticação?" } }

// Analisar dependências
{ "tool": "memory_analyzer", "arguments": { "analysisType": "all" } }

// Pensamento estruturado
{ "tool": "enhanced_thinking", "arguments": { "thought": "Preciso analisar as opções de banco de dados...", "nextThoughtNeeded": true, "thoughtNumber": 1, "totalThoughts": 3 } }
```

### 💾 Criação e Atualização:
```json
// Criar nova memória
{ "tool": "memory_bank_write", "arguments": { "fileName": "nova-funcionalidade.md", "content": "Documentação da nova feature..." } }

// Batch update para múltiplas alterações
{ "tool": "memory_bank_update", "arguments": { 
  "updates": [
    { "fileName": "status.md", "content": "Em desenvolvimento", "operation": "update" },
    { "fileName": "notas.md", "content": "Nova funcionalidade implementada", "operation": "append" }
  ] 
}}
```

### 🎨 Análise Criativa:
```json
// Análise de trade-offs
{ "tool": "creative_analyzer", "arguments": {
  "component": "Frontend Framework",
  "options": [
    { "name": "React", "pros": ["Ecosistema maduro"], "cons": ["Curva de aprendizado"] },
    { "name": "Vue", "pros": ["Simplicidade"], "cons": ["Ecosistema menor"] }
  ],
  "criteria": ["Performance", "Produtividade"]
}}
```

---

## 6️⃣ Benefícios da Simplificação v3.0.0

### 🎯 Zero Configuração:
- **Nunca mais especificar projectName**
- **Detecção automática da pasta do IDE**
- **Interface ultra limpa**
- **Parâmetros reduzidos ao essencial**

### ⚡ Performance Otimizada:
- **11 tools vs 14** (removidas as desnecessárias)
- **Sistema mais rápido** sem lógica de backup
- **Menos complexidade** = mais velocidade
- **Foco no essencial** = melhor UX

### 🧹 Interface Limpa:
- **Sem confusion de múltiplos projetos**
- **Sem parâmetros desnecessários**
- **Sem funcionalidades de backup**
- **Foco na simplicidade absoluta**

---

## 7️⃣ Workflow e Modos (Simplificados)
- **5 modos principais**: VAN → PLAN → CREATIVE → IMPLEMENT → QA
- **Sem especificação de projeto**: Todas as tools usam projeto atual automaticamente
- **Transições automáticas**: Workflow detecta contexto automaticamente
- **Documentação simples**: Registre apenas em arquivos de memória essenciais

---

## 8️⃣ Integração com VS Code / Cursor
```json
{
  "mcpServers": {
    "advanced-memory-bank": {
      "command": "npx",
      "args": ["-y", "@andrebuzeli/advanced-json-memory-bank"],
      "env": {
        "MEMORY_BANK_ROOT": "/path/to/memory/folder"
      }
    }
  }
}
```

- **Zero configuração adicional**: Apenas especifique o diretório raiz
- **Detecção automática**: Sistema identifica projeto pela pasta aberta
- **11 tools prontas**: Todas funcionam sem configuração

---

## 9️⃣ Comparação de Versões

### v2.1.0 (Anterior):
```json
{ "tool": "list_memories", "arguments": { "projectName": "meu-projeto" } }
{ "tool": "memory_bank_write", "arguments": { "projectName": "meu-projeto", "fileName": "nota.md", "content": "..." } }
```

### v3.0.0 (Atual - MUITO MAIS SIMPLES!):
```json
{ "tool": "list_memories" }
{ "tool": "memory_bank_write", "arguments": { "fileName": "nota.md", "content": "..." } }
```

---

## 🔟 Troubleshooting v3.0.0

### 🔧 Problemas Comuns:
- **Projeto não detectado**: Verifique se está na pasta correta no IDE
- **Memórias não encontradas**: Use `list_memories` para ver o que existe
- **Tools não funcionam**: Certifique-se de não passar `projectName`

### 🛠️ Comandos de Verificação:
```json
// Verificar memórias disponíveis
{ "tool": "list_memories" }

// Analisar projeto atual
{ "tool": "memory_analyzer", "arguments": { "analysisType": "all" } }

// Reset se necessário (sem backup)
{ "tool": "memory_bank_reset", "arguments": { "createBackup": false } }
```

---

## 1️⃣1️⃣ Resumo das Mudanças v3.0.0

### ❌ REMOVIDO:
- ❌ Parâmetro `projectName` de TODAS as tools
- ❌ Tool `list_projects` (desnecessária)
- ❌ Tool `backup_memory` (manual e automático)
- ❌ Tool `optimize_json_memory` (automático agora)
- ❌ Lógica de backup automático
- ❌ Configuração de múltiplos projetos

### ✅ MANTIDO/MELHORADO:
- ✅ 11 tools essenciais e simplificadas
- ✅ Detecção automática de projeto via `process.cwd()`
- ✅ Interface ultra limpa
- ✅ Performance otimizada
- ✅ Zero configuração necessária

---

## 🚀 REVOLUÇÃO v3.0.0 - AUTO-DETECTION

### 🎯 Filosofia da Simplicidade:
- **Uma pasta, um projeto**: Sempre usa a pasta aberta no IDE
- **Zero configuração**: Tudo funciona automaticamente
- **Interface limpa**: Parâmetros reduzidos ao essencial
- **Foco no que importa**: Memória e produtividade

### 📋 Como Usar (Super Simples):
1. Abra uma pasta no IDE
2. Use qualquer tool sem especificar projeto
3. O sistema detecta automaticamente
4. Pronto! 🎉

---

*Advanced Memory Bank MCP v3.0.0 - Auto-Project Detection - Zero Configuration Revolution*