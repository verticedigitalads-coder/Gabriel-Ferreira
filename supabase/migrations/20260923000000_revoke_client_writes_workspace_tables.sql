-- Fecha brecha de isolamento (auditoria 23/09/2026): cliente não escreve mais em workspace_members nem workspaces.
-- Única escrita legítima é server.js via service_role (ignora RLS e tem grants próprios).
-- Policies self_access e workspace_owner_access ficam como estão; SELECT continua via RLS.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.workspace_members FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.workspaces FROM authenticated, anon;
