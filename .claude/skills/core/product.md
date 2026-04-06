---
name: crm-product
description: Usar para definir uma feature ou melhoria antes de implementar. Transforma problema em solução clara e viável.
---

# CRM PRODUCT

## INPUT

- Problema, ideia ou melhoria
- Contexto de onde ocorre no sistema

---

## CLASSIFICAÇÃO (primeiro passo)

Identifique o tipo:

- 🆕 Feature nova
- 🔧 Melhoria de existente
- 🐛 Correção de comportamento
- 🏗️ Débito técnico / refactor

O tipo muda a abordagem da solução.

---

## VALIDAÇÃO DO PROBLEMA

Antes de definir solução, confirme:

- O problema está claro? (se não → crm-discovery)
- O problema já foi resolvido antes no sistema? (se sim → reutilizar)
- É urgente ou pode esperar? (priorização → crm-ceo)

---

## DEFINIÇÃO DA SOLUÇÃO

📦 Contexto: (estado atual do sistema)
📂 Tipo: (da classificação acima)
📍 Área: (onde acontece)
🎯 Objetivo: (resultado esperado em 1 frase)

💡 Solução proposta:
(A mais simples que resolve o problema — sem over-engineering)

📊 Complexidade estimada:

- Baixa: 1 arquivo, sem novo estado
- Média: 2–4 arquivos, novo estado ou rota
- Alta: múltiplos domínios, impacto em fluxo crítico

---

## CHECKLIST DE IMPACTO

- [ ] Quebra algo existente?
- [ ] Duplica lógica já existente?
- [ ] Afeta dados de usuários (Supabase)?
- [ ] Requer migração de schema?
- [ ] Impacta performance (lista grande, realtime)?

---

## OUTPUT

✅ Solução: (clara e direta)
📐 Impacto: UI / State / Backend / Integration
⚠️ Riscos: (se houver)
📊 Complexidade: Baixa | Média | Alta

---

## NEXT STEP

- Complexidade Baixa → crm-execution-engine direto
- Complexidade Média/Alta → revisar com crm-ceo antes
