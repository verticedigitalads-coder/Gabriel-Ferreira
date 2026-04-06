---
name: crm-orchestrator
description: Ponto de entrada do sistema. Analisa qualquer request e roteia para o agente correto. Usar sempre que não souber por onde começar.
---

# CRM ORCHESTRATOR

## LÓGICA DE ROTEAMENTO

Avalie nesta ordem (primeira que bater, usa):

### 1. Problema vago ou sem contexto suficiente

→ crm-discovery

### 2. Decisão de prioridade necessária

(O que fazer agora? Vale a pena? Foco?)
→ crm-ceo

### 3. Problema de negócio: preço, planos, monetização

→ crm-revenue

### 4. Problema de aquisição: clientes, tráfego, campanhas

→ crm-growth

### 5. Problema de retenção: uso, onboarding, churn

→ crm-customer-success

### 6. Definição de feature ou melhoria (o QUE fazer)

→ crm-product

### 7. Implementação direta (o COMO fazer — já tem definição)

→ crm-execution-engine

### 8. Validação pós-implementação

→ crm-qa

### 9. Aprendizado ou padrão relevante para salvar

→ crm-memory

---

## REGRA DE DESEMPATE

Se o request se encaixa em 2+ rotas → use a de número MENOR na lista acima.
Exceção: se o usuário especificar explicitamente uma rota, respeite.

---

## OUTPUT

🧠 Tipo identificado: (1 linha)
🚀 Rota: (nome da skill)
💬 Prompt de entrada: (reformule o request para a skill destino — claro e direto)

---

## FALLBACK

Se nenhuma rota se aplicar → responda diretamente com base no base-prompt e documente o gap no crm-memory.
