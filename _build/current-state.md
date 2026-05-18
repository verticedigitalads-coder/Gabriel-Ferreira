# Estado Atual — CRM Vértice Digital

Última atualização: 18/05/2026
Versão: v2.31.0

## Build
- TypeScript: 0 erros (backlog zerado em 23/04/2026)
- Warnings: 0
- Build: limpo

## Features Implementadas
- Financeiro com status (pendente/pago/vencido/a_vencer)
- Comissão da planejadora (% sobre totalBruto)
- Múltiplos orçamentos agrupados (PDF multi-orçamento)
- Template PDF profissional v2 (orçamento + recibo)
- Cores personalizáveis por workspace
- Recibo v2 + endereço no LeadDetail
- Notificações locais PWA (operacional)
- QR Code PIX nos PDFs + Copia e Cola + envio WhatsApp
- Assinatura digital (empresa + cliente, canvas + digitada)

## Design System
- Design System v2.25.1: botão "Registrar Contato" → variante secondary + ícone Phone verde (var(--success))
- Variante 'ia' adicionada no Button.tsx (roxo #a855f7 / hover #9333ea)
- Tokens atualizados: accent (#ff6a00 laranja), bg-app/sidebar/surface/surface-2/surface-3 ajustados
- Design System v2.26.0: tokens --ia + --ia-subtle adicionados; --border-accent corrigido para laranja; status badges de Recibos/Orçamentos/Financeiro/Operacional migrados para CSS vars; Settings reestruturada (4 tabs: Empresa, Documentos, Pagamentos, Dados); calendários DnD com inline styles; cores Tailwind hardcoded eliminadas em todos os módulos
- Design System v2.26.1: --bg-input definido em tokens.css (alias de --bg-surface-2); purple hardcoded zerado em IAAssistente.tsx (6 ocorrências) e LeadsList.tsx (2 ocorrências) — migrados para var(--ia) e var(--ia-subtle)
- Design System v2.26.2: hardcoded zerado em Notas.tsx (statusColors, statusIcons, stats, info banner, empty state), AuthPage.tsx (blue/gray → accent/text vars), Central.tsx (text-blue-600 × 2 → accent), OperacionalCalendar.tsx (bg-red-700 → danger)
- Design System v2.26.2 Lote A: LeadRow CSS vars (ring-blue/border-red/slate → accent/danger/text vars via inline style); Dashboard grid 2×2 mobile (Receita + Indicadores); rounded-2xl → rounded-xl em todos os Cards do Dashboard
- v2.26.3 Lote B: Painel Emergência Dashboard (leads críticos com 5+ dias sem contato, clicável → navega para lead); filtros Leads compactos mobile (busca + status na linha 1, temperatura + prioridade ocultos no mobile exceto quando filtro ativo)
- Design System v2.27.0: Bottom navigation mobile (5 abas: Início, Leads, Orçamentos, Agenda, IA), hambúrguer mantido para módulos extras (Kanban, Financeiro, Recibos, Settings)
- UX v2.27.1 Lote A: flash branco loader corrigido (index.html body+root #0f1117); touch targets header (botão sino + avatar → min 44×44px); placeholder busca leads encurtado + pl-9
- UX v2.27.2 Lote B: LeadDetail footer — Editar=primary/Excluir=ghost danger (hierarquia correta); Orçamentos — title+aria-label em Download/Editar/Excluir; OperacionalCalendar — dias vazios compactos (48px, fundo transparente, texto disabled)
- UX v2.27.3 Lote C: H1 duplicados removidos (Dashboard/Leads/Orçamentos/Settings); faixa mobile de alertas no MainLayout (abaixo do header, md:hidden); LeadRow — nome text-base, serviço text-xs disabled, badge inline semântico por nível, telefone tertiary, valor tabular-nums
- UX v2.27.4 Lote D: Orçamentos mobile — Editar/Excluir/Assinatura ocultos em mobile (hidden sm:flex), PDF+PIX sempre visíveis; Operacional — formulário Nova Tarefa colapsável (toggle com botão "+ Nova Tarefa"); Leads — "Criar com IA" rebaixado para ghost+color ia, texto abreviado em mobile
- UX v2.27.5 Lote E: Sidebar — item ativo com faixa accent (borderLeft 3px + accent-subtle bg + fontWeight 600) e section headers 10px/0.7 opacity; Dashboard — card Saúde CRM → faixa fina (~40px) com cor dinâmica por status (SAUDÁVEL/ATENÇÃO/CRÍTICO); Header — botão Sair e email removidos do header; avatar vira dropdown (nome + email + Sair) com overlay para fechar; avatar estático hardcoded removido do HeaderGlobal; Input/TextArea/Select — borda border-strong para melhor contraste visual
- UX v2.27.6 Lote F (final auditoria UX Cowork): StatCard — props suffix+valueStyle adicionadas (sem quebrar usos existentes); Dashboard Indicadores — Score Operacional com "/100", Tarefas Críticas com cor semântica (danger/success); Orçamentos — hierarquia invertida nas linhas: nome do cliente como título principal, numero ORC como texto secundário mono discreto; Settings grid já era cols-1/md:cols-2 (sem mudança necessária); botão menu mobile — aria-label adicionado
- Hotfix v2.27.7: LeadsList — Select de status envolto em wrapper shrink-0 w-[140px] (busca não colapsa mais); LeadRow — container flex-col/sm:flex-row responsivo (nome visível em 375px, valor+botões na linha 2 mobile); App.tsx — LoadingFallback e loader "Carregando dados..." migrados para fundo #0f1117 + spinner laranja (sem flash branco)
- Hotfix v2.27.8: Operacional — H1 "Painel Operacional" removido (duplicado com header); LeadRow badge "● Baixo" — color migrado de --text-disabled para --text-secondary (contraste WCAG AA); Dashboard Score Comercial — suffix " pts" adicionado (contexto de escala)
- UX v2.27.9: LeadRow — TempDot (dot 8px colorido por temperatura: danger/warning/info) substituiu TemperatureBadge; badge "✦ IA" (var(--ia)/var(--ia-subtle), 10px, rounded) substituiu "IA Analisado" rounded-full
- UX v2.28.0: Dashboard — Foco Hoje aprimorado (counter badge no header, TempDot 7px + alerta "Xd" por lead, min-h-44px); StatCard prop delta? ReactNode adicionada (Card.tsx); deltas em Receita Provável (Meta: R$X), Score Comercial (N fechados), Tarefas Críticas (N atrasadas)
- Fix v2.28.1: Badge.tsx — variant `info` corrigida (--info-subtle/--info azul, era accent laranja); variant `ia` adicionada (--ia-subtle/--ia roxo); StatusBadge `novo` → info, `atendimento` → ia (era bg-purple-100 hardcoded); PriorityBadge bullet ● adicionado, text-[10px] font-semibold
- Rebrand v2.28.9: AuthPage substituída por landing page SaaS VRTX (nav sticky, hero com mockup do dashboard, 6 feature cards, 3 steps, 3 depoimentos, CTA com botão Google + trust row, footer); fluxo OAuth `supabase.auth.signInWithOAuth` preservado intacto; CSS prefixado `lp-*` para isolar do design system interno
- Rebrand v2.28.8: favicon.ico adicionado ao index.html; title/description/apple-mobile-web-app-title → "VRTX CRM"; vite.config.ts PWA manifest name/short_name atualizados; Sidebar logo "CRM"→"VX", texto "CRM Pro"→"VRTX"
- Fix v2.28.7: LeadRow borderTop preservado — usa borderTopWidth/Style/Color separados + borderRight/Bottom/LeftColor para isSelected/alertaContato (borderColor shorthand não sobrescreve mais); sub-header mobile removido do MainLayout (redundante com HeaderGlobal); HeaderGlobal h1 text-sm→text-base + truncate, data hidden sm:block→truncate (visível mobile)
- UX v2.28.6: Orçamentos — botões PDF e PIX ganham label "PDF"/"PIX" visível apenas em mobile (sm:hidden, gap-1); IAAssistente — card onboarding (ia-subtle, border ia) exibido enquanto nenhum lead foi analisado, some após primeira análise
- UX v2.28.5: Empty states diferenciados — Leads (filtro ativo→🔍+limpar / vazio→👥+CTA), Orcamentos (📄+CTA), Recibos (🧾+contexto); Dashboard hierarquia h2 — Estoque Crítico/Visitas Hoje/Maiores Oportunidades rebaixados para text-sm uppercase secondary; Sidebar — badge danger (leads críticos) no Dashboard, badge count neutro (leads ativos) no Leads
- UX v2.28.4: Financeiro — card "Resultado do Mês" (receitas−despesas do filtro atual, cor semântica success/danger) no topo da lista; LeadsList — filtros Temperatura+Prioridade migrados de selects para chips horizontais com scroll universal (mobile+desktop), bloco mobile condicional removido
- UX v2.28.3: BottomNav — labels 9px→11px, height 64→72, ícone inativo #52525b, pill accent 16×3px no topo do item ativo; LeadRow — borderTop 3px colorida por prioridade, TempDot→pill emoji (🔥/☀️/❄️), PriorityBadge sem bullet, pill com border sutil rounded-[99px]; MainLayout — sub-bar mobile com nome do módulo abaixo do header
- UX v2.28.2: OrcamentoForm alinhado com design system — Multiplicador com pills atalho (Sem/+10%/+15%/+20%) + input customizado; seção ITENS com wrapper bordado, header uppercase e sub-header tabular (DESCRIÇÃO/QTD/UNIT/TOTAL, hidden mobile); label "CLIENTE" uppercase acima dos selects, grid responsive cols-1/sm:cols-2; TOTAL em accent laranja text-xl; botões finais full-width flex-1 min-h-[48px] com "Salvar Rascunho"/"Enviar" no modo criação

- Fix v2.29.2: server.js — `urlToBase64` helper adicionado; `empresa_logo_url` convertida para base64 antes de inserir no HTML em orçamento simples, agrupado e recibo v2 (logo quebrada no Puppeteer VPS corrigida)
- Fix v2.29.1: Score Operacional — suffix corrigido de "/100" → " pts" (escala é penalidade ilimitada, não 0-100); IAAssistente — data `dataIdealFollowUp` formatada com `toLocaleString('pt-BR')` em vez de ISO bruto; botão "Analisar Lead" — wrapper `position:relative; z-index:10` adicionado para garantir clicabilidade

## Fixes e Auditorias
- RLS Supabase: 14 tabelas, 1 policy filtrada cada
- Auditoria Codex: 6/6 bugs corrigidos
- Sanitização HTML completa nos PDFs (escapeHtml)
- Realtime cleanup no logout/troca workspace
- Logs sem PII nas rotas admin
- Idempotência básica (orcamentos + recibos)
- PDFs compactos (seções vazias colapsam)
- Fix: try/catch com fallback na busca sequencial do orçamento (server.js) — PDF gerado mesmo com Supabase inacessível
- Segurança v2.29.0 — hardening pré-VPS aplicado: (1) `VITE_OPENAI_API_KEY` removida do frontend (chave deixou de ir no bundle JS público); env backend renomeada para `OPENAI_API_KEY`; (2) rotas `/api/admin/*` protegidas por `requireAuth` (Supabase JWT via Bearer) + `requireAdmin` (whitelist `ADMIN_USER_IDS` env, fail-closed); (3) CORS manual substituído pelo pacote `cors` com whitelist via `CORS_ALLOWED_ORIGINS` (default localhost+Vercel); (4) `helmet` adicionado (CSP/COEP off por conta dos PDFs inline); (5) `express-rate-limit` adicionado — globalLimiter 100 req/min, strictLimiter 10 req/min em `/api/chat`, `/api/gerar-orcamento`, `/api/gerar-orcamento-agrupado`, `/api/gerar-recibo`, `/api/admin/criar-empresa`; (6) `express.json({ limit: '10mb' })` + `urlencoded` com mesmo limit

## Clientes Ativos
- FL Art Metal (metalúrgica) — ativo, usando diariamente
- GPP Móveis Planejados (marcenaria) — CRM em implantação
- Ítalo Colares Drywall — onboarding tráfego (sem CRM)

## Infraestrutura
- Frontend: Vercel (vertice-digital-crm.vercel.app)
- Backend: local via ngrok (migração VPS planejada)
- Supabase: online, RLS 100%

## WhatsApp / Evolution API
- Fase 12 concluída: webhook `/webhook/evolution` no server.js (POST, recebe `messages.upsert`)
- `whatsapp_instances` criada no Supabase (FK → workspaces, RLS, `instance_name UNIQUE`)
- `whatsapp_messages` já existia no Supabase (RLS ativa)
- Mapeamento instance_name → workspace_id via tabela `whatsapp_instances`
- Fallback: `DEFAULT_WORKSPACE_ID` env se instance não mapeada
- Evolution API: https://evo.vrtxcrm.com.br
- Auditoria UX WhatsApp v2.31.1: 3 fixes — `color:'#fff'` (×2 avatares) → `var(--accent-foreground)`; `focus:ring-2` → `focus:ring-2 focus:ring-[var(--accent)]` no input de busca; zero CSS hardcoded restante
- Fase 12 Passo 6 concluída: módulo WhatsApp (somente leitura) no frontend — `createWhatsappSlice` (fetchConversations agrupa por remote_jid no cliente, fetchMessages, setSelectedConversation), `formatWhatsappMessage` em formatters.ts, tipos `WhatsappMessage`/`WhatsappConversation`; página split-panel `src/modules/whatsapp/WhatsApp.tsx` (lista 30% + chat 70% desktop / fullscreen mobile com voltar, busca, bolhas por from_me, tipos não-texto com ícone+label, auto-scroll); canal realtime `realtime-whatsapp-messages` (INSERT) em useStore.startRealtime() append-only; item "WhatsApp" na sidebar (seção Comercial, ícone MessageCircle); rota `whatsapp` no ModuleRouter. BottomNav inalterada (5 itens, máximo)

## Próximas Prioridades
1. Fase 13: refinos UI WhatsApp (envio de mensagens — depende de Fases 14-15)
2. Migração backend para VPS
3. Fases 14-15 Evolution API (envio de mensagens, templates)

## Pendências Manuais
- Deletar nota órfã id:58118722 na tabela `notas` (dado de teste, workspace Vértice Digital) — fazer via Supabase Dashboard

## Dívida Técnica Conhecida
- Bundle ~884KB
- Offline/IndexedDB não implementado
- Cálculo de orçamento duplicado em 3 locais (domain/, slice, componente)
