# Plano — Cadastro self-service + cobrança recorrente (VRTX CRM)

Data: 09/11/2026 · Escopo fechado via `/grill-me` · **Aprovado em 09/11/2026.** Execução: ver **Andamento**, no fim de Rodadas.

## Contexto

Hoje só o Gabriel cria empresa: `AdminEmpresas` → `POST /api/admin/criar-empresa` cria workspace + usuário com e-mail/senha. A venda é pelo WhatsApp, não existe cobrança no sistema, e quem entra com Google sem empresa é deslogado com o aviso "sem acesso".

Objetivo: cliente novo entra com Google, aceita os termos, cadastra a empresa, assina R$ 147/mês no cartão e usa. Renovação automática. Atraso de mais de 15 dias (Termos §4.3) → tela de bloqueio com "Regularizar", sem apagar dados; pagou → libera sozinho. Cortesias isentas. Gateway (Asaas ou Mercado Pago, ainda não escolhido) atrás de uma camada própria no backend, trocável.

## Decisões fechadas

| Tema | Decisão | Motivo |
|---|---|---|
| Onde vale o bloqueio | Tela + backend. **Sem RLS** nas 14 tabelas | Os dados são do cliente (LGPD): ler pela API não é perda. RLS nas 14 tabelas arrisca travar cliente pagante |
| Pagamento | Só cartão na v1 | Recorrência automática de verdade. Pix/boleto depois, se algum cliente pedir |
| Trocar cartão | Fora da v1 | Nos dois gateways exige token do cartão novo (formulário no app). "Regularizar" abre a fatura na página do gateway |
| Canal | Só pelo "Entrar com Google" na v1 | Botão "Assinar" na landing entra antes de ligar o tráfego pago (R7) |
| GPP Móveis Planejados | Segue isento por enquanto | Confirmado pelo Gabriel na aprovação (09/11/2026) |
| `APP_URL` | `https://www.vrtxcrm.com.br` | Origem do front para o retorno do checkout |
| Gateway | Decidido pelo Gabriel antes da R2 | R0 e R1 não dependem dele |
| AdminEmpresas | `criar-empresa` grava a linha em `assinaturas` junto, `isento = true` por padrão (entra na R2) | Cliente fechado manualmente não cai no checkout. Decidido em 10/11/2026 |

Assumidas (propostas no grill-me, não contestadas):
- Acesso só depois do 1º pagamento confirmado. Sem teste grátis (LISTA PROIBIDA; Termos §5.1 é garantia, não teste).
- Bloqueia quando agora > fim do período pago + 15 dias, calculado no Postgres (`now()`): não depende do relógio do aparelho nem do backend estar no ar. Cancelada: acesso até o fim do período pago, sem os 15 dias.
- Isentos: FL Art Metal, Ítalo Colares Drywall, Vértice Digital, Teste Multi-Tenant, Teste Grants e GPP Móveis Planejados (confirmado). Ninguém é bloqueado no dia da virada.
- Nada é apagado automaticamente. Encerrar conta continua manual.
- Plano único R$ 147/mês (`PRICING.basico.precoMensal`), mensal. Só o owner assina e cancela.
- Segmento: lista da landing (`CONTATO_SEGMENTOS`), gravado como `marcenaria` ou `metalurgica` — os únicos valores que o app lê (`useWorkspaceSegment` em `Orcamentos.tsx:889`).
- CPF/CNPJ só se o gateway exigir (o Asaas exige `cpfCnpj` em `POST /v3/customers`), repassado ao gateway e não guardado no banco.
- Reembolso da garantia de 7 dias: manual no painel do gateway; o webhook de estorno corta o acesso e cancela a renovação.

## O que existe hoje (mapeado em 09/11/2026, código + MCP)

1. **Login** — `src/App.tsx`. Dois efeitos em paralelo, ambos presos a `session?.user?.id` (evita remontar no TOKEN_REFRESHED — `_build/patterns.md`):
   - termos (:218-230) → `termsStatus` → returns fail-closed com `TermsGate` (:286-306);
   - init (:233-270): `ensureWorkspaceForUser()` → sem empresa: `setAuthNotice('sem-acesso')` + `signOut` (:245-250); com empresa: `initialize` + `startRealtime`; erro: `'erro-init'` + `signOut`;
   - `src/lib/supabaseWorkspace.ts:18` devolve `null` para erro de consulta **e** para "sem empresa".
   - **O cadastro entra no lugar do ramo "sem empresa"** e renderiza depois do TermsGate (aceite antes de contratar). Hoje 6/6 usuários têm empresa: o ramo só pega gente nova.
