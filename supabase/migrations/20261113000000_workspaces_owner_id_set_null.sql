-- Excluir o usuário dono (painel ou API) apagava a empresa inteira: owner_id
-- tinha ON DELETE CASCADE, e as 16 tabelas que dependem de workspaces caem junto.
-- Com SET NULL a empresa fica com owner_id nulo; a membership do usuário
-- continua saindo em cascata (workspace_members), mas nenhum dado é apagado.
-- Conferido em 13/11/2026: owner_id aceita nulo; nada no front, no server.js,
-- em função, policy, view ou trigger lê a coluna; 5 dos 7 workspaces já têm
-- owner_id nulo. É a única FK para auth.users que apaga dado de negócio.
ALTER TABLE public.workspaces
  DROP CONSTRAINT workspaces_owner_id_fkey,
  ADD CONSTRAINT workspaces_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
