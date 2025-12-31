-- user_grades_table.sql
-- Store OCR uploads + extracted structured items + user-confirmed scores.

create table if not exists public.user_grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- source image (Supabase Storage)
  storage_bucket text not null default 'uploads',
  storage_path text not null,

  -- OCR outputs
  ocr_text text not null default '',
  extracted_items jsonb not null default '[]'::jsonb,

  -- user-confirmed / edited items
  confirmed_items jsonb not null default '[]'::jsonb,

  source_type text not null default 'unknown', -- e.g. 'score_sheet' | 'exam_schedule'
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_grades_user_id_idx on public.user_grades(user_id);
create index if not exists user_grades_created_at_idx on public.user_grades(created_at);

-- updated_at trigger (reuse if exists)
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at' and pronamespace = 'public'::regnamespace) then
    execute $$
      create function public.set_updated_at()
      returns trigger language plpgsql as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;
    $$;
  end if;
end $$;

drop trigger if exists set_user_grades_updated_at on public.user_grades;
create trigger set_user_grades_updated_at
before update on public.user_grades
for each row execute function public.set_updated_at();

-- RLS
alter table public.user_grades enable row level security;

drop policy if exists "user_grades_select_own" on public.user_grades;
create policy "user_grades_select_own"
on public.user_grades for select
using (auth.uid() = user_id);

drop policy if exists "user_grades_insert_own" on public.user_grades;
create policy "user_grades_insert_own"
on public.user_grades for insert
with check (auth.uid() = user_id);

drop policy if exists "user_grades_update_own" on public.user_grades;
create policy "user_grades_update_own"
on public.user_grades for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_grades_delete_own" on public.user_grades;
create policy "user_grades_delete_own"
on public.user_grades for delete
using (auth.uid() = user_id);

