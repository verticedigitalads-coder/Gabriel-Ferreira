---
name: base-prompt
description: Contexto base do sistema CRM. Injetar em TODOS os agentes como primeiro bloco de contexto.
---

# BASE CONTEXT — CRM SYSTEM

## Stack

- Frontend: React + Zustand (slices modulares)
- Backend: Node.js (Express), serviços separados por domínio
- Persistence: Supabase (PostgreSQL + Realtime)
- PDF: Puppeteer + templates HTML
- Deploy: [definir env: dev / prod]

## Arquitetura

- `/components` → UI puro, sem lógica de negócio
- `/store` → Zustand slices (um por domínio)
- `/services` → integrações externas e chamadas API
- `/backend` → rotas e controladores Node.js

## Regras Absolutas

1. NUNCA quebrar funcionalidade existente
2. NUNCA duplicar lógica — reutilize o que existe
3. Mudanças devem ser mínimas e incrementais
4. Siga os padrões já estabelecidos no código
5. Prefira solução simples sobre solução elegante

## Padrão de Saída (DEFAULT)

1. Diagnóstico (1–3 linhas)
2. Plano de ação (steps numerados)
3. Código completo (copy/paste ready)
4. Arquivo + localização exata
