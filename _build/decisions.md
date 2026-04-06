# Decisions Log — CRM System

> Registro de decisões arquiteturais relevantes.
> Consulte ANTES de implementar algo novo.
> Adicione APENAS decisões que impactam o futuro do sistema.

---

## FORMATO DE ENTRADA

### [2026-04-06] — Stack principal do sistema

**Contexto:** Início do CRM proprietário
**Decisão:** React + Zustand + Node.js + Supabase + Puppeteer
**Motivo:** Familiaridade, custo zero de infra inicial, Supabase cobre realtime + auth + storage em um só serviço
**Alternativas descartadas:** Firebase (vendor lock-in), Redux (verboso para o tamanho atual), Prisma (complexidade desnecessária)
**Impacto:** Toda feature nova segue esse stack — sem introduzir novas libs sem registro aqui

---

### [2026-04-06] — Zustand com slices modulares em store raiz única

**Contexto:** Necessidade de estado global compartilhado entre módulos
**Decisão:** useStore.ts compõe 11 slices via create()((...a) => ({ ...slice1(...a), ...slice2(...a) }))
**Motivo:** Acesso simples via useStore() em qualquer componente, sem prop drilling, sem Context API
**Alternativas descartadas:** Store por módulo (dificulta ações cross-domain como leadSlice chamando operacionalSlice)
**Impacto:** Qualquer novo domínio de dados = novo slice seguindo o padrão existente

---

### [2026-04-06] — Backend mínimo (server.js único)

**Contexto:** Necessidade de PDF e proxy OpenAI sem expor keys no frontend
**Decisão:** Express em server.js único — apenas para Puppeteer e proxy de IA
**Motivo:** Toda lógica de negócio fica no frontend via Supabase direto — backend só para o que não pode rodar no browser
**Alternativas descartadas:** Backend completo com ORM (over-engineering para o estágio atual)
**Impacto:** Novas rotas backend só se justificam se não puderem usar Supabase diretamente

---

### [2026-04-06] — IA híbrida (local + OpenAI)

**Contexto:** Necessidade de análise de leads sem depender de conexão
**Decisão:** iaService.ts calcula risco/urgência por regras locais primeiro. OpenAI só refina se online.
**Motivo:** Sistema funciona offline. Custo de API reduzido. Resposta mais rápida no caso comum.
**Alternativas descartadas:** Só OpenAI (dependência de internet + custo por análise)
**Impacto:** Qualquer mudança na estrutura de Lead ou historico[] afeta os dois caminhos de análise

---

### [2026-04-06] — Conversão snake_case → camelCase manual por slice

**Contexto:** Supabase retorna snake_case, TypeScript usa camelCase
**Decisão:** Cada slice tem função format() local que faz a conversão
**Motivo:** Sem camada ORM, conversão precisa ser explícita e controlada por domínio
**Alternativas descartadas:** Biblioteca de conversão automática (esconde erros, dificulta debug)
**Impacto:** Todo campo novo no Supabase precisa ser adicionado ao format() do slice relevante — fácil de esquecer
**Revisão em:** Quando migrar para ORM ou camada de adapter centralizada
