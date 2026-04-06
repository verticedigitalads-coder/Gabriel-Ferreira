# CRM — Contexto do Sistema

## Stack

- Frontend: React + Zustand (slices modulares)
- Backend: Node.js (Express)
- Persistence: Supabase (PostgreSQL + Realtime)
- PDF: Puppeteer + templates HTML
- Ambiente: Windows 10, Node.js 22

## Arquitetura

- `/src/components` → UI puro, sem lógica de negócio
- `/src/store` → Zustand slices (um por domínio)
- `/src/services` → integrações externas e chamadas API
- `/backend` → rotas e controladores Node.js

## Regras Absolutas

1. NUNCA quebrar funcionalidade existente
2. NUNCA duplicar lógica — reutilize o que existe
3. Mudanças devem ser mínimas e incrementais
4. Siga os padrões já estabelecidos no código
5. Prefira solução simples sobre solução elegante
6. Código sempre completo — nunca use "..." ou "resto do código"
7. Sempre indicar arquivo + localização exata da mudança

## Estado Atual

- Sistema funcional em desenvolvimento ativo
- Evoluindo para SaaS/ERP comercializável
- Clientes reais em uso

## Padrão de Resposta

1. Diagnóstico (1–3 linhas)
2. Plano de ação (steps numerados)
3. Código completo (copy/paste ready)
4. Arquivo + localização exata

## Áreas Críticas — Máximo Cuidado

### 🔴 NÃO TOCAR SEM PLANO COMPLETO

- `src/store/useStore.ts` — afeta 100% dos componentes
- `backend/server.js` — geração de PDF, falha silenciosa
- `src/store/slices/leadSlice.ts` — automações encadeadas

### 🟠 CUIDADO ELEVADO

- `src/store/selectors/dashboardSelectors.ts` — 18+ métricas, quebra silenciosa
- `src/services/iaService.ts` — lógica de risco baseada em datas
- `src/modules/leads/LeadDetail.tsx` — componente monolítico (444 linhas)

### ⚠️ INCONSISTÊNCIAS CONHECIDAS (não introduzir novas)

- Conversão snake→camel inconsistente entre slices
- Lógica de cálculo de orçamento duplicada em 3 locais
- Histórico usa strings hardcoded em vez de enum
- syncService.ts (IndexedDB) — offline não implementado

### Regra de Ouro

Antes de modificar qualquer arquivo 🔴 ou 🟠:

1. Leia o arquivo completo primeiro
2. Mapeie todos os consumidores (@mention no Claude)
3. Defina o plano antes de escrever código
