-- ============================================================
-- Taskify: Initial Schema
-- Run this in your Supabase SQL editor (or via supabase db push)
-- ============================================================

-- -----------------------------------------------
-- task_templates: recurring weekly plan
-- -----------------------------------------------
create table if not exists task_templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users default auth.uid(),
  day_of_week  int not null check (day_of_week between 0 and 6),  -- 0=Sun, 6=Sat
  title        text not null,
  description  text,
  time_block   text,              -- e.g. "10:30–11:00", optional
  type         text not null check (type in ('priority','extra')),
  sort_order   int default 0,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- -----------------------------------------------
-- day_tasks: materialized daily task instances
-- Denormalized on purpose: title/description/type are
-- copied from the template at generation time so that
-- later template edits never rewrite history.
-- -----------------------------------------------
create table if not exists day_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users default auth.uid(),
  date         date not null,
  template_id  uuid references task_templates(id) on delete set null,  -- nullable for ad-hoc tasks
  title        text not null,
  description  text,
  time_block   text,
  type         text not null check (type in ('priority','extra')),
  sort_order   int default 0,
  completed    boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),

  -- Prevent duplicate generation; ad-hoc tasks (template_id IS NULL) are excluded.
  unique (user_id, date, template_id)
);

-- -----------------------------------------------
-- Row Level Security
-- -----------------------------------------------
alter table task_templates enable row level security;
alter table day_tasks       enable row level security;

-- task_templates policies
create policy "Users can read own templates"
  on task_templates for select
  using (user_id = auth.uid());

create policy "Users can insert own templates"
  on task_templates for insert
  with check (user_id = auth.uid());

create policy "Users can update own templates"
  on task_templates for update
  using (user_id = auth.uid());

create policy "Users can delete own templates"
  on task_templates for delete
  using (user_id = auth.uid());

-- day_tasks policies
create policy "Users can read own day_tasks"
  on day_tasks for select
  using (user_id = auth.uid());

create policy "Users can insert own day_tasks"
  on day_tasks for insert
  with check (user_id = auth.uid());

create policy "Users can update own day_tasks"
  on day_tasks for update
  using (user_id = auth.uid());

create policy "Users can delete own day_tasks"
  on day_tasks for delete
  using (user_id = auth.uid());

-- -----------------------------------------------
-- Optional convenience view: per-day score aggregates
-- The app computes scores on the fly from day_tasks,
-- but this view is handy for debugging or analytics.
-- -----------------------------------------------
create or replace view day_scores as
select
  user_id,
  date,
  count(*) filter (where type = 'priority')                      as priority_total,
  count(*) filter (where type = 'priority' and completed = true) as priority_completed,
  count(*) filter (where type = 'extra')                         as extra_total,
  count(*) filter (where type = 'extra'    and completed = true) as extra_completed
from day_tasks
group by user_id, date;
