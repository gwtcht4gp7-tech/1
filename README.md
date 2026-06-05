# FocusBoard

FocusBoard is a practical personal productivity dashboard for ordinary personal
use. It combines daily todos, habit check-ins, lightweight finance tracking,
search, export, and installable PWA basics in one local-first app.

## Features

- Local account registration and login
- Today dashboard with open todos, habit completion, and monthly finance balance
- Todo CRUD with due dates, completion state, and `low` / `medium` / `high` priority
- Habit CRUD with today check-in, undo check-in, current streak, and recent 7-day history
- Finance tracking for income and expenses, category labels, month/type/category filters
- Settings page with JSON export, transaction CSV export, and guarded demo-data clearing
- Global search across todos, habits, and transaction notes
- PWA manifest, app icon, service worker, offline fallback, loading/error/not-found pages
- Mobile-friendly layout with bottom navigation

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite
- Prisma
- React Server Components and Server Actions
- Node test runner

## Local Setup

```bash
npm install
Copy-Item .env.example .env
npm run prisma:generate
npm run db:init
npm run db:seed
```

Demo account:

```text
demo@example.com / password123
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Database

The Prisma schema is in `prisma/schema.prisma`.

Useful commands:

```bash
npm run prisma:generate
npm run db:init
npm run db:seed
```

`prisma migrate dev` currently returns an empty `Schema engine error` in this
Windows and Node 24 environment when applying SQLite migrations. The migration
SQL is checked in under `prisma/migrations`, and `npm run db:init` is the
verified local fallback for applying it.

## Tests

```bash
npm test
```

## Lint And Build

```bash
npm run lint
npm run build
```

## PWA Testing

Create a production build and start the app:

```bash
npm run build
npm run start
```

Then open `http://localhost:3000` in a browser. The service worker registers in
production mode. Visit the dashboard once while online, then use browser dev
tools to simulate offline mode and refresh. Recently visited pages should remain
available, with `public/offline.html` as the fallback.

## Project Structure

```text
app/          App Router pages, route handlers, and server actions
components/   Shared UI and feature components
lib/          Auth, Prisma client, database query helpers, domain logic
prisma/       Schema, migration SQL, and seed data
public/       PWA icon, service worker, and offline page
scripts/      Local database initialization helper
tests/        Node test runner tests
types/        Shared TypeScript types
```

## Roadmap

- Replace the local migration fallback once Prisma migrate works cleanly in this environment.
- Add richer charts for finance trends.
- Add reminder notifications for habits and overdue todos.
- Add offline write queue and conflict handling.
- Add optional cloud sync.
