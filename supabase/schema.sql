-- Academia de Estudos: esquema inicial
-- Execute este arquivo uma vez no SQL Editor do Supabase.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  reference text,
  source_type text not null default 'law',
  created_at timestamptz not null default now()
);

create table if not exists public.study_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  external_key text not null,
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  unique(source_id, external_key)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  study_item_id uuid references public.study_items(id) on delete set null,
  prompt text not null,
  options jsonb not null,
  correct_option integer not null,
  explanation text not null,
  created_at timestamptz not null default now(),
  check (jsonb_array_length(options) > correct_option)
);

create table if not exists public.review_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  status text not null default 'active',
  interval_days integer not null default 1,
  due_at timestamptz not null default now(),
  last_answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id, question_id)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option integer not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.sources enable row level security;
alter table public.study_items enable row level security;
alter table public.questions enable row level security;
alter table public.review_cards enable row level security;
alter table public.attempts enable row level security;

create policy "own subjects" on public.subjects for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own source data" on public.sources for all using (exists (select 1 from public.subjects s where s.id = subject_id and s.owner_id = auth.uid())) with check (exists (select 1 from public.subjects s where s.id = subject_id and s.owner_id = auth.uid()));
create policy "own study items" on public.study_items for all using (exists (select 1 from public.sources so join public.subjects s on s.id = so.subject_id where so.id = source_id and s.owner_id = auth.uid())) with check (exists (select 1 from public.sources so join public.subjects s on s.id = so.subject_id where so.id = source_id and s.owner_id = auth.uid()));
create policy "own review cards" on public.review_cards for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own attempts" on public.attempts for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "read linked questions" on public.questions for select using (exists (select 1 from public.study_items i join public.sources so on so.id = i.source_id join public.subjects s on s.id = so.subject_id where i.id = study_item_id and s.owner_id = auth.uid()));

create index if not exists review_cards_due_at_idx on public.review_cards(owner_id, due_at);
create index if not exists attempts_owner_answered_idx on public.attempts(owner_id, answered_at desc);
