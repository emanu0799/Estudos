-- Execute este arquivo no SQL Editor do Supabase antes de ativar
-- a sincronizacao entre dispositivos.

alter table public.review_cards
  add column if not exists external_key text,
  add column if not exists label text;

create unique index if not exists review_cards_owner_external_key_unique
  on public.review_cards (owner_id, external_key)
  where external_key is not null;
