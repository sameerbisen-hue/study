-- ============================================================
-- clever-clove-collective  — Supabase Schema
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
-- Extends auth.users with app-level fields.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default '',
  username      text not null default '',
  email         text not null default '',
  bio           text,
  semester      text,
  avatar_url    text,
  upload_count  int  not null default 0,
  total_upvotes int  not null default 0,
  review_count  int  not null default 0,
  badges        text[] not null default array['new-member'],
  role          text not null default 'student' check (role in ('student','admin')),
  blocked       boolean not null default false,
  joined_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: public read"
  on public.profiles for select using (true);

create policy "profiles: owner update"
  on public.profiles for update using (auth.uid() = id);

-- ── materials ─────────────────────────────────────────────────
create table if not exists public.materials (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  subject        text not null,
  semester       text not null default 'Sem 1',
  description    text not null default '',
  tags           text[] not null default '{}',
  file_type      text not null default 'pdf',
  file_name      text not null default '',
  file_size      text not null default '',
  file_path      text,                          -- storage path in 'materials' bucket
  uploader_id    uuid not null references public.profiles(id) on delete cascade,
  uploader_name  text not null default '',
  uploader_avatar text,
  upvotes        int  not null default 0,
  upvoted_by     uuid[] not null default '{}',
  downloads      int  not null default 0,
  rating_avg     numeric(3,1) not null default 0,
  rating_count   int  not null default 0,
  uploaded_at    timestamptz not null default now()
);

alter table public.materials enable row level security;

create policy "materials: public read"
  on public.materials for select using (true);

create policy "materials: authenticated insert"
  on public.materials for insert with check (auth.uid() = uploader_id);

create policy "materials: owner or admin delete"
  on public.materials for delete using (
    auth.uid() = uploader_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "materials: authenticated update"
  on public.materials for update using (auth.role() = 'authenticated');

-- ── reviews ──────────────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  material_id  uuid not null references public.materials(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  user_name    text not null default '',
  user_avatar  text,
  rating       int  not null check (rating between 1 and 5),
  comment      text not null default '',
  created_at   timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews: public read"
  on public.reviews for select using (true);

create policy "reviews: authenticated insert"
  on public.reviews for insert with check (auth.uid() = user_id);

-- ── reports ──────────────────────────────────────────────────
create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  material_id     uuid not null references public.materials(id) on delete cascade,
  material_title  text not null default '',
  reporter_id     uuid not null references public.profiles(id) on delete cascade,
  reporter_name   text not null default '',
  reason          text not null,
  message         text,
  status          text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at      timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "reports: admin read"
  on public.reports for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "reports: authenticated insert"
  on public.reports for insert with check (auth.uid() = reporter_id);

create policy "reports: admin update"
  on public.reports for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ── bookmarks ─────────────────────────────────────────────────
create table if not exists public.bookmarks (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  material_id  uuid not null references public.materials(id) on delete cascade,
  primary key (user_id, material_id)
);

alter table public.bookmarks enable row level security;

create policy "bookmarks: owner read"
  on public.bookmarks for select using (auth.uid() = user_id);

create policy "bookmarks: owner insert"
  on public.bookmarks for insert with check (auth.uid() = user_id);

create policy "bookmarks: owner delete"
  on public.bookmarks for delete using (auth.uid() = user_id);

-- ── Storage bucket ────────────────────────────────────────────
-- Create a public bucket named 'materials' in the Supabase dashboard
-- (Storage → New bucket → Name: materials, Public: true)
-- Then add this storage policy in the SQL editor:

-- insert into storage.buckets (id, name, public) values ('materials', 'materials', true)
-- on conflict do nothing;

-- Uncomment if not created via dashboard:
-- create policy "storage: authenticated upload"
--   on storage.objects for insert with check (
--     bucket_id = 'materials' and auth.role() = 'authenticated'
--   );
-- create policy "storage: public read"
--   on storage.objects for select using (bucket_id = 'materials');

-- ── Trigger: auto-create profile on signup ───────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, username, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    lower(split_part(new.email,'@',1)),
    new.email,
    case when lower(new.email) = 'sameeropbis@gmail.com' then 'admin' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
