create table if not exists public.willow_conversations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('core', 'guided', 'break')),
  title text not null default 'Willow conversation',
  messages jsonb not null default '[]'::jsonb,
  phase_assessment jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.willow_conversations enable row level security;

create policy "People can read their Willow conversations"
on public.willow_conversations for select
using (auth.uid() = user_id);

create policy "People can create their Willow conversations"
on public.willow_conversations for insert
with check (auth.uid() = user_id);

create policy "People can update their Willow conversations"
on public.willow_conversations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "People can delete their Willow conversations"
on public.willow_conversations for delete
using (auth.uid() = user_id);

create index if not exists willow_conversations_user_updated_idx
on public.willow_conversations (user_id, updated_at desc);
