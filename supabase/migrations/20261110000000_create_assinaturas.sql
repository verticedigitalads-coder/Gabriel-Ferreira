-- =============================================================================
-- Cobrança R1 (_build/plano-assinatura.md): assinatura por workspace, log do
-- webhook do gateway e as funções de acesso e de cadastro.
-- Gerado em: 2026-11-10
--
-- Nada lê estas tabelas ainda. O gate no app e o bloqueio no backend entram na
-- R3, atrás da flag ASSINATURA_ATIVA (desligada).
--
-- Escrita só pelo backend (service_role: grants padrão de public + BYPASSRLS).
-- Cliente: SELECT em assinaturas, só das próprias empresas (RLS); nada em
-- assinatura_eventos (o payload do gateway tem dado pessoal); anon sem grant.
-- Grants no padrão da 20260923000000_revoke_client_writes_workspace_tables
-- (registrada no banco como 20260923210256).
--
-- updated_at é gravado pelo backend: o projeto não usa trigger.
-- As 3 funções são SECURITY INVOKER, com search_path vazio e nomes
-- qualificados. O Supabase dá EXECUTE a PUBLIC, anon e authenticated em toda
-- função nova de public, por isso cada uma tem REVOKE + GRANT explícitos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. assinaturas: 1 linha por workspace
-- -----------------------------------------------------------------------------
create table public.assinaturas (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  status text not null default 'pendente'
    check (status in ('pendente', 'ativa', 'atrasada', 'cancelada')),
  isento boolean not null default false,
  gateway text check (gateway in ('asaas', 'mercadopago')),
  gateway_cliente_id text,
  gateway_assinatura_id text,
  periodo_fim timestamptz,  -- pago até; data sem hora do gateway vira fim do dia em America/Sao_Paulo (backend)
  cancelada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gateway, gateway_assinatura_id)
);

alter table public.assinaturas enable row level security;

create policy "workspace_isolation" on public.assinaturas
  for select
  to authenticated
  using (workspace_id in (
    select wm.workspace_id
      from public.workspace_members wm
     where wm.user_id = auth.uid()
  ));

revoke all on table public.assinaturas from anon, authenticated;
grant select on table public.assinaturas to authenticated;

-- -----------------------------------------------------------------------------
-- 2. assinatura_eventos: idempotência e auditoria do webhook
-- -----------------------------------------------------------------------------
create table public.assinatura_eventos (
  id uuid primary key default gen_random_uuid(),
  gateway text not null,
  evento_id text not null,
  tipo text not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  payload jsonb not null,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  erro text,
  unique (gateway, evento_id)
);

alter table public.assinatura_eventos enable row level security;

-- Recusa explícita: sem nenhuma policy, o advisor acusa "RLS sem policy"
-- (lint 0008). Quem bloqueia de fato é o REVOKE abaixo.
create policy "no_client_access" on public.assinatura_eventos
  for all
  using (false)
  with check (false);

revoke all on table public.assinatura_eventos from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Funções
-- -----------------------------------------------------------------------------

-- Acesso de um workspace: 'liberado', 'pendente' ou 'bloqueado'.
-- Chamada pelo app (rpc) como authenticated: a RLS de assinaturas só mostra as
-- empresas do usuário, então workspace alheio cai em "sem linha" = 'pendente'.
-- ativa, atrasada ou cancelada com periodo_fim nulo dá 'bloqueado' (a
-- comparação com nulo não é verdadeira e cai no else).
create function public.acesso_workspace(p_workspace_id uuid)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select case
              when a.isento then 'liberado'
              when a.status = 'pendente' then 'pendente'
              when a.status = 'cancelada'
                   and now() < a.periodo_fim then 'liberado'
              when a.status in ('ativa', 'atrasada')
                   and now() < a.periodo_fim + interval '15 days' then 'liberado'
              else 'bloqueado'
            end
       from public.assinaturas a
      where a.workspace_id = p_workspace_id),
    'pendente'
  );
$$;

revoke execute on function public.acesso_workspace(uuid) from public, anon;
grant execute on function public.acesso_workspace(uuid) to authenticated, service_role;

-- O usuário tem ao menos 1 empresa liberada? Usada pelo bloqueio no backend.
-- Só service_role: o parâmetro permitiria sondar outro usuário.
create function public.usuario_tem_acesso(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
      from public.workspace_members m
     where m.user_id = p_user_id
       and public.acesso_workspace(m.workspace_id) = 'liberado'
  );
$$;

revoke execute on function public.usuario_tem_acesso(uuid) from public, anon, authenticated;
grant execute on function public.usuario_tem_acesso(uuid) to service_role;

-- Cadastro self-service: workspace + owner + assinatura pendente na mesma
-- transação. Idempotente: o lock por usuário enfileira duplo clique e retry, e
-- quem já tem empresa recebe a mais antiga (mesma ordem do
-- ensureWorkspaceForUser), sem gravar nada. owner_id fica nulo de propósito
-- (FK em cascata para auth.users, ver Dívida Técnica no current-state).
-- Nome e segmento chegam validados pelo backend (POST /api/onboarding/empresa).
create function public.criar_empresa_onboarding(p_user_id uuid, p_nome text, p_segment text)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_workspace_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('criar_empresa_onboarding:' || p_user_id::text, 0));

  select m.workspace_id
    into v_workspace_id
    from public.workspace_members m
   where m.user_id = p_user_id
   order by m.created_at
   limit 1;

  if v_workspace_id is not null then
    return v_workspace_id;
  end if;

  insert into public.workspaces (nome, segment)
  values (p_nome, p_segment)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, p_user_id, 'owner');

  insert into public.assinaturas (workspace_id)
  values (v_workspace_id);

  return v_workspace_id;
end;
$$;

revoke execute on function public.criar_empresa_onboarding(uuid, text, text) from public, anon, authenticated;
grant execute on function public.criar_empresa_onboarding(uuid, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- 4. Seed: as 6 empresas de hoje, isentas, por id (o nome pode mudar).
-- Conferido em 10/11/2026: são todas as linhas de workspaces.
-- -----------------------------------------------------------------------------
insert into public.assinaturas (workspace_id, status, isento) values
  ('72b024c0-42e4-4113-8bb0-81ba6eb720bd', 'ativa', true),  -- FL Art Metal
  ('53df42fc-8b1f-4221-aa60-6c35a05a3b31', 'ativa', true),  -- GPP Móveis Planejados (isento por enquanto)
  ('0d79ca0c-72b2-4609-8466-c84c695e89d6', 'ativa', true),  -- Teste Multi-Tenant
  ('9a9b96d5-f9f2-4b43-b02b-dc3519f07803', 'ativa', true),  -- Ítalo Colares Drywall
  ('001843dd-97fc-42a6-88ee-08c7a404903a', 'ativa', true),  -- Vértice Digital
  ('8c7a9183-69ce-447b-bb45-0d27df7ab1e5', 'ativa', true);  -- Teste Grants

-- -----------------------------------------------------------------------------
-- ROLLBACK (documentado, não executado):
-- -----------------------------------------------------------------------------
-- drop function if exists public.criar_empresa_onboarding(uuid, text, text);
-- drop function if exists public.usuario_tem_acesso(uuid);
-- drop function if exists public.acesso_workspace(uuid);
-- drop table if exists public.assinatura_eventos;
-- drop table if exists public.assinaturas;

-- -----------------------------------------------------------------------------
-- Verificação pós-apply:
-- -----------------------------------------------------------------------------
-- select count(*) from public.workspaces w
--  where not exists (select 1 from public.assinaturas a where a.workspace_id = w.id);
-- Esperado: 0.
--
-- select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type)
--   from information_schema.role_table_grants
--  where table_schema = 'public' and table_name in ('assinaturas', 'assinatura_eventos')
--  group by 1, 2 order by 1, 2;
-- Esperado: anon ausente; authenticated só SELECT e só em assinaturas.
--
-- select proname, prosecdef, proconfig, proacl
--   from pg_proc where pronamespace = 'public'::regnamespace order by 1;
-- Esperado: 3 funções, prosecdef false, search_path="", nenhum "=X/" (PUBLIC)
-- nem anon; authenticated só em acesso_workspace.
