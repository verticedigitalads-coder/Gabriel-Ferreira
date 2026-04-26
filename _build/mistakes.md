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
**Status:** ✅ CORRIGIDO — formatters.ts centralizado criado, todos os slices usando.

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
**Status:** ✅ CORRIGIDO — cleanupRealtime() implementado, chamado no logout e troca de workspace.

---

### [2026-04-06] — Histórico com strings hardcoded em vez de enum

**O que aconteceu:** h.tipo === 'ia_analysis' espalhado no código sem enum centralizado.
**Causa raiz:** Implementação rápida sem definir contrato de tipos primeiro.
**Como prevenir:** Qualquer novo tipo de histórico deve ser adicionado ao enum em src/types/ antes de usar.
**Impacto:** Typo em qualquer string quebra a lógica silenciosamente — sem erro TypeScript.

### [2026-04-06] — Strings hardcoded em tipos de histórico causavam bugs silenciosos

**O que aconteceu:** seedData.ts usava 'status' em vez de 'status_change'.
AILeadModal.tsx usava 'ia' em vez de 'ia_analysis'. Sem erro TypeScript.
**Causa raiz:** Tipo definido como union de strings — typo não é detectado em atribuição.
**Como prevenir:** Sempre usar HISTORICO_TIPO.X — nunca string literal direta.
**Impacto real:** Histórico de IA e mudanças de status não apareciam corretamente nesses fluxos.

### [2026-04-06] — 8 slices sem conversão snake_case padronizada

**O que aconteceu:** Apenas orcamentoSlice tinha format() explícito.
leadSlice, operacionalSlice, financeiroSlice, notaSlice, materialSlice,
cotacaoMaterialSlice, consumoMaterialSlice e useStore.ts recebiam
dados raw do Supabase sem converter snake_case → camelCase.
**Causa raiz:** Padrão não foi definido antes de criar os slices.
**Como prevenir:** Usar sempre src/store/formatters.ts — nunca mapear
campos inline fora desse arquivo.
**Impacto:** Campos como workspace_id, created_at, lead_id apareciam
como undefined em vez de workspaceId, createdAt, leadId.
**Status:** ✅ CORRIGIDO — formatters.ts centralizado, todos os slices migrados.
