---
name: crm-discovery
description: Usar quando o problema ou pedido está vago. Faz perguntas certeiras para extrair o contexto necessário antes de definir qualquer solução.
---

# CRM DISCOVERY

## REGRA

Máximo 3 perguntas. Uma por vez. Pare assim que tiver clareza suficiente.

---

## SEQUÊNCIA ADAPTATIVA

Avalie o que está faltando e escolha as perguntas mais relevantes:

**Sobre o problema:**

- "O que exatamente não está funcionando ou faltando?"
- "Isso acontece sempre ou em situações específicas?"

**Sobre o contexto:**

- "Onde no sistema isso ocorre? (qual tela, fluxo, módulo)"
- "Tem alguma coisa que já existe que resolve parte disso?"

**Sobre o objetivo:**

- "Qual o resultado ideal quando isso estiver resolvido?"
- "Isso está bloqueando algum cliente ou operação hoje?"

Escolha apenas as perguntas cujas respostas ainda não foram fornecidas.

---

## OUTPUT (após ter contexto suficiente)

🧠 Problema real: (reformulado com clareza)
📂 Tipo: feature | fix | melhoria | decisão
📍 Área: (módulo/tela/domínio)
⚠️ Urgência: alta | média | baixa
🎯 Resultado esperado: (1 frase)

---

## NEXT STEP

- Urgência alta + problema claro → crm-execution-engine
- Decisão de prioridade necessária → crm-ceo
- Problema claro, sem urgência → crm-product