2. **criar-empresa** — `server.js:2075`: insere `workspaces` (nome, segment) → `auth.admin.createUser` (e-mail/senha) → `workspace_members` role `owner`. Não atômico (falha no vínculo deixa empresa órfã, :2141).
   - Reaproveitar: `getSupabaseAdmin`, `requireAuth`, a sequência workspace → member `owner`.
   - Não reaproveitar: `createUser` (o usuário Google já existe) e o padrão não atômico. `criar-empresa` só muda na R2: passa a gravar a linha em `assinaturas` (isento por padrão, ver Decisões fechadas).
3. **Grants** (MCP): `anon`/`authenticated` só têm `SELECT` em `workspaces` e `workspace_members`; `service_role` tem tudo → criar empresa **tem** que ser pelo backend. Sem triggers em `public` nem `auth`. `workspace_members`: `UNIQUE(workspace_id, user_id)`, role ∈ owner/admin/member. `workspaces.owner_id` → `auth.users ON DELETE CASCADE` → **não preencher no cadastro**.
4. **Gate** — dentro do efeito de init, entre `ensureWorkspaceForUser` e `initialize`. Nenhum efeito novo: TermsGate e o padrão `session?.user?.id` ficam intactos.

Achados que mudam o plano:
- `src/hooks/useIsAdmin.ts:26`: admin = role `owner`. O menu "Empresas" (`Sidebar.tsx:220`) aparece para todo owner, e o backend responde 403 (whitelist `ADMIN_USER_IDS`, `server.js:420`). Todo cliente self-service seria owner.
- `src/lib/apiFetch.ts:19` refaz o POST até 2x em erro de rede → cadastro e checkout idempotentes e chamados com `maxRetries = 0` (padrão do `LandingContato`).
- Rotas de PDF/IA/CNPJ não recebem `workspace_id` (os dados vêm prontos no body) → o bloqueio no backend é por usuário.
- `Settings.tsx:16` já tem a aba "Pagamentos" (PIX do próprio cliente). A nova aba é "Assinatura".
- `feature-flags.json` já é lido pelo backend (`server.js:253`) e pelo front (`Sidebar.tsx:5`) → kill switch.

## Banco (criado na R1, 10/11/2026)

### `public.assinaturas` (1 linha por workspace)

| coluna | tipo | nota |
|---|---|---|
| `workspace_id` | uuid PK → `workspaces(id)` ON DELETE CASCADE | |
| `status` | text NOT NULL default `'pendente'` | check: `pendente`, `ativa`, `atrasada`, `cancelada` |
| `isento` | boolean NOT NULL default false | cortesia |
| `gateway` | text null | check: `asaas`, `mercadopago` |
| `gateway_cliente_id` | text null | |
| `gateway_assinatura_id` | text null | `UNIQUE(gateway, gateway_assinatura_id)` |
| `periodo_fim` | timestamptz null | pago até. Data sem hora do gateway → fim do dia em America/Sao_Paulo |
| `cancelada_em` | timestamptz null | |
| `created_at`, `updated_at` | timestamptz NOT NULL default now() | `updated_at` gravado pelo backend (o projeto não usa trigger) |

RLS ligado + 1 policy `FOR SELECT TO authenticated USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))`. `REVOKE ALL ... FROM anon, authenticated` + `GRANT SELECT ... TO authenticated` (mesmo padrão da migration `20260923210256`). Escrita só `service_role`.

### `public.assinatura_eventos` (idempotência + auditoria do webhook)

`id` uuid PK · `gateway` text · `evento_id` text · `tipo` text · `workspace_id` uuid null → `workspaces` ON DELETE SET NULL · `payload` jsonb · `recebido_em` timestamptz default now() · `processado_em` timestamptz null · `erro` text null. `UNIQUE(gateway, evento_id)`. RLS ligado + policy de recusa `no_client_access` (`USING (false)`; sem ela o advisor acusa "RLS sem policy") + `REVOKE ALL FROM anon, authenticated`. O payload tem dado pessoal → retenção entra na Privacidade (R5).

### Funções

