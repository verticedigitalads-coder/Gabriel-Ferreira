# CRM Vértice Digital — Contexto do Sistema

## Stack

- Frontend: React 19 + TypeScript + Zustand (slices modulares) + Vite + Tailwind
- Backend: Node.js (Express) — server.js único
- Persistência: Supabase (PostgreSQL + Realtime + RLS multi-tenant)
- PDF: Puppeteer + templates HTML (v1 legado + v2 profissional)
- PWA: vite-plugin-pwa + Workbox
- Deploy: Frontend Vercel | Backend produção: VPS Hetzner (178.104.236.222), `/opt/crm-backend`, PM2 (processo `crm-backend`) + Nginx reverse proxy (80→3001) → `https://api.vrtxcrm.com.br`. Deploy: SSH na VPS → `git pull origin main && pm2 restart crm-backend`. Dev local: `localhost:3001` (ngrok não é mais necessário)
- Ambiente: Windows 10, Node.js 22

## Arquitetura

- `src/components/` → UI puro, sem lógica de negócio
- `src/modules/` → módulos da aplicação (dashboard, leads, orcamentos, etc.)
- `src/store/` → Zustand slices (um por domínio) + formatters.ts centralizado
- `src/store/selectors/` → selectors derivados (dashboardSelectors)
- `src/hooks/` → hooks customizados (useDefaultSettings, useNotifications, useLeadActions)
- `src/domain/` → lógica de negócio pura (calcularOrcamento)
- `src/types/` → tipos TypeScript centrais
- `src/services/` → integrações externas
- `src/styles/tokens.css` → design tokens CSS (variáveis de cor, espaçamento, etc.)
- `server.js` → backend Express (PDF, CNPJ, PIX, admin, OpenAI)
- `templates/` → templates HTML para PDFs (orcamento v1/v2, recibo v1/v2)
- `utils/` → utilitários backend (pixPayload.js)

## Multi-Tenant

- Isolamento por workspace_id em TODAS as tabelas
- RLS Supabase: 14 tabelas, cada uma com 1 policy filtrada
- Workspaces ativos: FL Art Metal, GPP Móveis Planejados, Teste
- Settings por workspace via workspace_settings (key-value)

## Regras Absolutas

1. NUNCA quebrar funcionalidade existente
2. NUNCA duplicar lógica — reutilize o que existe
3. Mudanças devem ser mínimas e incrementais
4. Siga os padrões já estabelecidos no código
5. Prefira solução simples sobre solução elegante
6. Código sempre completo — nunca use "..." ou "resto do código"
7. Sempre indicar arquivo + localização exata da mudança
8. SEMPRE usar CSS vars de tokens.css — nunca Tailwind hardcoded
9. Touch targets mínimo 44px (mobile-first)
10. Snake_case no banco → camelCase no frontend (via src/store/formatters.ts)
11. Sanitizar TODA interpolação de dados do usuário em templates HTML (escapeHtml)

## Padrão de Resposta

1. Diagnóstico (1–3 linhas)
2. Plano de ação (steps numerados)
3. Código completo (copy/paste ready)
4. Arquivo + localização exata
5. Atualizar _build/current-state.md ao finalizar

## Áreas Críticas — Máximo Cuidado

### 🔴 NÃO TOCAR SEM PLANO COMPLETO

- `src/store/useStore.ts` — afeta 100% dos componentes, realtime channels
- `server.js` — geração de PDF, sanitização, rotas admin
- `src/store/slices/leadSlice.ts` — automações encadeadas

### 🟡 CUIDADO ELEVADO

- `src/store/selectors/dashboardSelectors.ts` — 18+ métricas
- `src/modules/ia/iaService.ts` — lógica de risco, valorOrcado nullable
- `src/modules/leads/LeadDetail.tsx` — componente grande
- `templates/orcamento-v2.html` e `recibo-v2.html` — espaçamentos sensíveis

### Regra de Ouro

Antes de modificar qualquer arquivo 🔴:

1. Leia o arquivo completo primeiro
2. Mapeie todos os consumidores
3. Defina o plano antes de escrever código

### Referências

- `_build/current-state.md` — estado atual do projeto
- `_build/decisions.md` — decisões arquiteturais
- `_build/mistakes.md` — erros que custaram tempo
- `_build/patterns.md` — padrões reutilizáveis
