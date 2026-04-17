-- Fase 16 — Comissão da planejadora
-- Executar no Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE orcamentos
  ADD COLUMN IF NOT EXISTS percentual_comissao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_comissao numeric DEFAULT 0;
