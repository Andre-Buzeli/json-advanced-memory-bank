# 🚀 GUIA DE DESENVOLVIMENTO - CLI AVANÇADO
*Advanced Memory Bank MCP - Versão Modular*

## 📋 VISÃO GERAL

O Advanced Memory Bank MCP agora possui um **sistema CLI de desenvolvimento** completo para monitoramento, debugging e análise em tempo real.

---

## 🔧 COMANDOS DISPONÍVEIS

### 🌐 **Servidor de Desenvolvimento**
```bash
# Iniciar dashboard web
cd "z:\MCP\MCP v2\advanced-memory-bank-mcp"
node scripts/dev-server.js

# Acesso: http://localhost:3001
```

### 📊 **Dashboard Web Features**
- **Estatísticas em tempo real**: Cache hits/misses, backup status
- **Monitoramento de projetos**: Lista de projetos ativos
- **Performance metrics**: I/O operations, memory usage
- **Sistema de backup**: Status e histórico
- **Auto-refresh**: Atualização automática a cada 5 segundos

---

## 🌐 ENDPOINTS API

### 📍 **Dashboard Principal**
```
GET http://localhost:3001/
```
Interface web completa com:
- Overview do sistema
- Estatísticas de cache
- Status de backup
- Lista de projetos
- Métricas de performance

### 📍 **API de Estatísticas**
```
GET http://localhost:3001/api/stats
```
Retorna JSON com:
```json
{
  "cache": {
    "hits": 150,
    "misses": 25,
    "hitRate": "85.7%",
    "size": 12,
    "memoryUsage": "2.4MB"
  },
  "backup": {
    "totalBackups": 45,
    "lastBackup": "2025-06-13T20:30:15Z",
    "backupStatus": "healthy"
  },
  "projects": [
    "advanced-memory-bank-mcp",
    "my-project"
  ],
  "system": {
    "uptime": "2h 15m",
    "memoryUsage": "45.2MB"
  }
}
```

### 📍 **Forçar Refresh**
```
POST http://localhost:3001/api/refresh
```
Força atualização das estatísticas

---

## 🛠️ MÓDULOS DISPONÍVEIS

### 💾 **CacheManager**
```javascript
import { CacheManager } from './dist/core/storage/cache-manager.js';

const cache = new CacheManager();
console.log(cache.getStats());
```

### 💿 **BackupManager**
```javascript
import { BackupManager } from './dist/core/backup/backup-manager.js';

const backup = new BackupManager('./backups');
await backup.createBackup('my-project');
```

### 🔍 **ProjectDetector**
```javascript
import { ProjectDetector } from './dist/core/project/project-detector.js';

const detector = new ProjectDetector();
console.log(detector.getCurrentProjectName());
```

---

## 🎯 CASOS DE USO

### 🔍 **Monitoramento de Performance**
1. Abrir dashboard: `http://localhost:3001`
2. Verificar hit rate do cache
3. Monitorar I/O operations
4. Analisar memory usage

### 💿 **Gestão de Backups**
1. Ver status de backup no dashboard
2. Verificar último backup criado
3. Analisar total de backups por projeto
4. Monitorar sistema de limpeza automática

### 🧪 **Debugging e Desenvolvimento**
1. Usar API `/api/stats` para integração
2. Monitorar logs em tempo real
3. Testar operações via CLI
4. Analisar cache performance

### 📊 **Análise de Dados**
1. Exportar estatísticas via API
2. Monitorar tendências de uso
3. Otimizar configurações
4. Identificar gargalos

---

## ⚙️ CONFIGURAÇÃO

### 🌍 **Variáveis de Ambiente**
```bash
# Porta do servidor de desenvolvimento
DEV_PORT=3001

# Intervalo de refresh (ms)
DEV_REFRESH=5000

# Cache TTL
MEMORY_JSON_CACHE_LIFETIME=60000

# Backup settings
MEMORY_BANK_BACKUP=./backups
```

### 📁 **Estrutura de Arquivos**
```
scripts/
├── dev-server.js          # 🌐 Servidor principal
├── backup-cli.js          # 💿 Utilitários de backup (futuro)
├── cache-cli.js           # 💾 Utilitários de cache (futuro)
└── project-cli.js         # 🔍 Utilitários de projeto (futuro)
```

---

## 🚀 EXEMPLOS PRÁTICOS

### 📈 **Monitoramento Contínuo**
```bash
# Terminal 1: Iniciar servidor MCP
npm run start

# Terminal 2: Iniciar dashboard
node scripts/dev-server.js

# Terminal 3: Usar cliente MCP
# (VS Code/Cursor conectado via MCP)
```

### 🔧 **Desenvolvimento e Debug**
```bash
# 1. Compilar projeto
npm run build

# 2. Iniciar dashboard
node scripts/dev-server.js

# 3. Executar testes com monitoramento
npm test

# 4. Verificar métricas no dashboard
# http://localhost:3001
```

### 📊 **Análise de Performance**
```bash
# Coletar estatísticas
curl http://localhost:3001/api/stats > stats.json

# Analisar cache hit rate
curl http://localhost:3001/api/stats | jq '.cache.hitRate'

# Verificar status de backup
curl http://localhost:3001/api/stats | jq '.backup'
```

---

## 🎨 INTERFACE DO DASHBOARD

### 📱 **Layout Responsivo**
- Header com título e status
- Sidebar com navegação
- Cards com métricas principais
- Gráficos de performance
- Lista de projetos ativos
- Log de atividades

### 🎯 **Métricas Principais**
- **Cache Performance**: Hits, misses, hit rate
- **Backup Status**: Total, último backup, saúde
- **Memory Usage**: Sistema e cache
- **Project Activity**: Projetos ativos, último acesso
- **System Health**: Uptime, erro rate

### 🔄 **Auto-Refresh**
- Atualização automática a cada 5s
- Indicador visual de refresh
- Dados em tempo real
- Cache local para performance

---

## 🏆 BENEFÍCIOS

### 👀 **Visibilidade Total**
- Monitoramento em tempo real
- Métricas detalhadas
- Status de todos os componentes
- Histórico de atividades

### 🚀 **Produtividade**
- Debug mais rápido
- Análise visual
- APIs para integração
- Interface web moderna

### 🔒 **Confiabilidade**
- Monitoramento de saúde
- Alertas de problemas
- Status de backup
- Métricas de performance

### 📈 **Escalabilidade**
- Extensível via módulos
- APIs RESTful
- Configuração flexível
- Integração simples

---

## 🚀 PRÓXIMAS FUNCIONALIDADES

### 🔮 **Planejado**
- 📊 Gráficos históricos
- 🚨 Sistema de alertas
- 📁 Explorador de arquivos
- 🔧 CLI para backup manual
- 📝 Editor integrado
- 🧪 Modo de teste

### ⚡ **Extensões**
- Plugin system
- Custom dashboards  
- External monitoring
- Cloud integration

---

*CLI de desenvolvimento implementado com excelência técnica e foco na experiência do desenvolvedor* ✨
