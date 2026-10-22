-- StepWise persistent request storage.
-- Run this script in the Supabase SQL Editor before using /api/requests.
create extension if not exists pgcrypto;

create table if not exists public.stepwise_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, request_id)
);

create index if not exists stepwise_requests_owner_created_idx
  on public.stepwise_requests (owner_id, created_at desc);

alter table public.stepwise_requests enable row level security;

drop policy if exists "Users can read their own StepWise requests" on public.stepwise_requests;
create policy "Users can read their own StepWise requests"
  on public.stepwise_requests for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can create their own StepWise requests" on public.stepwise_requests;
create policy "Users can create their own StepWise requests"
  on public.stepwise_requests for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- No update/delete policies are added by default. Add narrowly scoped policies
-- only after the staff/approver authorization model is backed by verified roles.
