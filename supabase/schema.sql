create table if not exists public.books (
  slug text primary key,
  title text not null,
  author text not null,
  color text not null,
  position int not null
);

create table if not exists public.ideas (
  id text primary key,
  book_slug text not null references public.books (slug),
  chapter int not null,
  chapter_title text not null,
  body text not null
);

create table if not exists public.lessons (
  day int primary key,
  week int not null,
  week_title text not null,
  title text not null,
  minutes int not null,
  summary text not null,
  action text not null,
  questions jsonb not null
);

create table if not exists public.paragraphs (
  id bigint generated always as identity primary key,
  lesson_day int not null references public.lessons (day) on delete cascade,
  position int not null,
  body text not null,
  unique (lesson_day, position)
);

create table if not exists public.paragraph_cites (
  paragraph_id bigint not null references public.paragraphs (id) on delete cascade,
  idea_id text not null references public.ideas (id),
  position int not null,
  primary key (paragraph_id, idea_id)
);

create table if not exists public.disagreements (
  lesson_day int primary key references public.lessons (day) on delete cascade,
  a_author text not null,
  a_text text not null,
  a_cite text not null references public.ideas (id),
  b_author text not null,
  b_text text not null,
  b_cite text not null references public.ideas (id),
  tie text not null
);

create table if not exists public.checks (
  id bigint generated always as identity primary key,
  lesson_day int not null references public.lessons (day) on delete cascade,
  position int not null,
  prompt text not null,
  choices jsonb not null,
  answer int not null,
  idea_id text not null references public.ideas (id),
  unique (lesson_day, position)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_day int not null references public.lessons (day),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_day)
);

create table if not exists public.saved_actions (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_day int not null references public.lessons (day),
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_day)
);

create table if not exists public.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_day int not null references public.lessons (day),
  score int not null,
  total int not null,
  missed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.books enable row level security;
alter table public.ideas enable row level security;
alter table public.lessons enable row level security;
alter table public.paragraphs enable row level security;
alter table public.paragraph_cites enable row level security;
alter table public.disagreements enable row level security;
alter table public.checks enable row level security;
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.saved_actions enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "public read" on public.books;
drop policy if exists "public read" on public.ideas;
drop policy if exists "public read" on public.lessons;
drop policy if exists "public read" on public.paragraphs;
drop policy if exists "public read" on public.paragraph_cites;
drop policy if exists "public read" on public.disagreements;
drop policy if exists "public read" on public.checks;
create policy "public read" on public.books for select to anon, authenticated using (true);
create policy "public read" on public.ideas for select to anon, authenticated using (true);
create policy "public read" on public.lessons for select to anon, authenticated using (true);
create policy "public read" on public.paragraphs for select to anon, authenticated using (true);
create policy "public read" on public.paragraph_cites for select to anon, authenticated using (true);
create policy "public read" on public.disagreements for select to anon, authenticated using (true);
create policy "public read" on public.checks for select to anon, authenticated using (true);

drop policy if exists "own read" on public.profiles;
drop policy if exists "own update" on public.profiles;
create policy "own read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own read" on public.lesson_progress;
drop policy if exists "own insert" on public.lesson_progress;
drop policy if exists "own update" on public.lesson_progress;
create policy "own read" on public.lesson_progress for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.lesson_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on public.lesson_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own read" on public.saved_actions;
drop policy if exists "own insert" on public.saved_actions;
drop policy if exists "own update" on public.saved_actions;
create policy "own read" on public.saved_actions for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.saved_actions for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on public.saved_actions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own read" on public.quiz_attempts;
drop policy if exists "own insert" on public.quiz_attempts;
create policy "own read" on public.quiz_attempts for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.quiz_attempts for insert to authenticated with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.books, public.ideas, public.lessons, public.paragraphs, public.paragraph_cites, public.disagreements, public.checks to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.lesson_progress, public.saved_actions to authenticated;
grant select, insert on public.quiz_attempts to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- A plan built from a file the learner uploaded. The file itself is not stored.
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  goal text not null,
  summary text not null,
  source_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_lessons (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  position int not null,
  title text not null,
  minutes int not null,
  summary text not null,
  paragraphs jsonb not null,
  action text not null,
  questions jsonb not null,
  checks jsonb not null,
  unique (plan_id, position)
);

create table if not exists public.plan_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.plan_lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.plan_actions (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.plan_lessons (id) on delete cascade,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.plan_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.plan_lessons (id) on delete cascade,
  score int not null,
  total int not null,
  missed jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;
alter table public.plan_lessons enable row level security;
alter table public.plan_progress enable row level security;
alter table public.plan_actions enable row level security;
alter table public.plan_attempts enable row level security;

drop policy if exists "own read" on public.plans;
drop policy if exists "own insert" on public.plans;
drop policy if exists "own delete" on public.plans;
create policy "own read" on public.plans for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.plans for insert to authenticated with check (auth.uid() = user_id);
create policy "own delete" on public.plans for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "own read" on public.plan_lessons;
drop policy if exists "own insert" on public.plan_lessons;
create policy "own read" on public.plan_lessons for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));
create policy "own insert" on public.plan_lessons for insert to authenticated
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

drop policy if exists "own read" on public.plan_progress;
drop policy if exists "own insert" on public.plan_progress;
create policy "own read" on public.plan_progress for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.plan_progress for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own read" on public.plan_actions;
drop policy if exists "own insert" on public.plan_actions;
drop policy if exists "own update" on public.plan_actions;
create policy "own read" on public.plan_actions for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.plan_actions for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on public.plan_actions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own read" on public.plan_attempts;
drop policy if exists "own insert" on public.plan_attempts;
create policy "own read" on public.plan_attempts for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on public.plan_attempts for insert to authenticated with check (auth.uid() = user_id);

grant select, insert, delete on public.plans to authenticated;
grant select, insert on public.plan_lessons to authenticated;
grant select, insert on public.plan_progress to authenticated;
grant select, insert, update on public.plan_actions to authenticated;
grant select, insert on public.plan_attempts to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create table if not exists public.billing (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free',
  billing_interval text,
  updated_at timestamptz not null default now(),
  constraint billing_plan_check check (plan in ('free', 'pro')),
  constraint billing_interval_check check (
    (plan = 'free' and billing_interval is null)
    or (plan = 'pro' and billing_interval in ('month', 'year'))
  )
);

alter table public.billing enable row level security;

drop policy if exists "own read" on public.billing;
create policy "own read" on public.billing for select to authenticated using (auth.uid() = user_id);

grant select on public.billing to authenticated;
grant select, insert, update on public.billing to service_role;
