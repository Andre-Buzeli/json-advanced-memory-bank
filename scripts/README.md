# 🛠️ Scripts Utilitários

Este diretório contém scripts úteis para manutenção e publicação do projeto Advanced JSON Memory Bank.

## 📄 Scripts Disponíveis

### `publish.js`
- **Função**: Script automatizado para publicação no NPM
- **Uso**: `node scripts/publish.js`
- **Recursos**: 
  - Validação de segurança antes da publicação
  - Checks automáticos de build
  - Processo otimizado para publicação

## 🎯 Como Usar

### Publicar Nova Versão
```bash
# 1. Atualizar versão no package.json
# 2. Build do projeto
npm run build

# 3. Executar script de publicação
node scripts/publish.js
```

## 📋 Manutenção

Estes scripts são mantidos separados do código principal para:
- Organização clara do projeto
- Facilitar manutenção
- Evitar confusão com código de produção
- Permitir versionamento independente

---

*Scripts organizados durante limpeza do projeto em 13/06/2025*
