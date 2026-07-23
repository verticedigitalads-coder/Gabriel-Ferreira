-- Colunas de visita de orçamento sugeridas pela IA (extração automática).
-- Adicionadas anteriormente via SQL ad-hoc no Supabase; migration idempotente para sincronizar o repo.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS visita_orcamento_data date,
  ADD COLUMN IF NOT EXISTS visita_orcamento_periodo text;
