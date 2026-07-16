# RevieWhen

Personal study/review tracker: subjects, progress, todos, study timer, score logs, and reviews.

**Stack:** Next.js + hosted Supabase (Auth + Postgres + RLS).

## Setup

1. Copy env:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

2. Tables and RLS already live in your Supabase project (manage them in the Dashboard).

3. Auth: email + password. Optionally disable **Confirm email** under Authentication → Providers → Email.

4. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Features

- Subjects / topics / subtopics with progress  
- Todos  
- Study timer (stopwatch + pomodoro)  
- Score logs  
- Reviews  
- Dashboard  
- Light/dark theme (Settings)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
