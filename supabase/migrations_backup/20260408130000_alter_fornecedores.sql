-- Adiciona colunas à tabela fornecedores sem recriar (idempotente)
-- Coluna `endereco` existente não é removida (backward compat)

ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS categoria text
    CHECK (categoria IN ('materiais','servicos','equipamentos','transporte','outros')),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo','inativo','preferencial')),
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS prazo_entrega integer,
  ADD COLUMN IF NOT EXISTS condicao_pagamento text,
  ADD COLUMN IF NOT EXISTS logradouro text,
  ADD COLUMN IF NOT EXISTS numero_endereco text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS estado text;
