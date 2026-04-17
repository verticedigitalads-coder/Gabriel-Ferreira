-- Fase 15 — Financeiro com status de pagamento
-- Executar no Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago')),
  ADD COLUMN IF NOT EXISTS data_vencimento timestamptz,
  ADD COLUMN IF NOT EXISTS data_pagamento timestamptz,
  ADD COLUMN IF NOT EXISTS forma_pagamento text;

-- Despesas existentes: setar data_vencimento = data (a data da transação)
UPDATE transactions
  SET data_vencimento = data
  WHERE tipo IN ('despesa', 'comissao', 'pagamento_funcionario')
  AND data_vencimento IS NULL;

-- Receitas existentes: marcar como 'pago' (já foram recebidas)
UPDATE transactions
  SET status_pagamento = 'pago', data_pagamento = data
  WHERE tipo = 'receita'
  AND status_pagamento = 'pendente';
