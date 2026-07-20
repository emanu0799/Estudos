-- Academia de Estudos: materiais privados e fila de processamento.
-- Execute no SQL Editor depois das migracoes anteriores.

insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', false)
on conflict (id) do nothing;

create policy "users read own study files"
on storage.objects for select to authenticated
using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "users upload own study files"
on storage.objects for insert to authenticated
with check (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "users update own study files"
on storage.objects for update to authenticated
using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "users delete own study files"
on storage.objects for delete to authenticated
using (bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid()::text));

alter table public.sources
  add column if not exists storage_path text,
  add column if not exists original_filename text,
  add column if not exists mime_type text,
  add column if not exists byte_size bigint,
  add column if not exists processing_status text not null default 'ready',
  add column if not exists extracted_at timestamptz,
  add column if not exists extraction_error text,
  add constraint sources_processing_status_check check (processing_status in ('uploaded', 'queued', 'extracting', 'review', 'ready', 'failed'));

create table if not exists public.source_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references public.sources(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

alter table public.source_processing_jobs enable row level security;

create policy "own source processing jobs"
on public.source_processing_jobs for all
using (exists (
  select 1 from public.sources so join public.subjects s on s.id = so.subject_id
  where so.id = source_id and s.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.sources so join public.subjects s on s.id = so.subject_id
  where so.id = source_id and s.owner_id = auth.uid()
));

create index if not exists source_processing_jobs_status_idx
on public.source_processing_jobs(status, requested_at);
