# Taskify

A personal daily task tracker — recurring weekly plan, live scoring, per-user isolation, and midnight day rollover.

## Stack

- **Next.js 15** (App Router) — server-side rendering, server actions, middleware
- **Neon** — serverless Postgres database (no separate backend; DB connection lives only on the server)
- **Neon Auth** (Better Auth) — managed authentication; sessions verified server-side
- **Tailwind CSS v4** — styling
- **Vercel** — hosting

---

## Multi-user architecture

The Neon connection string is a server-only secret (`DATABASE_URL`). The browser never touches the database directly. All queries run inside Next.js Server Actions, and every query is filtered by `WHERE user_id = <verified session user id>` — the user ID always comes from the server-verified Neon Auth session, never from client input.

---

## Local setup

### 1. Create a Neon project and get the pooled connection string

1. Sign in at [console.neon.tech](https://console.neon.tech) and create a project.
2. On the **Connection Details** panel, switch the toggle to **Pooled** and copy the connection string → `DATABASE_URL`.

### 2. Enable Neon Auth and copy its env vars

1. In your Neon project, go to the **Auth** tab.
2. Enable Neon Auth (Better Auth).
3. Copy the env vars shown — you need:
   - `NEON_AUTH_BASE_URL` — your Auth base URL (ends in `/auth`)
   - `NEON_AUTH_COOKIE_SECRET` — run `openssl rand -base64 32` to generate one

### 3. Run the database migration

Open the **SQL Editor** in the Neon console and run the contents of:

```
neon/migrations/001_initial.sql
```

This creates the `task_templates` and `day_tasks` tables with indexes.

### 4. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Sign up, go to **Plan** to build your weekly schedule, then come back to **Today**.

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. In the [Vercel dashboard](https://vercel.com), import the repo.
3. Under **Environment Variables**, add all three vars:
   - `DATABASE_URL`
   - `NEON_AUTH_BASE_URL`
   - `NEON_AUTH_COOKIE_SECRET`
4. Deploy. Vercel detects Next.js automatically.

**Important:** `DATABASE_URL` must be added as a server-side env var only — do NOT prefix it with `NEXT_PUBLIC_`.

---

## Scoring formula

```
BONUS_CEILING = 20   // configurable in src/lib/scoring.js

base  = priorityCompleted / priorityTotal * 100   (100 if no priority tasks)
bonus = extraCompleted / extraTotal * BONUS_CEILING
total = round(base + bonus)   // range 0–120
```

- All priority tasks done = **100%**
- All priority + all extras = **120% 🔥**
- Skipping extras never lowers the score

Raise or lower `BONUS_CEILING` in [src/lib/scoring.js](src/lib/scoring.js) to adjust how much extras are worth.

---

## Importing a weekly plan

Use **Import JSON** in the Plan Editor. Paste JSON shaped like:

```json
{
  "templates": [
    {
      "day_of_week": 1,
      "title": "Morning workout",
      "type": "priority",
      "sort_order": 1
    },
    {
      "day_of_week": 1,
      "title": "Read 30 min",
      "description": "Any non-fiction book",
      "time_block": "21:00–21:30",
      "type": "extra",
      "sort_order": 2
    }
  ]
}
```

`day_of_week`: 0=Sunday … 6=Saturday. `type` must be `"priority"` or `"extra"`.

---

## OPTIONAL: Nightly score snapshot cron

Scores are computed on the fly from `day_tasks` and are always correct without a cron. To snapshot for analytics:

1. Create a Vercel cron function at `app/api/cron/snapshot/route.js` scheduled at `5 0 * * *` (00:05 UTC).
2. Use `DATABASE_URL` with the Neon serverless driver to upsert into a `day_scores` table for the previous calendar date.

Not required for correctness — the `day_scores` view in the migration already provides on-demand aggregates.
