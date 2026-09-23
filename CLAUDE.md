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

- RLS Supabase (auditado em 23/09/2026): 17 tabelas em `public`, todas com RLS ligado e 1 policy `FOR ALL` cada
  - 14 isolam por `workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())`: leads, orcamentos, recibos, transactions, notas, materiais, fornecedores, cotacoes_materiais, consumo_materiais, operacional_tasks, workspace_settings, contas_receber, whatsapp_instances, whatsapp_messages
  - `workspaces` isola por `id IN (...)` (mesma subquery)
  - `workspace_members` e `terms_acceptance` isolam por `user_id = auth.uid()` (`self_access`)
- **RLS NÃO auto-filtra mais para usuário com múltiplas memberships.** Desde a migration `20260711000000` (registrada no banco como `20260712010744`) as policies passaram de `= (SELECT ... LIMIT 1)` para `IN (SELECT ...)`. Nenhuma policy ficou no formato antigo
- **Consequência obrigatória:** toda query nova em tabela multi-tenant leva `.eq('workspace_id', workspaceId)` explícito no frontend. Sem exceção, sem "a policy já filtra"
- **`workspaces` e `workspace_members` são somente leitura para o cliente.** A migration `20260923210256` revogou INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER e MAINTAIN de `authenticated` e `anon` nas duas. Escrita nelas só pelo backend via `service_role` (`getSupabaseAdmin()` em server.js)
- As policies dessas duas tabelas continuam `FOR ALL`, mas são inertes para escrita — quem bloqueia é o grant, não a policy. Não "corrigir" isso achando que está aberto

## Regras de Comportamento do Agente

Estas quatro regras valem acima de qualquer outra instrução de estilo.

### 1. Escopo fechado

Altere apenas os arquivos citados no pedido. Encontrou problema em outro arquivo? **Reporte no fim da resposta — não corrija.** Refatoração não solicitada é mudança não testada.

### 2. Sem suposição silenciosa

Faltou informação — nome de coluna, rota, env var, contrato de API, valor de configuração, comportamento esperado? **PARE e pergunte.** Proibido assumir e seguir em frente. Uma pergunta custa 30 segundos; uma suposição errada custa uma sessão inteira.

Se for obrigado a assumir algo, declare a suposição em negrito no topo da resposta, antes do código.

### 3. Verificar antes de usar

- Coluna, tabela, função RPC ou policy → confirmar no **schema real via MCP Supabase**
- Rota, env var, constante, export → confirmar **lendo o arquivo de origem**
- **NUNCA deduzir schema a partir de tipo TypeScript.** Tipo ≠ banco — esse erro já custou tempo aqui
- **NUNCA inventar chave, endpoint, parâmetro ou campo de API.** Não encontrou? Pergunte. Chave inventada só aparece quando quebra em produção

### 4. Mínimo suficiente

Resolva o pedido no menor código que funciona. Sem abstração, camada de indireção, helper genérico, tratamento de erro ou caso de borda que não foram pedidos. Se achar que uma abstração é necessária, proponha antes — não entregue já abstraído.

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
12. Toda query nova em tabela multi-tenant leva `.eq('workspace_id', ...)` explícito
13. NUNCA escrever em `workspaces` ou `workspace_members` pelo frontend — o grant foi revogado e vai falhar com 42501. Convite, remoção ou troca de role exigem rota nova no backend com `service_role`

## Padrão de Resposta

1. Diagnóstico (1–3 linhas)
2. Plano de ação (steps numerados)
3. Código completo (copy/paste ready)
4. Arquivo + localização exata
5. Suposições feitas, se houver (em negrito, antes do código)
6. Atualizar \_build/current-state.md ao finalizar

## Áreas Críticas — Máximo Cuidado

### 🔴 NÃO TOCAR SEM PLANO COMPLETO

- `src/store/useStore.ts` — afeta 100% dos componentes, realtime channels
- `server.js` — geração de PDF, sanitização, rotas admin
- `src/store/slices/leadSlice.ts` — automações encadeadas
- `src/modules/auth/AuthPage.tsx` — é a landing pública E a tela de login; quebrar aqui derruba o acesso de todos. Mexer em `src/modules/auth/landing/` (11 arquivos componentizados), nunca no AuthPage direto

### 🟡 CUIDADO ELEVADO

- `src/store/selectors/dashboardSelectors.ts` — 18+ métricas
- `src/modules/ia/iaService.ts` — lógica de risco, valorOrcado nullable
- `src/modules/leads/LeadDetail.tsx` — componente grande
- `templates/orcamento-v2.html` e `recibo-v2.html` — espaçamentos sensíveis

### Regra de Ouro

Antes de modificar qualquer arquivo 🔴:

1. Rodar `/grill-me` com o pedido — fechar o escopo antes de escrever código
2. Ler o arquivo completo primeiro
3. Mapear todos os consumidores
4. Definir o plano antes de escrever código

Também rodar `/grill-me` antes de: mexer em RLS ou policies, criar migration, alterar Nginx/PM2 na VPS, tocar na Evolution API, ou qualquer coisa que grave dado de cliente.

### Referências

- `_build/current-state.md` — estado atual do projeto
- `_build/decisions.md` — decisões arquiteturais
- `_build/mistakes.md` — erros que custaram tempo
- `_build/patterns.md` — padrões reutilizáveis
