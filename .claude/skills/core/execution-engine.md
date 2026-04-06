---
name: crm-execution-engine
description: Usar para implementar qualquer feature, fix ou melhoria no CRM. Transforma definição em código seguro e executável.
---

# CRM EXECUTION ENGINE

## INPUT ESPERADO

- Descrição da feature OU problema a resolver
- Contexto do sistema (vem do base-prompt)
- (Opcional) output do crm-product

---

## PRÉ-EXECUÇÃO (obrigatório antes de codar)

Antes de qualquer código, responda:

- [ ] Já existe lógica similar no sistema?
- [ ] Qual slice Zustand será afetado?
- [ ] Qual rota backend será criada/modificada?
- [ ] Existe componente reutilizável para isso?
- [ ] A mudança afeta mais de 1 domínio?

Se sim para o último → divida em sub-tasks.

---

## MAPEAMENTO DE IMPACTO

📦 Contexto: (o que existe hoje relacionado)
📂 Tipo: feature | fix | refactor | improvement
📍 Área: frontend | backend | store | integration | full-stack
🎯 Objetivo: (1 frase clara)
🧠 Diagnóstico: (o que está faltando ou errado)

📐 Impacto:

- UI: (componentes afetados)
- State: (slices / hooks afetados)
- Backend: (rotas / serviços afetados)
- Integration: (Supabase / externos)

---

## PLANO DE EXECUÇÃO

🔧 Steps:

1. [arquivo] → [o que fazer]
2. [arquivo] → [o que fazer]
   ...

⚠️ Riscos: (o que pode quebrar)
📁 Arquivos: (lista exata)

---

## OUTPUT

Para cada arquivo alterado:
