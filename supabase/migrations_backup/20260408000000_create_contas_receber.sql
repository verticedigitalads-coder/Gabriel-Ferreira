create table if not exists contas_receber (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  descricao text not null,
  valor numeric(10,2) not null,
  data_vencimento date not null,
  data_recebimento date,
  status text not null default 'pendente'
    check (status in ('pendente','recebido','atrasado','cancelado')),
  forma_recebimento text
    check (forma_recebimento in ('pix','boleto','transferencia','dinheiro','cartao')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table contas_receber enable row level security;

create policy "workspace members can manage contas_receber"
  on contas_receber
  for all
  using (workspace_id = (
    select workspace_id from workspace_members
    where user_id = auth.uid()
    limit 1
  ));