- `acesso_workspace(p_workspace_id uuid) → text` — `STABLE`, `SECURITY INVOKER`, `search_path` fixo. O app chama via `rpc`; a RLS de `assinaturas` faz cada usuário enxergar só a própria.

  | situação | retorno |
  |---|---|
  | sem linha | `pendente` |
  | `isento` | `liberado` |
  | `status = pendente` | `pendente` |
  | `status = cancelada` | `liberado` se `now() < periodo_fim`, senão `bloqueado` |
  | `ativa` ou `atrasada` | `liberado` se `now() < periodo_fim + 15 dias`, senão `bloqueado` |

  O bloqueio sai de `periodo_fim`, não de um evento de atraso: se um webhook se perder, o pagante ainda tem 15 dias até o "Já paguei"/sincronizar resolver. EXECUTE só para `authenticated` e `service_role`.
- `usuario_tem_acesso(p_user_id uuid) → boolean` — existe membership do usuário com `acesso_workspace = 'liberado'`. Só `service_role` (o parâmetro permitiria sondar outro usuário).
- `criar_empresa_onboarding(p_user_id uuid, p_nome text, p_segment text) → uuid` — numa transação: `pg_advisory_xact_lock` pelo user id; se o usuário já tem membership, devolve o workspace mais antigo (idempotente: duplo clique e retry); senão insere `workspaces` (sem `owner_id`), `workspace_members` (owner) e `assinaturas` (`pendente`). Só `service_role`.
- Em todas: `REVOKE EXECUTE ... FROM PUBLIC, anon` (e `authenticated` nas duas só-backend) — o Supabase dá EXECUTE por padrão.

### Seed (mesma migration)

`assinaturas` com `isento = true`, `status = 'ativa'`, por **id** (o nome pode mudar):
- FL Art Metal `72b024c0-42e4-4113-8bb0-81ba6eb720bd`
- GPP Móveis Planejados `53df42fc-8b1f-4221-aa60-6c35a05a3b31` (isento por enquanto, confirmado)
- Teste Multi-Tenant `0d79ca0c-72b2-4609-8466-c84c695e89d6`
- Ítalo Colares Drywall `9a9b96d5-f9f2-4b43-b02b-dc3519f07803`
- Vértice Digital `001843dd-97fc-42a6-88ee-08c7a404903a`
- Teste Grants `8c7a9183-69ce-447b-bb45-0d27df7ab1e5`

Antes de aplicar: reconferir se surgiu workspace novo. Depois: `workspaces` sem linha em `assinaturas` = 0.

## Camada de gateway — `utils/billing/` (novo)

- `index.js` escolhe o adapter: `BILLING_GATEWAY` para assinaturas novas; o webhook é roteado pelo `:gateway` da URL (se um dia trocar, as assinaturas antigas seguem no gateway delas).
- Interface de cada adapter (na v1 só o do gateway escolhido é implementado):
  - `criarCheckout({ workspaceId, nomeEmpresa, email, cpfCnpj?, valor, urlRetorno })` → `{ clienteId, assinaturaId, url }`
  - `linkRegularizar({ assinaturaId })` → url da fatura em aberto no gateway
  - `cancelar({ assinaturaId })`
  - `consultar({ assinaturaId })` → `{ status, periodoFim }` normalizado (fonte da verdade no webhook e no sincronizar)
  - `validarWebhook(req)` — Asaas: header `asaas-access-token` com `safeEqual`; Mercado Pago: HMAC-SHA256 de `id:{data.id};request-id:{x-request-id};ts:{ts};` contra o `v1` do `x-signature`. Nenhum dos dois precisa de raw body.
  - `extrairEvento(req)` → `{ eventoId, assinaturaId, estorno }`
