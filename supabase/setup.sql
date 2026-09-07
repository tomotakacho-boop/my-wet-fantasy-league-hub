create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('league-feed','trade-talk','memes')),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  content text not null default '',
  media_url text,
  parent_id uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now(),
  check (channel <> 'memes' or media_url is not null)
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  primary key (message_id,user_id,emoji)
);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;

drop policy if exists "gmail profiles" on public.profiles;
create policy "gmail profiles" on public.profiles for all to authenticated
using ((auth.jwt()->>'email') like '%@gmail.com') with check (user_id=auth.uid() and (auth.jwt()->>'email') like '%@gmail.com');
drop policy if exists "gmail reads messages" on public.messages;
create policy "gmail reads messages" on public.messages for select to authenticated using ((auth.jwt()->>'email') like '%@gmail.com');
drop policy if exists "gmail creates messages" on public.messages;
create policy "gmail creates messages" on public.messages for insert to authenticated with check (user_id=auth.uid() and (auth.jwt()->>'email') like '%@gmail.com');
drop policy if exists "owners delete messages" on public.messages;
create policy "owners delete messages" on public.messages for delete to authenticated using (user_id=auth.uid());
drop policy if exists "gmail reads reactions" on public.message_reactions;
create policy "gmail reads reactions" on public.message_reactions for select to authenticated using ((auth.jwt()->>'email') like '%@gmail.com');
drop policy if exists "gmail creates reactions" on public.message_reactions;
create policy "gmail creates reactions" on public.message_reactions for insert to authenticated with check (user_id=auth.uid() and (auth.jwt()->>'email') like '%@gmail.com');
drop policy if exists "owners delete reactions" on public.message_reactions;
create policy "owners delete reactions" on public.message_reactions for delete to authenticated using (user_id=auth.uid());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('message-media','message-media',true,6291456,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists "public message media" on storage.objects;
create policy "public message media" on storage.objects for select using (bucket_id='message-media');
drop policy if exists "gmail uploads message media" on storage.objects;
create policy "gmail uploads message media" on storage.objects for insert to authenticated
with check (bucket_id='message-media' and (storage.foldername(name))[1]=auth.uid()::text and (auth.jwt()->>'email') like '%@gmail.com');
