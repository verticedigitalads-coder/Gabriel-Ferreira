# Auditoria de Segurança Pré-Launch — CRM VRTX

**Data:** 2026-07-23
**Projeto:** CRM Vértice Digital (multi-tenant) — produção `https://api.vrtxcrm.com.br` + Supabase `maadmoayrogrhntlyqvn`
**Escopo desta fase:** Análise estática (leitura de código) + verificação read-only de metadados do banco (`list_tables`, `get_advisors`, `pg_policies` — zero linhas de dados de cliente lidas). Nenhuma requisição contra a aplicação de produção.
**Padrão de referência:** OWASP básico, com foco em isolamento multi-tenant.

---

## Sumário executivo (TL;DR)

O sistema está **em bom estado de isolamento multi-tenant** — o maior medo do launch. RLS está habilitado em 100% das tabelas, com exatamente uma policy correta (`IN (SELECT ...)`) por tabela (confirmado ao vivo via `pg_policies`), e o frontend reforça o filtro `workspace_id` em toda query (defesa em profundidade). O achado crítico de segredo exposto (chave OpenAI) **já foi resolvido** em 23/07/2026.

**🚩 Único bloqueador de launch restante:** um **IDOR cross-tenant nas rotas `/api/whatsapp/*`** (achado #2, severidade ALTA). As demais pendências são MÉDIO/BAIXO — endurecimento recomendado, não bloqueadores.

| Severidade | Qtde | Situação |
|---|---|---|
| CRÍTICO | 1 | ✅ Resolvido (23/07/2026) |
| ALTO | 1 | 🚩 **Aberto — gate de launch** |
| MÉDIO | 3 | Abertos (pós-launch, 1ª semana) |
| BAIXO | 3 | Abertos (backlog) |
| INFO | 2 | Verificações de config |

---

## Metodologia

Cobertura da leitura estática:
- **Backend:** `server.js` inteiro (todas as rotas, middlewares de auth, uso do service_role, Helmet, CORS, rate limit, webhooks, geração de PDF).
- **Banco/RLS:** todas as migrations (`supabase/migrations/*`, `migrations_backup/*`) + schema.
- **Frontend:** camada de queries (`src/store/slices/*`, `src/lib/*`, `src/store/useStore.ts` realtime), `src/lib/supabase.ts`, `apiFetch.ts`, serviços de IA.
- **Config/segredos:** `.env`, `vite.config.ts`, histórico git completo, artefatos `dist/`.

Verificação ao vivo (read-only, autorizada, **somente metadados**):
- `list_tables` → status de RLS por tabela + colunas.
- `get_advisors` (security + performance) → linter de segurança/performance do Supabase.
- `pg_policies` → texto (`qual`) das policies, para confirmar o padrão `IN (...)`.

---

# Parte A — Achados

## A.0 — Isolamento multi-tenant: CONFIRMADO seguro (a prioridade máxima)

Este é o risco nº1 do launch (vazamento entre clientes pagantes), e a verificação ao vivo é **tranquilizadora**:

- **RLS habilitado em 100% das 17 tabelas públicas** (`list_tables`, todas `rls_enabled: true`), incluindo `whatsapp_messages` e `whatsapp_instances` — que **não têm migration de RLS no código** (a RLS foi criada direto no painel Supabase), mas **estão protegidas ao vivo**.
- **Exatamente 1 policy por tabela, todas com `IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())`** — confirmado via `pg_policies` (23/07/2026). Zero `USING (true)`, zero `= (SELECT ... LIMIT 1)`. As policies legadas e perigosas `USING (true)` da baseline (`supabase/migrations/20260414010709_baseline_full_schema.sql:454-530`) **foram removidas e não estão vivas** — corroborado também pela ausência de qualquer lint `multiple_permissive_policies` no advisor.
- `workspace_members` e `terms_acceptance` usam `self_access` (`user_id = auth.uid()`) — correto (escopo por usuário, não por workspace).
- **Advisor de segurança do Supabase:** único achado é `auth_leaked_password_protection` (WARN) — ver #6. Nenhum problema de RLS/anon.
- **Frontend disciplinado (defesa em profundidade OK):** todas as queries filtram `workspace_id` explicitamente — mutations (`src/store/slices/leadSlice.ts:110,132,147,173,216`), export/reset em massa (`src/modules/settings/Settings.tsx:162-168,267,284-316`) e canais realtime (`src/store/useStore.ts:265,310,362,410,479,517,555`). **Zero violação encontrada.**
- **`.env` fora do git** (gitignored) e **a chave `service_role` NUNCA foi commitada** (histórico limpo para ela — `git log -S 'SUPABASE_SERVICE_ROLE_KEY'` vazio).

> **Conclusão A.0:** a camada de dados (banco + aplicação) isola tenants corretamente. O risco cross-tenant remanescente **não** está no banco — está na camada de aplicação do backend WhatsApp (achado #2).

---

## A.1 — Inventário de achados (ordenado por severidade)

| # | Sev | Área | Arquivo:linha | Risco concreto |
|---|-----|------|---------------|----------------|
| 1 | ~~CRÍTICO~~ ✅ **RESOLVIDO 23/07/2026** | Segredo exposto | `.env:1`; git history (`49397a03`, `a1339027`); `dist/assets/IAAssistente-*.js` | Chave OpenAI exposta (detalhe abaixo). Rotacionada e neutralizada. |
| 2 | **ALTO** 🚩 | IDOR cross-tenant (WhatsApp) | `server.js:2132,2213,2238,2255,2276,2311` | Rotas confiam no `instanceName` do request sem checar dono → controle da linha WhatsApp de outro tenant. |
| 3 | **MÉDIO** | Header ausente (CSP) | `server.js:365-368` | `contentSecurityPolicy: false` → sem CSP; XSS com raio de ação máximo. |
| 4 | **MÉDIO** | Rotas sem auth | `server.js:544,1862` | `/api/cnpj` e `/api/pix-payload` sem `requireAuth` (só rate limit global). |
| 5 | **MÉDIO** | CORS amplo em prod | `server.js:336-358`; `.env:5` | `localhost` na whitelist de origens em produção. |
| 6 | **BAIXO** | Auth Supabase | Advisor `auth_leaked_password_protection` | Proteção contra senhas vazadas (HIBP) desligada. |
| 7 | **BAIXO** | Webhook | `server.js:2027-2030,2053-2054` | Segredo no path da URL; compare não-constante; fallback de workspace default. |
| 8 | **BAIXO** | Correção/latente | `server.js:704-712` | Query de sequencial usa ANON key sem escopo — numeração quebra p/ fallback (bug, sem vazamento). |
| 9 | **INFO** | Storage | (config Supabase, fora do repo) | Bucket público `logos` — verificar conteúdo/paths no console. |
| 10 | **INFO** | Admin whitelist | `server.js:396-427`; `.env:7` | `requireAdmin` fecha por padrão — confirmar `ADMIN_USER_IDS` de produção. |

---

## A.2 — Detalhamento

### #1 — [✅ RESOLVIDO] Chave OpenAI exposta em git + bundle do frontend

**Severidade original:** CRÍTICO · **Situação:** Resolvido em 23/07/2026.

**Risco original (registro histórico):** a chave `sk-sk-proj-6x2FC3…` foi commitada como `VITE_OPENAI_API_KEY` (`.env` em `49397a03`, `a1339027`) e, por causa do prefixo `VITE_`, **embutida no bundle público do frontend** (verificável em `dist/assets/IAAssistente-*.js` e em chunk minificado no histórico). Era a **mesma chave** usada server-side (`server.js:450,516`). Qualquer pessoa com acesso ao repositório ou ao bundle podia extrair a chave e consumir/abusar da conta OpenAI.

**Resolução verificada:**
- Chave **rotacionada** no OpenAI em 23/07/2026 (a chave antiga está morta).
- Frontend **não** referencia mais `VITE_OPENAI` (as chamadas de IA passam por `apiFetch('/api/chat')` → `openaiStrategicService.ts:99`).
- Backend usa `OPENAI_API_KEY` (server-side, sem prefixo `VITE_`).
- `dist/` está gitignored; a referência remanescente à string da chave está apenas em documentação (valor morto).

**Não é necessário reescrever o histórico do git:** como o segredo foi rotacionado, a cópia antiga no histórico é inócua. (Purga de histórico só seria exigida se a chave não pudesse ser rotacionada.)

---

### #2 — [🚩 GATE DE LAUNCH] IDOR cross-tenant nas rotas `/api/whatsapp/*`

**Severidade:** ALTO · **Situação:** Aberto — **único bloqueador de launch**.

**Onde:** `server.js:2132` (`send-text`), `2213` (`send-media`), `2238` (`status`), `2255` (`logout`), `2276` (`contacts`), `2311` (`media`).

**Risco concreto:** todas essas rotas exigem autenticação (`requireAuth`), porém recebem o `instanceName` (ou `:instanceName`) **direto do request e não verificam que essa instância pertence ao workspace do usuário autenticado**. Um usuário legítimo do workspace **A**, de posse do `instanceName` do workspace **B**, consegue:

- **Enviar mensagens WhatsApp pela linha de B** (`send-text`, `send-media`) — fala com os clientes de B fazendo-se passar pela empresa B;
- **Ler a agenda de contatos de B** (`contacts`) — vazamento de dados de clientes de outro tenant;
- **Baixar mídia de mensagens de B** (`media`);
- **Desconectar o WhatsApp de B** (`logout`) — negação de serviço contra outro cliente pagante;
- No `send-text`, o backend ainda **grava a mensagem na timeline de B** usando o `service_role` (que bypassa RLS) — `server.js:2175-2199`.

> Por que a RLS não protege aqui: essas rotas chamam a **Evolution API** diretamente (com a chave compartilhada do servidor) e persistem via `service_role`. A proteção precisa ser **na aplicação**: validar ownership do `instanceName` antes de qualquer proxy.

**Pré-condição do ataque:** conhecer o `instanceName` de B. Um usuário de A **não** lê `whatsapp_instances` de B via RLS, mas nomes de instância podem ser previsíveis/enumeráveis (derivados de nome de empresa, padrão fixo, etc.) — logo, tratar como exposto.

**Correção sugerida** — um único helper de ownership aplicado a todas as rotas WhatsApp:

```js
// server.js — validar que a instância pertence ao workspace do usuário autenticado
async function assertInstanceOwnership(userId, instanceName, res) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('whatsapp_instances')
    .select('workspace_id, workspace_members!inner(user_id)')
    .eq('instance_name', instanceName)
    .eq('workspace_members.user_id', userId)
    .maybeSingle();
  if (error || !data) {
    res.status(403).json({ error: 'Instância não pertence ao seu workspace' });
    return false;
  }
  return true;
}
```

> Observação: o join `whatsapp_instances → workspace_members` acima assume que a FK/relacionamento por `workspace_id` esteja disponível ao PostgREST. Alternativa robusta sem depender de relação implícita: (1) buscar `workspace_id` da instância por `instance_name`; (2) confirmar `workspace_members` com `.eq('workspace_id', ...).eq('user_id', userId)`. Ambos usam o `service_role` só para a checagem de autorização.

Aplicar no início de cada rota, ex.:

```js
app.post('/api/whatsapp/send-text', requireAuth, async (req, res) => {
  const cfg = evolutionConfig(res);
  if (!cfg) return;
  const { instanceName } = req.body ?? {};
  if (!instanceName) return res.status(400).json({ error: 'instanceName obrigatório' });
  if (!(await assertInstanceOwnership(req.user.id, instanceName, res))) return;
  // ...resto inalterado...
});
```

Rotas a proteger: `send-text`, `send-media`, `status/:instanceName`, `logout/:instanceName`, `contacts/:instanceName`, `media/:instanceName/:messageId`.

---

### #3 — [MÉDIO] Content-Security-Policy desabilitado no Helmet

**Onde:** `server.js:365-368` — `helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })`.

**Risco:** sem header `Content-Security-Policy`, qualquer XSS que escape da sanitização tem raio de ação máximo (pode carregar scripts externos e exfiltrar o JWT de sessão do Supabase). Os demais headers do Helmet 8 estão ativos por padrão (HSTS, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`) — falta especificamente o CSP.

**Correção sugerida** (ponto de partida; requer ajuste fino testando o PWA):

```js
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://api.vrtxcrm.com.br"],
        imgSrc: ["'self'", "data:", "https://*.supabase.co"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  }),
);
```

> O CSP protege primariamente o **frontend** (servido pela Vercel), não a API. Idealmente configure o CSP também no lado da Vercel (`vercel.json` headers) ou no Nginx que serve o app. Como o app é PWA, valide que o service worker e os assets continuam carregando após aplicar.

---

### #4 — [MÉDIO] Endpoints sem autenticação: `/api/cnpj` e `/api/pix-payload`

**Onde:** `server.js:544` (`GET /api/cnpj/:cnpj`), `server.js:1862` (`POST /api/pix-payload`).

**Risco:** nenhuma das duas exige `requireAuth` — só o rate limit global (100/min por IP). `/api/cnpj` é um **proxy aberto** para a ReceitaWS: terceiros podem usá-lo para exaurir a cota do serviço e para reconhecimento (SSRF-lite limitado ao endpoint fixo). `/api/pix-payload` apenas gera um payload a partir de input do usuário (impacto de dados baixo), mas é superfície pública desnecessária.

**Correção sugerida:** adicionar `requireAuth` (e, se fizer sentido, `strictLimiter`) às duas rotas. Se `/api/cnpj` precisar ser público por UX, aplicar um rate limit dedicado mais restritivo por IP.

```js
app.get('/api/cnpj/:cnpj', requireAuth, strictLimiter, async (req, res) => { /* ... */ });
app.post('/api/pix-payload', requireAuth, async (req, res) => { /* ... */ });
```

---

### #5 — [MÉDIO] CORS libera `localhost` em produção

**Onde:** `server.js:336-358` lê `CORS_ALLOWED_ORIGINS`; `.env:5` = `http://localhost:5173,http://localhost:3000,https://vertice-digital-crm.vercel.app`.

**Risco:** se este `.env` é o de produção, origens de desenvolvimento (`localhost`) ficam na whitelist em prod. Risco prático baixo (o atacante não controla o `localhost` da vítima), mas é higiene: reduz a superfície e evita que um app malicioso em `localhost` do próprio usuário fale com a API com credenciais.

**Correção sugerida:** em produção, definir `CORS_ALLOWED_ORIGINS` apenas com o(s) domínio(s) reais (ex.: `https://vertice-digital-crm.vercel.app` e o domínio final do cliente). Manter `localhost` só no `.env` de desenvolvimento.

---

### #6 — [BAIXO] Proteção contra senhas vazadas desligada (Supabase Auth)

**Onde:** advisor de segurança `auth_leaked_password_protection` (WARN).

**Risco:** usuários podem cadastrar senhas já presentes em vazamentos conhecidos (HaveIBeenPwned), facilitando account takeover por credential stuffing.

**Correção sugerida:** Supabase Dashboard → Authentication → Policies → habilitar "Leaked password protection". Ref.: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

### #7 — [BAIXO] Webhook Evolution: segredo no path + fallback de workspace

**Onde:** `server.js:2027-2030` (`/webhook/evolution/:secret`, compare `req.params.secret !== process.env.WEBHOOK_SECRET`), `server.js:2053-2054` (`DEFAULT_WORKSPACE_ID` fallback).

**Riscos:**
- Segredo trafega no **path da URL** → aparece em logs de servidor/proxy e em referrers; use um header (`X-Webhook-Secret`) em vez do path.
- Comparação `!==` **não é constante no tempo** (timing side-channel teórico); use comparação constante.
- Se a instância não estiver mapeada em `whatsapp_instances`, a mensagem é atribuída a `DEFAULT_WORKSPACE_ID` — pode **misturar dados** de uma instância desconhecida no workspace default. Preferir rejeitar (o código já retorna `no_workspace` quando não há default — bom; só garantir que `DEFAULT_WORKSPACE_ID` não esteja setado em prod, ou removê-lo).

**Correção sugerida:**
```js
import crypto from 'crypto';
function safeEqual(a, b) {
  const ba = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
// header em vez de path:
app.post('/webhook/evolution', (req, res, next) => {
  if (!safeEqual(req.headers['x-webhook-secret'], process.env.WEBHOOK_SECRET))
    return res.status(401).json({ error: 'Não autorizado' });
  next();
}, handler);
```
(Requer atualizar a URL configurada na Evolution API.)

---

### #8 — [BAIXO] Query de número sequencial usa ANON key sem escopo

**Onde:** `server.js:704-712` (`/rest/v1/orcamentos?...` com `apikey`/`Bearer = SUPABASE_ANON_KEY`).

**Risco:** com RLS ativa e role anon, `auth.uid()` é nulo → a query retorna vazio → a numeração sempre cai no fallback baseado em `Date.now()`. **Não é vazamento** (anon não vê nada), mas é um bug de correção (numeração de orçamentos não sequencial de fato) e um smell de design (uso de anon key para lógica de negócio). Corrigir para derivar o próximo número no contexto do usuário/workspace (ex.: RPC autenticada ou cálculo no client já autenticado).

---

### #9 — [INFO] Bucket público `logos` (verificação de config)

Nenhum código no repositório toca o Storage (`src/` sem `storage.from`/`upload`; `Settings.tsx:427` indica "upload de arquivo será futuro" — a logo hoje é apenas um campo de URL). O bucket `logos` público é populado manualmente pelo painel. Como as policies de bucket vivem na configuração Supabase (fora do repo), **verificar no console**: (a) que o bucket contém apenas logos (nada sensível); (b) que os nomes de arquivo não permitem enumerar/adivinhar arquivos de outro workspace; (c) se possível, migrar para URLs assinadas quando o upload for implementado.

---

### #10 — [INFO] Whitelist de admin (verificação de config)

`requireAdmin` (`server.js:422-427`) exige `req.user.id ∈ ADMIN_USER_IDS`; com a lista **vazia** (`.env:7`), **nega todos** (fail-closed) — sem bypass no código. Confirmar que o `.env` de **produção** tem apenas o(s) UUID(s) do host, e que ninguém indevido está na lista.

---

## A.3 — Não-achados (verificados e descartados, para evitar alarme falso)

- **Anon key + URL do Supabase no frontend** (`src/lib/supabase.ts:4`) — **esperado e seguro**. A chave `anon` é pública por design e protegida por RLS. **Não é vulnerabilidade.**
- **Rotas de geração de PDF** (`/api/gerar-orcamento`, `/api/gerar-orcamento-agrupado`, `/api/gerar-recibo`) — renderizam **dados fornecidos pelo próprio cliente** e devolvem o PDF na resposta HTTP; **não buscam recurso por ID nem gravam URL pública/adivinhável**. **Sem IDOR e sem URL vazável.** `escapeHtml` é aplicado à interpolação de dados do usuário (`server.js:18-26` e usos nos templates).
- **Prompt injection** (`/api/help-chat`, análise de lead via `/api/chat`) — risco **baixo**: o help-chat só expõe documentação estática e o system prompt (não-sensíveis); a análise de lead só envia dados do **próprio** workspace. Nenhum caminho pela IA alcança dados de outro tenant.
- **SQL injection** — não há SQL raw/concatenado nem RPC perigosa; o cliente Supabase parametriza as queries.

---

# Parte B — Roteiro de testes manuais

> Testes para **você** executar depois (contra produção ou staging). Cada teste indica **[READ-ONLY]** (seguro) ou **[WRITE]** (altera dados — rodar **somente** no workspace "Teste Multi-Tenant"). Um teste "passa" quando o resultado bate com o **ESPERADO**; qualquer outra coisa é **FALHA** (potencial vulnerabilidade viva).

## B.0 — Setup (placeholders)

```bash
# --- Constantes públicas ---
export SB="https://maadmoayrogrhntlyqvn.supabase.co"
export API="https://api.vrtxcrm.com.br"
# anon key é PÚBLICA por design (está em src/lib/supabase.ts):
export ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYWRtb2F5cm9ncmhudGx5cXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODk5MDgsImV4cCI6MjA4Nzc2NTkwOH0.KzTYILOztyY8eq2wYpbXC1ISXfZ_IKURE8CZmeAzitA"

# --- Preencha com dados dos DOIS workspaces de teste ---
export WS_A="<uuid do workspace A>"
export WS_B="<uuid do workspace B>"
export INSTANCE_B="<instance_name do WhatsApp do workspace B>"

# --- Obter JWTs (login por senha) ---
# Usuário A:
export TOKEN_A=$(curl -s "$SB/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"usuarioA@exemplo.com","password":"SENHA_A"}' | jq -r .access_token)
# Usuário B:
export TOKEN_B=$(curl -s "$SB/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"usuarioB@exemplo.com","password":"SENHA_B"}' | jq -r .access_token)

echo "TOKEN_A len: ${#TOKEN_A} | TOKEN_B len: ${#TOKEN_B}"   # ambos > 100 = ok
```

---

## B.1 — [READ-ONLY] Leitura cruzada via REST (RLS deve bloquear)

Usuário A tentando ler leads do workspace B, filtrando explicitamente por `WS_B`:

```bash
curl -s "$SB/rest/v1/leads?select=id,nome&workspace_id=eq.$WS_B" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | jq
```
- **ESPERADO (passou):** `[]` (array vazio).
- **FALHA:** qualquer lead retornado → RLS não está isolando.

Repita para as tabelas sensíveis: `orcamentos`, `recibos`, `transactions`, `contas_receber`, `notas`, `fornecedores`, `workspace_settings`.

---

## B.2 — [READ-ONLY] Leitura sem filtro (confiando só no RLS)

Usuário A lendo "todos" os leads (sem filtro de workspace) — a RLS deve limitar ao workspace de A:

```bash
curl -s "$SB/rest/v1/leads?select=id,nome,workspace_id" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | jq '[.[].workspace_id] | unique'
```
- **ESPERADO (passou):** a lista de `workspace_id` únicos contém **apenas `WS_A`** (e/ou outros workspaces dos quais A é membro).
- **FALHA:** aparecer `WS_B` (ou qualquer workspace que A não seja membro).

---

## B.3 — [READ-ONLY] `whatsapp_messages` cross-tenant (tabela sem RLS no código)

Confirma que a RLS criada no painel para `whatsapp_messages` está de fato ativa:

```bash
curl -s "$SB/rest/v1/whatsapp_messages?select=id,content&workspace_id=eq.$WS_B" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" | jq
```
- **ESPERADO (passou):** `[]`.
- **FALHA:** qualquer mensagem de B retornada. (Repita para `whatsapp_instances`.)

---

## B.4 — [WRITE — só no workspace "Teste Multi-Tenant"] Forçar `workspace_id` de B no INSERT

Usuário A tentando inserir um lead marcado como workspace B (testa o `WITH CHECK` da policy):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$SB/rest/v1/leads" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d "{\"nome\":\"IDOR-test\",\"workspace_id\":\"$WS_B\"}"
```
- **ESPERADO (passou):** `401` ou `403` (violação de RLS / `new row violates row-level security policy`).
- **FALHA:** `201` (linha criada no workspace de B). Se falhar, **apague** a linha de teste.

---

## B.5 — [READ-ONLY] IDOR backend: WhatsApp status/contacts com instância de B (achado #2)

Usuário A consultando a instância de B:

```bash
curl -s -o /dev/null -w "status=%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN_A" \
  "$API/api/whatsapp/status/$INSTANCE_B"

curl -s -w "\ncontacts_http=%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN_A" \
  "$API/api/whatsapp/contacts/$INSTANCE_B" | head -c 400
```
- **ESPERADO (após correção):** `403` (instância não pertence ao workspace).
- **FALHA (estado atual esperado):** `200` com o status/contatos de B → **confirma o achado #2**.

---

## B.6 — [WRITE — PERIGO: envia WhatsApp real] Enviar mensagem pela linha de B (achado #2)

> **Só execute** com uma instância de teste e um número de destino seu. Envia mensagem WhatsApp de verdade.

```bash
curl -s -w "\nsend_http=%{http_code}\n" -X POST "$API/api/whatsapp/send-text" \
  -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
  -d "{\"instanceName\":\"$INSTANCE_B\",\"number\":\"55SEU_NUMERO\",\"text\":\"idor-test\"}"
```
- **ESPERADO (após correção):** `403`.
- **FALHA (estado atual esperado):** `200` e a mensagem chega pela linha de B → **confirma o achado #2 no seu vetor mais grave**.

---

## B.7 — [READ-ONLY] Rota admin com JWT não-admin e sem token

```bash
# Não-admin (usuário A comum):
curl -s -o /dev/null -w "nao_admin=%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN_A" "$API/api/admin/workspaces"
# Sem token:
curl -s -o /dev/null -w "sem_token=%{http_code}\n" "$API/api/admin/workspaces"
```
- **ESPERADO (passou):** `nao_admin=403` e `sem_token=401`.
- **FALHA:** `200` com lista de workspaces em qualquer um dos casos.

---

## B.8 — [READ-ONLY] Headers de segurança

```bash
curl -sI "$API/" | grep -iE 'strict-transport|content-security|x-frame|x-content-type|x-powered-by'
# E o domínio do app (Vercel):
curl -sI "https://vertice-digital-crm.vercel.app/" | grep -iE 'strict-transport|content-security|x-frame|x-content-type'
```
- **ESPERADO:** presença de `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options: nosniff`.
- **ACHADO #3 (esperado hoje):** **ausência** de `Content-Security-Policy` na API. Após corrigir, o header deve aparecer. `X-Powered-By` idealmente ausente.

---

## B.9 — [READ-ONLY] Rate limit

```bash
# Rota global (limite 100/min):
for i in $(seq 1 120); do \
  curl -s -o /dev/null -w "%{http_code}\n" "$API/api/cnpj/00000000000000"; \
done | sort | uniq -c
# Rota strict (limite 10/min) — precisa de auth:
for i in $(seq 1 15); do \
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/help-chat" \
    -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" \
    -d '{"message":"oi"}'; \
done | sort | uniq -c
```
- **ESPERADO (passou):** aparecem `429` após ~100 req (global) e após ~10 req (strict) na janela de 1 min.
- **FALHA:** nenhum `429` → rate limit não está efetivo (verifique `trust proxy` / IP real atrás do Nginx).

---

> **Removido do roteiro:** o teste de confirmação do `qual` das policies (`SELECT ... FROM pg_policies`) — **já executado e CONFIRMADO em 23/07/2026** (17 tabelas, 1 policy cada, todas `IN (...)`, zero `USING(true)`). Mantido aqui só como referência caso queira reconfirmar após qualquer mudança de schema:
> ```sql
> SELECT tablename, policyname, cmd, roles, qual
> FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
> ```

---

# Parte C — Correções priorizadas

| Ordem | Achado | Sev | Esforço | Gate? |
|---|---|---|---|---|
| ✅ 0 | #1 Chave OpenAI | ~~CRÍTICO~~ | — | Concluído 23/07 |
| **1** | **#2 IDOR WhatsApp** | **ALTO** | ~2–4h (M) | **🚩 SIM — antes do launch** |
| 2 | #3 CSP no Helmet | MÉDIO | ~2–6h (M) | Não (1ª semana) |
| 3 | #4 Auth em `/api/cnpj` e `/api/pix-payload` | MÉDIO | ~30min (S) | Não |
| 4 | #5 CORS só domínio real em prod | MÉDIO/BAIXO | ~15min (S) | Não |
| 5 | #6 Leaked-password protection | BAIXO | ~5min (XS) | Não |
| 6 | #7 Webhook (compare constante + header) | BAIXO | ~30min (S) | Não |
| 7 | #8 Sequencial sem escopo | BAIXO | ~1h (S) | Não |
| 8 | #9/#10 Verificações (bucket `logos`, `ADMIN_USER_IDS` prod) | INFO | ~30min (S) | Não |

**Detalhe da ordem 0 (concluída):** chave OpenAI rotacionada; frontend sem `VITE_OPENAI`; backend em `OPENAI_API_KEY`; `dist/` gitignored. Sem purga de histórico git (segredo rotacionado não exige reescrita de histórico).

**Detalhe da ordem 1 (o gate):** implementar `assertInstanceOwnership` (ver #2) e aplicá-lo às 6 rotas `/api/whatsapp/*`. Testar com B.5/B.6 antes e depois — deve virar `403`.

---

## Conclusão — decisão de launch

Com o achado #1 **resolvido** e o isolamento multi-tenant **confirmado ao vivo** (RLS 100%, 1 policy `IN(...)` por tabela; frontend e realtime filtram `workspace_id`), **o único bloqueador de launch é o achado #2 — IDOR cross-tenant nas rotas `/api/whatsapp/*`.** Recomendação:

1. **Corrigir o #2 antes de abrir para clientes pagantes** (é o vetor que permite controlar a linha WhatsApp e ler contatos de outro tenant).
2. Tratar os MÉDIOs (#3, #4, #5) na primeira semana pós-launch.
3. BAIXO/INFO no backlog de endurecimento.

---
*Auditoria estática — 2026-07-23. Nenhum código do sistema foi alterado nesta fase; nenhuma requisição contra a aplicação de produção foi executada; verificação viva limitada a metadados (sem leitura de dados de cliente).*
