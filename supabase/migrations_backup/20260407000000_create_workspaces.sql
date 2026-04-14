create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  owner_id uuid,
  created_at timestamptz default now(),
  segment text
);