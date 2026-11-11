-- Tarefa do Operacional sem data derruba o app (o sino do header e o calendário
-- chamam parseISO na data). O front já recusa (operacionalSlice + formulários).
-- Conferido em 11/11/2026: 108 linhas, 0 com data nula; nenhum trigger ou função
-- escreve na tabela.
ALTER TABLE public.operacional_tasks ALTER COLUMN data SET NOT NULL;
