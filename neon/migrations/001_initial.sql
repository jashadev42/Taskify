-- ============================================================
-- Taskify: Neon Schema (multi-user)
-- Run this in Neon console > SQL Editor, or via `psql $DATABASE_URL -f this_file.sql`
-- ============================================================

-- -----------------------------------------------
-- task_templates: recurring weekly plan, one row per task per day-of-week per user
-- -----------------------------------------------
create table if not exists task_templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,          -- Neon Auth user ID (session.user.id)
  day_of_week  int  not null check (day_of_week between 0 and 6),  -- 0=Sun, 6=Sat
  title        text not null,
  description  text,
  time_block   text,                   -- optional, e.g. "10:30–11:00"
  type         text not null check (type in ('priority','extra')),
  sort_order   int  default 0,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- Index to make per-user lookups fast
create index if not exists idx_task_templates_user_id
  on task_templates(user_id);

create index if not exists idx_task_templates_user_day
  on task_templates(user_id, day_of_week);

-- -----------------------------------------------
-- day_tasks: materialized daily task instances
-- Denormalized on purpose: title/description/type copied from template at generation time
-- so later template edits never rewrite history.
-- -----------------------------------------------
create table if not exists day_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,          -- Neon Auth user ID
  date         date not null,
  template_id  uuid references task_templates(id) on delete set null,  -- nullable for ad-hoc tasks
  title        text not null,
  description  text,
  time_block   text,
  type         text not null check (type in ('priority','extra')),
  sort_order   int  default 0,
  completed    boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),

  -- Prevents duplicate generation; ad-hoc tasks (template_id IS NULL) bypass this.
  unique (user_id, date, template_id)
);

create index if not exists idx_day_tasks_user_id
  on day_tasks(user_id);

-- Composite index covers the most common query pattern: all tasks for a user on a date
create index if not exists idx_day_tasks_user_date
  on day_tasks(user_id, date);

-- -----------------------------------------------
-- No RLS needed — authorization is enforced in server actions
-- via WHERE user_id = $1 using the verified Neon Auth session ID.
-- -----------------------------------------------

-- -----------------------------------------------
-- Optional convenience view: per-day score aggregates
-- The app computes scores on the fly from day_tasks; this view is
-- useful for debugging or a future analytics dashboard.
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
