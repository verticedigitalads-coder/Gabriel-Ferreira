# Estado Atual — CRM Vértice Digital

Última atualização: 28/04/2026
Versão: v2.27.0

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

## Fixes e Auditorias
- RLS Supabase: 14 tabelas, 1 policy filtrada cada
- Auditoria Codex: 6/6 bugs corrigidos
- Sanitização HTML completa nos PDFs (escapeHtml)
- Realtime cleanup no logout/troca workspace
- Logs sem PII nas rotas admin
- Idempotência básica (orcamentos + recibos)
- PDFs compactos (seções vazias colapsam)
- Fix: try/catch com fallback na busca sequencial do orçamento (server.js) — PDF gerado mesmo com Supabase inacessível

## Clientes Ativos
- FL Art Metal (metalúrgica) — ativo, usando diariamente
- GPP Móveis Planejados (marcenaria) — CRM em implantação
- Ítalo Colares Drywall — onboarding tráfego (sem CRM)

## Infraestrutura
- Frontend: Vercel (vertice-digital-crm.vercel.app)
- Backend: local via ngrok (migração VPS planejada)
- Supabase: online, RLS 100%

## Próximas Prioridades
1. Design System / UX (segunda-feira)
2. Migração backend para VPS
3. WhatsApp / Evolution API (Fases 12-15)

## Dívida Técnica Conhecida
- Bundle ~884KB
- Offline/IndexedDB não implementado
- Cálculo de orçamento duplicado em 3 locais (domain/, slice, componente)
