-- Número do orçamento no PDF. Até aqui o PDF calculava "ORC-<ano>-<seq>" numa
-- busca com a chave anon que a RLS sempre devolvia vazia: todo PDF de 2026, de
-- qualquer empresa, saiu ORC-2026-001. O app mostra outro número
-- (orcamentos.numero = ORC-<timestamp>), que também chegou ao cliente (nome do
-- arquivo, PIX no WhatsApp, assinatura, PDF agrupado).
--
-- Nenhum número já enviado pode mudar (decisão de 14/11/2026):
-- - legado: numero continua ORC-<timestamp> e numero_documento guarda o que o
--   PDF sempre mostrou, ORC-2026-001 (todos foram criados em 2026);
-- - novos: o app grava numero = numero_documento = ORC-AAAA-NNN, sequencial por
--   empresa e por ano (em 2026 começa em 002).
-- O UPDATE só pega o formato antigo ainda sem numero_documento: pode rodar de
-- novo depois do deploy, para linhas criadas por app antigo em cache.
-- O índice vale só para os novos (numero = numero_documento): os antigos
-- repetem ORC-2026-001 e ficam fora dele.
ALTER TABLE public.orcamentos ADD COLUMN numero_documento text;

UPDATE public.orcamentos
   SET numero_documento = 'ORC-2026-001'
 WHERE numero ~ '^ORC-[0-9]{13}$'
   AND numero_documento IS NULL;

CREATE UNIQUE INDEX orcamentos_numero_documento_unico
  ON public.orcamentos (workspace_id, numero_documento)
  WHERE numero = numero_documento;
