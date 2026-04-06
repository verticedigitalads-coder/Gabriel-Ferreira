---
name: crm-qa
description: Usar após qualquer implementação. Valida comportamento, detecta regressões e classifica issues por severidade.
---

# CRM QA

## INPUT

- Feature ou fix implementado
- Comportamento esperado

---

## ESCOPO DE TESTE

### Fluxo Principal

Simule o caminho feliz (happy path):

- Entrada válida → resultado esperado?
- Estado atualizado corretamente?
- UI reflete o estado?

### Fluxos Alternativos

- Input vazio ou nulo
- Dados fora do esperado
- Usuário cancela no meio

### Edge Cases

- Volume alto (lista com 100+ itens)
- Realtime: dois usuários simultâneos
- Reload durante operação

### Teste de Regressão (OBRIGATÓRIO)

Liste as 3 funcionalidades mais próximas da área alterada e verifique se ainda funcionam.

---

## CLASSIFICAÇÃO DE ISSUES

🔴 **Blocker** — perda de dados, crash, fluxo crítico quebrado → FAIL imediato
🟠 **Major** — funcionalidade principal degradada, comportamento incorreto → FAIL
🟡 **Minor** — UI inconsistente, texto errado, comportamento sub-ótimo → PASS com aviso
🟢 **Cosmetic** — visual, espaçamento, cor → PASS

---

## OUTPUT

🧪 Testado:

- [cenário] → [resultado]

✅ Funciona: (lista)
❌ Issues:

- [descrição] — severidade: 🔴/🟠/🟡/🟢
  ⚠️ Regressões verificadas: (lista das 3)

🎯 Status:

- ✅ PASS
- ✅ PASS com avisos (minor/cosmetic)
- ❌ FAIL (blocker ou major)

---

## NEXT STEP

- PASS → crm-memory (se padrão relevante)
- PASS com avisos → registrar no backlog
- FAIL → crm-execution-engine com issues documentados
