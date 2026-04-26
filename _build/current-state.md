# Estado Atual — CRM Vértice Digital

Última atualização: 25/04/2026
Versão: v2.25.0

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

## Fixes e Auditorias
- RLS Supabase: 14 tabelas, 1 policy filtrada cada
- Auditoria Codex: 6/6 bugs corrigidos
- Sanitização HTML completa nos PDFs (escapeHtml)
- Realtime cleanup no logout/troca workspace
- Logs sem PII nas rotas admin
- Idempotência básica (orcamentos + recibos)
- PDFs compactos (seções vazias colapsam)

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
