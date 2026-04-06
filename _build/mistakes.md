# Mistakes Log — CRM System

> Erros que custaram tempo e podem voltar.
> Consulte quando algo inesperado acontecer — pode já ter acontecido antes.
> Seja brutal na descrição — suavizar não ajuda.

---

## FORMATO DE ENTRADA

### [2026-04-06] — Conversão snake_case inconsistente entre slices
**O que aconteceu:** orcamentoSlice.ts tem format() para converter snake→camel. leadSlice.ts não tem — campos novos do realtime podem retornar snake_case no frontend.
**Causa raiz:** Padrão não foi definido antes de criar os slices. Cada um foi implementado de forma independente.
**Como prevenir:** Todo slice novo precisa de format() explícito antes do primeiro uso. Consultar patterns.md antes de criar slice.
**Impacto:** Campo novo no Supabase pode aparecer como undefined no frontend se o slice não mapear a conversão.

---

### [2026-04-06] — Lógica de cálculo de orçamento duplicada em 3 locais
**O que aconteceu:** calcularOrcamento() existe em domain/ mas foi replicado em orcamentoSlice.ts e Orcamentos.tsx.
**Causa raiz:** Crescimento incremental sem consultar domain/ antes de implementar.
**Como prevenir:** Sempre consultar patterns.md antes de qualquer cálculo. Se existe em domain/ — use, não recrie.
**Impacto:** Mudança no cálculo precisa ser feita em 3 lugares. Risco de divergência silenciosa entre valores.

---

### [2026-04-06] — startRealtime() sem unsubscribe garantido
**O que aconteceu:** 4 canais realtime abertos em useStore.ts sem cleanup explícito. Hot-reload pode acumular listeners duplicados.
**Causa raiz:** Proteção por flag interna — frágil em ambiente de desenvolvimento intenso.
**Como prevenir:** Nunca chamar startRealtime() fora do fluxo de inicialização. Nunca remover a flag de proteção existente.
**Impacto:** Listeners duplicados causam updates duplos no estado — difícil de debugar.

---

### [2026-04-06] — Histórico com strings hardcoded em vez de enum
**O que aconteceu:** h.tipo === 'ia_analysis' espalhado no código sem enum centralizado.
**Causa raiz:** Implementação rápida sem definir contrato de tipos primeiro.
**Como prevenir:** Qualquer novo tipo de histórico deve ser adicionado ao enum em src/types/ antes de usar.
**Impacto:** Typo em qualquer string quebra a lógica silenciosamente — sem erro TypeScript.