- Valor: constante 147 no backend espelhando `PRICING.basico.precoMensal` (mesmo padrão de espelho do `LANDING_SEGMENTOS`).
- Envs novas (nomes fechados na R2): `BILLING_GATEWAY`, `APP_URL=https://www.vrtxcrm.com.br` (origem do front para o retorno), e as do gateway (`ASAAS_API_URL`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN` ou `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`).
- **Confirmar na doc do gateway escolhido (ctx7) no início da R2:** como o checkout por redirecionamento deixa o cartão recorrente sem formulário nosso; nomes dos eventos; se a página da fatura em atraso aceita outro cartão. Se não aceitar: "Regularizar" = cancelar a assinatura velha no gateway e abrir checkout novo para o mesmo workspace (dados intactos, sem cobrança dupla).

## Backend — rotas novas (`server.js` 🔴, todas depois do `express.json` em :478)

| Rota | Proteção | Faz |
|---|---|---|
| `GET /api/admin/me` | requireAuth + requireAdmin | 200 se está em `ADMIN_USER_IDS`, senão 403 |
| `POST /api/onboarding/empresa` | requireAuth + strictLimiter | valida nome 2–80 e segmento da lista; `criar_empresa_onboarding(req.user.id, …)`; 201 `{ workspace_id }`; idempotente |
| `POST /api/assinatura/checkout` | requireAuth + strictLimiter + dono | dono = membership `owner` conferida via service_role com filtro explícito de `user_id` (padrão `assertInstanceOwnership`, :2292). Pendente com checkout aberto → devolve o mesmo; cancelada/encerrada → cancela a velha no gateway e cria nova; grava ids; `{ url }` |
| `POST /api/assinatura/regularizar` | requireAuth + dono | `linkRegularizar` → `{ url }` |
| `POST /api/assinatura/cancelar` | requireAuth + strictLimiter + dono | `cancelar` no gateway; `status = 'cancelada'`, `cancelada_em`; `periodo_fim` fica |
| `POST /api/assinatura/sincronizar` | requireAuth + strictLimiter + dono | `consultar` e aplica (cobre webhook perdido); usado na volta do gateway e no "Já paguei" |
| `POST /webhook/assinatura/:gateway` | `validarWebhook` | ver abaixo |

Webhook:
1. `:gateway` desconhecido → 404. Assinatura inválida → 401.
2. Insere em `assinatura_eventos`. Colisão (23505) com `processado_em` preenchido → 200 "duplicado"; com `processado_em` nulo → reprocessa (a tentativa anterior falhou).
3. Acha a assinatura por `(gateway, gateway_assinatura_id)`. Não achou → grava `erro` e responde 200 (não 500: o Asaas pausa a fila após 15 falhas seguidas).
4. Estorno → `cancelar` no gateway + `status = 'cancelada'`, `periodo_fim = now()`. Demais → `consultar` e aplica com `periodo_fim = greatest(atual, novo)` (evento fora de ordem não regride).
5. Grava `processado_em` e responde 200 em menos de 10s. 500 só em falha de banco/gateway (o gateway reenvia).
6. Log sem dado pessoal: `[assinatura/webhook] <gateway> ok|duplicado|erro <code>`.

Bloqueio no backend (decisão 1): middleware `exigeAssinatura` depois do `requireAuth` em `/api/chat`, `/api/help-chat`, `/api/cnpj/:cnpj`, `/api/gerar-orcamento`, `/api/gerar-orcamento-agrupado`, `/api/gerar-recibo`, `/api/pix-payload` e `/api/whatsapp/*`.
- Flag desligada → passa. `usuario_tem_acesso` false → 403. Erro → 503 (fail-closed, como o TermsGate).
- Ficam fora: `/api/admin/*`, onboarding, `/api/assinatura/*` (precisa funcionar bloqueado para pagar), landing, webhooks, health.
- Limite conhecido: usuário com 2 empresas, uma liberada, passa — essas rotas não sabem de qual empresa é o pedido.

## Frontend

- `src/lib/supabaseWorkspace.ts`: `if (error) throw error` antes do teste de vazio. O catch do init já trata erro como `'erro-init'`.
- `src/lib/assinatura.ts` (novo, no molde de `termsAcceptance.ts`): `getAcessoWorkspace(id)` via `rpc('acesso_workspace')`, **lança** em erro.
- `src/App.tsx`:
  - estado `acesso: 'checking' | 'sem-empresa' | 'pendente' | 'bloqueado' | 'liberado' | 'erro'`, resetado no logout como o `termsStatus` (:219-221);
  - init: sem empresa → `'sem-empresa'` só com a flag (desligada mantém o `signOut('sem-acesso')` de hoje); com empresa e flag → `getAcessoWorkspace` **antes** do `initialize` (pendente/bloqueado não carregam dados nem realtime); erro da rpc → `'erro'`, sem signOut;
  - render, depois dos 3 returns do TermsGate: `sem-empresa` → `<Onboarding/>`; `pendente` → `<AssinaturaCheckout/>`; `bloqueado` → `<AssinaturaBloqueio/>`; `erro` → "Tentar novamente" no molde de `TermsCheckError` (:109) com `reload`; `checking` → `FullscreenLoader`;
  - as telas recebem `workspaceId` por prop (o store não é tocado).
- Telas novas em `src/modules/assinatura/` — tela cheia, tokens.css, toque ≥ 44px:
  - `Onboarding.tsx`: nome da empresa + segmento; `apiFetch('/api/onboarding/empresa', …, 0)`; sucesso → `window.location.reload()` (padrão `WorkspaceSwitcher.tsx:71`); "Sair".
  - `AssinaturaCheckout.tsx` (texto aprovado em 11/11/2026, entra na R3: "Pague com cartão de crédito para a renovação ser automática.", porque a fatura do Asaas também oferece débito e, no débito, cada mês vira fatura manual): R$ 147/mês (`PRICING`), `precos.inclui`, `precos.selos`; CPF/CNPJ só se o gateway exigir; "Assinar com cartão" → checkout → `location.href` na mesma aba (o navegador interno do Instagram/Facebook bloqueia aba nova). Volta com `?assinatura=retorno` → `sincronizar` uma vez e reconfere; ainda pendente → "Pagamento em processamento" + "Atualizar".
  - `AssinaturaBloqueio.tsx`: "assinatura em atraso há mais de 15 dias" + "seus dados estão guardados"; "Regularizar" → `regularizar` → `location.href`; "Já paguei" → `sincronizar` + reload; cancelada vencida → "Assinar de novo" (checkout); "Falar com a equipe" (`src/lib/support.ts`), também para pedir exportação dos dados; "Sair".
- **Configurações → aba "Assinatura"** (`src/modules/settings/Settings.tsx`, entra no array de :14-17): lê `assinaturas` com `.eq('workspace_id', workspaceId)` (regra 12) e formatter em `src/store/formatters.ts` (regra 10). Mostra status (Ativa / Em atraso / Cancelada — acesso até dd/mm / Cortesia), pago até e R$ 147/mês. Owner: "Regularizar" (em atraso) e "Cancelar assinatura" com confirmação (Termos §5: acesso até o fim do período pago; reembolso da garantia pela equipe). Sem trocar cartão.
- `src/hooks/useIsAdmin.ts`: `apiFetch('/api/admin/me', {}, 0)` → `res.ok`. Owners comuns deixam de ver "Empresas" (hoje já recebem 403).
- `src/components/TermsGate.tsx` (só copy, na R6): "Atualizamos nossos termos" e "Para continuar usando" ficam falsos para quem é novo → texto neutro, verdadeiro nos dois casos (ex.: "Antes de continuar" / "Para usar o VRTX CRM…"). Aprovar o texto na rodada.
- `feature-flags.json`: `ASSINATURA_ATIVA` liga cadastro + gate + bloqueio no backend juntos. Desligar = comportamento de hoje. No front é build-time (redeploy no Vercel); no back, `pm2 restart`.
- Landing (`src/modules/auth/landing/landingContent.ts`), na R6 — textos que ficam falsos com o cadastro aberto:
  - `loginCta.acessoTitulo` "Já é cliente?" e `acessoTexto` "Acesso liberado para clientes VRTX." (:610-611);
  - FAQ "Como começo?" (:579), que hoje só fala da equipe no WhatsApp;
  - `accessNotice['sem-acesso']`: **revisado, continua verdadeiro** — com a flag ligada nunca aparece (quem não tem empresa vai para o cadastro); só aparece com a flag desligada, onde ainda é o caso. Fica como está;
  - LISTA PROIBIDA no `innerText` das telas novas e da landing.

## Termos e Privacidade — o que muda (não alterar antes da R5)

Termos (`docs/legal/02-termos-de-uso.md`):
- §3: cadastro pelo próprio cliente; quem cadastra vira titular (owner), declara poder contratar pela empresa e responde pelo pagamento; dados verdadeiros (inclui CPF/CNPJ quando pedido).
- §4: plano vigente (Básico, R$ 147/mês por empresa, cartão de crédito, cobrança mensal na data da contratação); "(mensal/anual)" vira mensal; acesso liberado após a confirmação do 1º pagamento; nomear o processador escolhido (ou manter genérico).
- §4.3: de "poderá ser suspenso" para regra objetiva — 15 dias após o vencimento sem pagamento o acesso é bloqueado e os dados ficam preservados; definir o que significa "persistindo… poderá ser encerrada" (prazo + aviso antes, ligando à §8.4 da Privacidade). Nada automático.
- §4.4: reativação automática quando o pagamento é confirmado.
- §5: cancelamento pelo app (Configurações > Assinatura); acesso até o fim do período pago; garantia: pedido pelo contato, e o estorno encerra o acesso na hora.

Privacidade (`docs/legal/01-politica-de-privacidade.md`):
- §3.2: CPF/CNPJ (se o gateway pedir) e dados da assinatura (status, datas, ids do gateway). "Não armazenamos dados de cartão" continua. **Incluir o celular** (obrigatório no checkout desde a decisão de 11/11/2026): repassado ao gateway como `mobilePhone` para os avisos de cobrança por SMS, não gravado no banco nem em log.
- §5: nomear o gateway escolhido, finalidade e local; **incluir o celular entre os dados compartilhados com o gateway** (finalidade: avisos de cobrança por SMS).
- §7: retenção dos registros de cobrança e do log de webhook (prazo legal fiscal — confirmar com o parecer jurídico, sem inventar número).
- §8.4: bloqueio por inadimplência ≠ cancelamento: dados preservados; canal para pedir exportação durante o bloqueio.
- `TERMS_VERSION` (`src/lib/terms.ts:15`) muda → todos reaceitam, isentos inclusive.

## Rodadas (1 commit cada, sem push até o aceite; `_build/current-state.md` ao fim de cada uma)

| # | Rodada | Arquivos | Risco |
|---|---|---|---|
| R0 | Pré-requisitos invisíveis: erro ≠ sem empresa; `useIsAdmin` pelo backend | `supabaseWorkspace.ts`, `useIsAdmin.ts`, `server.js` (`/api/admin/me`) | Baixo. Se o id do Gabriel não estiver em `ADMIN_USER_IDS` na VPS, ele perde o menu — conferir antes |
| R1 | Banco: tabelas, RLS, grants, funções, seed | migration (SQL aprovado antes de aplicar) | Médio. Nada lê ainda: impacto zero se os grants estiverem certos |
| R2 | Gateway (sandbox) + webhook + rotas de assinatura + `/api/onboarding/empresa` + `criar-empresa` grava `assinaturas` (isento) | `utils/billing/`, `server.js`, envs na VPS | Médio. O front ainda não chama nada. Falha de webhook pausa a fila do gateway (sandbox) |
| R3 | Gate no app + telas Checkout/Bloqueio + bloqueio no backend + flag (sai **desligada**) | `App.tsx`, `src/lib/assinatura.ts`, `src/modules/assinatura/*`, `server.js`, `feature-flags.json` | **Alto**: erro no gate trava todo mundo. Mitigação: retry em vez de bloqueio no erro, seed conferido, flag |
| R4 | Configurações > Assinatura | `Settings.tsx`, `formatters.ts` | Médio (cancelar é irreversível no gateway → confirmação) |
| R5 | Termos + Privacidade + `TERMS_VERSION` | `docs/legal/*`, `src/lib/terms.ts` | Baixo técnico, alto jurídico. Revisão do Gabriel antes |
| R6 | Cadastro self-service + textos que ficam falsos + liga a flag + chaves de produção | `Onboarding.tsx`, `App.tsx`, `TermsGate.tsx` (copy), `landingContent.ts`, `feature-flags.json` | **Alto**: abre a porta. Exige R1–R5 em produção |
| R7 | Botão "Assinar" na landing (antes do tráfego pago) | `landing/*`, `landingContent.ts` | Baixo |

Ordem de deploy obrigatória: a migration (R1) aplicada e conferida **antes** de qualquer front que chame a `rpc`; backend antes do front em R0, R3 e R6. Regra de ouro do `server.js` (ler inteiro, mapear consumidores) em R0, R2 e R3.

Migrations sempre via MCP (`apply_migration`), uma por vez. **NUNCA `supabase db push`**: `supabase/migrations/` e `schema_migrations` divergem (ver Dívida Técnica no `current-state.md`).

**Andamento:** R0 ✅ concluída em 09/11/2026 e testada no navegador em 10/11/2026 (admin vê "Empresas", inclusive onde é `admin` e não `owner`; owner comum simulado não vê; erro de rede no init → `'erro-init'`). Push feito em 10/11/2026; falta o deploy do backend na VPS e a conferência em produção (detalhes em `_build/current-state.md`). R1 ✅ aplicada em 10/11/2026: `supabase/migrations/20261110000000_create_assinaturas.sql`, registrada no banco como `20261110194050`; as 3 funções ficaram `SECURITY INVOKER`; testes como anon, authenticated e service_role, ramo de criação (bloco abortado, contagens iguais) e advisor de segurança ok; commit sem push. **R2** (11–12/11/2026, Asaas sandbox): gateway **Asaas, fluxo 1** — assinatura `CREDIT_CARD` criada pela API **sem cartão**, cliente paga a 1ª cobrança na fatura do Asaas (`invoiceUrl`), o cartão fica gravado na assinatura e as próximas são automáticas (sandbox + suporte do Asaas em 11/11); fluxo 2 (Asaas Checkout) descartado: perde o `externalReference` (assinatura vem com `null`, ligada só por `checkoutSession`), cria outro cliente e não deixa configurar as notificações antes da 1ª cobrança. `utils/billing/index.js` + `asaas.js`, rotas `/api/onboarding/empresa`, `/api/assinatura/{checkout,regularizar,cancelar,sincronizar}`, `/webhook/assinatura/:gateway`; `criar-empresa` grava a linha isenta. "Regularizar" = link da fatura em aberto (pagar com outro cartão troca o cartão da renovação; testado nos dois fluxos). Celular obrigatório no checkout (repassado como `mobilePhone`, não gravado). Checkout abandonado: 1ª cobrança vencida de assinatura nunca paga → o webhook remove a assinatura e o workspace segue `pendente`. **A R3 abre a porta** (`ASSINATURA_ATIVA` no `feature-flags.json`, junto com o gate do app): até lá onboarding e `/api/assinatura/*` respondem 404 (exceto `ASSINATURA_ROTAS_TESTE=true` no `.env` local). **A R6 liga `ASAAS_PRODUCAO_LIBERADA=true`** junto com as chaves de produção: fora do sandbox, sem ela, `/api/assinatura/*` responde 503. Eventos do webhook, `sendType SEQUENTIALLY`: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_UPDATED`, `PAYMENT_DELETED`, `PAYMENT_RESTORED`, `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_REFUND_IN_PROGRESS`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_CHARGEBACK_DISPUTE`, `PAYMENT_AWAITING_CHARGEBACK_REVERSAL`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`, `PAYMENT_REPROVED_BY_RISK_ANALYSIS`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_INACTIVATED`, `SUBSCRIPTION_DELETED`. Estorno (corta o acesso e cancela) = `PAYMENT_REFUNDED`, `PAYMENT_REFUND_IN_PROGRESS`, `PAYMENT_CHARGEBACK_REQUESTED`; `PAYMENT_PARTIALLY_REFUNDED` só consulta. Só o nosso cancelar e o estorno gravam `cancelada_em` (congelam a linha); pausa (`INACTIVE`) ou remoção pelo painel do Asaas viram `cancelada` sem congelar. **Pergunta 1 pendente de prova no sandbox (`pay_0_ell24973u32cr8`); conferir em 13/11; a R6 só liga com ela = sim.** Detalhes e testes em `_build/current-state.md` ("Cobrança R2 (Asaas sandbox)").

## Reaproveitar

- `getSupabaseAdmin` (`server.js:2034`), `requireAuth` (:425), `requireAdmin` (:446), `strictLimiter` (:408), `safeEqual` (:20), dono via service_role com filtro explícito (`assertInstanceOwnership`, :2292), validação + log sem dado pessoal (`/api/landing/contato`, :509), `featureFlags` (:253).
- `apiFetch(..., 0)` sem retry (`LandingContato.tsx`); `window.location.reload()` (`WorkspaceSwitcher.tsx:71`); `TermsCheckError` (`App.tsx:109`); `termsAcceptance.ts` (lança no erro).
- `PRICING`, `precos.inclui`, `precos.selos`, `CONTATO_SEGMENTOS` (`landingContent.ts`); `src/lib/support.ts`.
- Teste de RLS via MCP com `SET LOCAL ROLE authenticated` + claims (padrão da auditoria de 23/09).

## Verificação

- Toda rodada: `tsc --noEmit`, build com `--outDir` no scratchpad (não recriar `dist/`), `node --check server.js`.
- R1 (MCP), como `authenticated`: lê só a própria `assinaturas`; INSERT/UPDATE → 42501; `assinatura_eventos` inacessível; `rpc acesso_workspace` = `liberado` nos 6 workspaces; `criar_empresa_onboarding` e `usuario_tem_acesso` sem EXECUTE; `get_advisors` (security) sem alerta novo.
- R2 (sandbox, workspace de teste — não há banco de staging, então grava no banco de produção): webhook válido aplica; repetido → "duplicado" sem reprocessar; assinatura inválida → 401; desconhecida → 200 + erro gravado; fora de ordem não regride `periodo_fim`; onboarding com duplo envio → 1 empresa só.
- R3 (dev local com a flag ligada contra o banco): os 6 workspaces abrem normal; workspace de teste em `pendente` → checkout; `periodo_fim` = agora − 16 dias → bloqueio; `rpc` falhando → "Tentar novamente", sem signOut; refocar a aba (TOKEN_REFRESHED) não remonta; PDF de usuário bloqueado → 403. **Pedir OK antes de alterar linha de teste no banco.**
- R6 (E2E): conta Google nova → termos → cadastro → checkout sandbox → webhook → app abre; Regularizar e Cancelar no sandbox; donos de FL Art Metal, Ítalo e Vértice entram como antes; LISTA PROIBIDA; depois, chaves de produção e 1 cobrança real com estorno (garantia).

## Fora da v1

Pix/boleto · trocar cartão · RLS nas 14 tabelas · plano Completo e anual · convite de equipe · NFS-e da assinatura · exclusão automática · UI de "isento" no AdminEmpresas (via SQL por enquanto) · migrar `criar-empresa` para a função atômica · rechecar o acesso com o app já aberto (o bloqueio vale no próximo boot).

## Pendências do Gabriel

- Escolher o gateway (antes da R2), criar conta e chaves sandbox/produção, cadastrar o webhook `https://api.vrtxcrm.com.br/webhook/assinatura/<gateway>` com token/segredo.
- ~~Cadastrar o site `https://www.vrtxcrm.com.br` em **Minha Conta → Informações** também na conta real do Asaas, **antes da R6**: sem domínio cadastrado, o Asaas recusa o `callback` da assinatura ("Não há nenhum domínio configurado em sua conta. Cadastre um site em Minha Conta na aba Informações.").~~ **Resolvida:** cadastrado na conta real em 11/11/2026 (no sandbox também, no mesmo dia).
- **Antes da R6 — cartão de débito na fatura (perguntas enviadas ao suporte do Asaas em 11/11/2026, aguardando resposta):** a fatura das cobranças da assinatura (`billingType CREDIT_CARD`) oferece "Cartão de Crédito" e "Cartão de Débito", e não achei na doc nem na Central de Ajuda como desligar o débito. No débito, o pagador informa o cartão a cada cobrança: a 1ª paga no débito tira a renovação automática. Perguntas: (1) dá para desligar o débito nas faturas de assinatura no cartão de crédito? (2) pagar uma fatura posterior (a do "Regularizar") no débito apaga o cartão de crédito gravado?
- ~~**Antes da R6**, confirmar com o suporte do Asaas, na conta real, que a assinatura no cartão paga pela fatura (sem enviar o cartão pela API) renova sozinha **sem tokenização habilitada** — ou pedir a habilitação.~~ **Resolvida (fonte: suporte Asaas, 11/11/2026, conta real):** quando o cliente paga a 1ª fatura (`invoiceUrl`) com cartão de **crédito**, o cartão fica salvo e as cobranças seguintes são automáticas nele. A tokenização via API é um recurso à parte (para reutilizarmos o cartão) e não é necessária para isso. O suporte condicionou a renovação ao cliente escolher **crédito** na fatura: ver a checagem do cartão de débito no relatório da Etapa B.
- ~~Confirmar o próprio id em `ADMIN_USER_IDS` na VPS~~ — conferido em 09/11/2026: `dd50c052-b7a3-445c-b027-2668ac83f60c` é `verticedigital.ads@gmail.com`.
- Aprovar textos: TermsGate e landing (R6), Termos/Privacidade (R5), botão Assinar (R7).

## Feito na aprovação (09/11/2026, só documentação)

1. `_build/current-state.md` → "Dívida Técnica Conhecida", **prioridade ALTA**: `workspaces.owner_id` → `auth.users ON DELETE CASCADE`; as 14 tabelas de dados + `workspace_members` + `workspace_settings` caem em cascata com o workspace, então apagar o usuário dono apaga a empresa inteira (FL Art Metal e Vértice têm `owner_id` preenchido; conferido via `pg_constraint`). Correção proposta: `ON DELETE SET NULL`, em rodada própria **depois da cobrança**. Até lá: **nunca excluir usuário pelo painel do Supabase**.
2. Linha em "Últimas Mudanças" apontando para este plano.
3. Este arquivo, cópia do plano aprovado.
4. R0 liberada pelo Gabriel em 09/11/2026 (ver Andamento).

## Achados fora do escopo (só reportar)

- `criar-empresa` não é atômico: falha no vínculo deixa empresa órfã (`server.js:2141`).
- `workspaces.owner_id` com cascata: registrado como Dívida Técnica ALTA (item 1 acima).
