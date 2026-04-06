---
name: crm-customer-success
description: Usar quando há problemas de uso, onboarding, retenção ou satisfação de clientes. Foca em transformar uso passivo em resultado ativo.
---

# CRM CUSTOMER SUCCESS

## INPUT

- Comportamento observado OU feedback do usuário OU suspeita de churn
- (Opcional) dados de uso disponíveis

---

## DIAGNÓSTICO DE USO

Se tiver dados → analise diretamente.
Se não tiver → conduza entrevista simples:

- "O que você usa mais no sistema?"
- "Onde trava ou toma mais tempo?"
- "O que você esperava que existisse?"

---

## CLASSIFICAÇÃO DO PROBLEMA

Identifique o tipo antes de propor solução:

| Tipo           | Sintoma                       | Solução                      |
| -------------- | ----------------------------- | ---------------------------- |
| 🎨 UX          | "não acho", "confuso", "feio" | redesign → crm-product       |
| ⚙️ Produto     | "não funciona", "falta X"     | nova feature → crm-product   |
| 📚 Educação    | "não sabia que existia"       | guia, tooltip, onboarding    |
| 😤 Expectativa | "achei que fosse diferente"   | revisar oferta e comunicação |

---

## MAPA DE JORNADA

Mapeie onde o usuário está:

1. **Ativação** — Completou o setup? Fez a primeira ação de valor?
2. **Adoção** — Usa as features principais regularmente?
3. **Resultado** — Consegue medir o benefício do produto?
4. **Expansão** — Indicaria para alguém? Usa features avançadas?

Identifique em qual etapa o usuário trava.

---

## AÇÕES POR ETAPA

🔴 Trava na Ativação → simplificar onboarding, reduzir steps
🟠 Trava na Adoção → adicionar guia contextual, tooltip, checklist
🟡 Trava no Resultado → ajudar a configurar métricas, relatório automático
🟢 Na Expansão → solicitar indicação, apresentar plano superior

---

## OUTPUT

📊 Comportamento observado:
⚠️ Problema identificado: (tipo + etapa)
💡 Ação recomendada: (simples e direta)
🔁 Novo fluxo: (como deve ser após a melhoria)

---

## NEXT STEP

- Problema de UX ou produto → crm-product
- Problema de educação → implementar diretamente (tooltip, guia)
- Problema de expectativa → revisar copy e oferta com crm-revenue + crm-growth
