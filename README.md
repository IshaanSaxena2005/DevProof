# DevProof

**Developer intelligence backed by evidence, not claims.**

DevProof turns real engineering activity — GitHub repositories, coding-platform
profiles, certifications, courses, hackathons, and a parsed resume — into a
structured, evidence-backed picture of a developer's abilities. Instead of
asking what a developer *says* they can do, DevProof shows what their work
demonstrates: skills derived from repository evidence, scores that trace back
to individual findings, and career readiness computed from stored records only.

Connect → Analyze → Verify → Improve → Prove.

## Product Preview

The fastest way to evaluate DevProof is the public demo — see
[Demo Mode](#demo-mode). Product screenshots are being captured against the
running stack; the planned set is tracked in
[docs/screenshots.md](docs/screenshots.md) and will be embedded here as each
one is captured.

## Key Features

- **Authentication** — email/password with bcrypt hashing and HTTP-only JWT
  cookies, plus GitHub App sign-in; access tokens stay server-side.
- **Repository analysis** — a static-analysis engine scores six categories
  (documentation, testing, security, code quality, maintainability, dependency
  health) into metrics plus severity-ranked findings. A repository without an
  analysis reads "Analysis Pending" rather than a fabricated score.
- **Skill intelligence** — skills are derived from repository evidence and
  certifications, with claimed / learned / proven levels; self-reported
  records never outrank measured ones.
- **Developer 360** — one aggregated view of repositories, analyses, skills,
  credentials, and target roles.
- **Problem-solving activity** — LeetCode and GeeksforGeeks profile sync with
  an activity heatmap. Both platforms are read from undocumented endpoints, so
  statistics they do not publish render as absent, never as zero. (LinkedIn is
  not ingested: its self-serve API exposes no experience or skills data.)
- **Learning & achievements** — certifications, courses, and hackathons with
  evidence-ladder promotions, plus resume upload and local PDF parsing.
- **Growth & career readiness** — history reconstructed from stored
  timestamps, and readiness scores where every point traces back to a named
  requirement.
- **AI insights** — a Groq-backed summary of strengths, risks, and
  recommendations generated only from stored analyses; with no evidence the
  model is never called.
- **Public demo mode** — every dashboard section rendered with synthetic,
  clearly labelled sample data; no account and no backend involved.

## System Architecture

![DevProof system architecture](docs/architecture.png)

- The **frontend** (React SPA) talks only to the **backend API**; the session
  rides on an HTTP-only JWT cookie and no token ever reaches browser storage.
- The **backend** owns authentication, the repository analysis engine,
  skill/evidence services, and resume handling — PDFs are stored on the server
  and text is extracted locally with `pdfjs-dist`, with no external service.
- **PostgreSQL** is accessed through **Prisma**; every row is scoped to the
  authenticated user.
- **GitHub** is integrated as a GitHub App: the backend reads repository
  contents over the REST API, and GitHub delivers webhooks inbound, verified
  with a timing-safe HMAC SHA-256 comparison. Public repositories can also be
  analyzed by URL with no GitHub account at all.
- **Groq** is called only to interpret already-stored evidence, and its JSON
  output is validated with Zod before it reaches the frontend.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Motion, Lucide, Spline |
| Backend | Node.js, Express 4, TypeScript, Zod, Helmet, CORS, express-rate-limit, Morgan + Winston |
| Data | PostgreSQL 16, Prisma ORM |
| Integrations | GitHub App (REST + webhooks), LeetCode & GeeksforGeeks profiles, Groq (`openai/gpt-oss-120b`) |
| Testing | node:test, Playwright (Chromium) |
| Delivery | Docker, GitHub Actions CI |

## Security and Authentication

- bcrypt-hashed passwords; the JWT session lives in an HTTP-only cookie —
  never in `localStorage` or `sessionStorage`.
- GitHub App sign-in: authorizing and installing are separate steps — signing
  in grants no repository access until the user installs the app and chooses
  repositories — and the client id is validated (`Iv1.` / `Iv23` prefix). All
  access tokens remain server-side.
- Webhook payloads are verified with a timing-safe HMAC SHA-256 comparison.
- Zod request validation, Helmet security headers, credentialed CORS, and rate
  limiting: 200 requests / 15 min per IP on `/api`, plus a dedicated budget of
  10 attempts / 15 min for password logins so credential guessing is throttled
  without affecting OAuth callbacks or logout.
- All repository and analysis data is scoped to the authenticated user.

Known limitations, stated plainly: a session is a single JWT cookie with a
fixed lifetime (7 days by default) and there is deliberately no refresh-token
endpoint — logging in again issues a fresh token. Rate limiters key on client
IP, so an API deployed behind a reverse proxy must set `TRUST_PROXY` to its
hop count first, and secure cookies assume TLS terminates in front of the
backend. The live GitHub OAuth round trip, real webhook deliveries, and
Groq-generated insights are pinned by tests over the same code paths, but no
live round trip has been run — verify those three with real credentials before
any production launch.

## Getting Started

### Prerequisites

Node.js, npm, Docker Desktop, Git.

```bash
git clone https://github.com/IshaanSaxena2005/DevProof.git
cd DevProof
```

### Option A — full stack in Docker

Create `Backend/.env` first (see below), then:

```bash
docker compose up -d --build
```

The backend service healthchecks the real `/api/v1/health` endpoint, and the
frontend waits for it to report healthy before starting.

### Option B — Postgres in Docker, apps on the host

```bash
cd Backend
docker compose up -d      # PostgreSQL on host port 5434 (not 5432)
npm install
npm run prisma:migrate
npm run dev               # http://localhost:5000
```

```bash
cd Frontend
npm install
npm run dev               # http://localhost:5173
```

### After every pull

Three things can arrive with a pull, and each fails at runtime with an error
that does not name its cause:

```bash
cd Backend
npm install                # new dependencies
npx prisma migrate deploy  # new migrations
npx prisma generate        # regenerate the client
```

Root-level scripts (`npm run dev:backend`, `npm run dev:frontend`,
`npm run build`, `npm test`) delegate into the two apps.

## Environment Variables

Both apps ship a `.env.example` — copy it and fill in the values. Only
`DATABASE_URL` and `JWT_SECRET` are required (`JWT_SECRET` must be at least 8
characters; generate one with
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

**Backend — `Backend/.env`**

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://devproof:devproof_local_dev@localhost:5434/devproof_db?schema=public
JWT_SECRET=
JWT_EXPIRES_IN=7d

# GitHub App sign-in (optional — the server boots without it).
# From https://github.com/settings/apps, NOT an OAuth App: the client id must
# start with Iv1. or Iv23, and the server rejects anything else.
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_SLUG=
GITHUB_CALLBACK_URL=http://localhost:5000/api/v1/auth/github/callback

# GitHub App + webhooks (optional)
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

FRONTEND_URL=http://localhost:5173

# Reverse proxy only — hop count (usually 1); empty when directly exposed.
TRUST_PROXY=

# AI insights (optional — the endpoint returns 503 when unset)
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

**Frontend — `Frontend/.env`**

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Optional — the API client falls back to that exact value when unset.

Never commit `.env` files, OAuth secrets, JWT secrets, or API credentials.

## API Overview

All routes are mounted under `/api/v1`. Endpoints marked **(auth)** require the
session cookie.

| Group | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (auth), `GET /auth/github`, `GET /auth/github/callback`, `POST /auth/github/sync` (auth), `POST /auth/github/disconnect` (auth) |
| Repositories (auth) | `GET /repositories`, `GET /repositories/github`, `GET /repositories/:id`, `POST /repositories/connect`, `POST /repositories/sync`, `DELETE /repositories/:id` |
| Analysis (auth) | `POST /analysis/trigger`, `GET /analysis/repo/:repositoryId`, `GET /analysis/:id` |
| Developer 360 (auth) | `GET /developer360/overview` |
| Skills (auth) | `GET /skills`, `POST /skills`, `POST /skills/derive`, `DELETE /skills/:id` |
| Certifications (auth) | `GET /certifications`, `POST /certifications`, `PATCH/DELETE /certifications/:id` |
| Courses (auth) | `GET /courses`, `POST /courses`, `PATCH/DELETE /courses/:id` |
| Hackathons (auth) | `GET /hackathons`, `POST /hackathons`, `PATCH/DELETE /hackathons/:id` |
| Coding profiles (auth) | `GET /coding-profiles`, `POST /coding-profiles`, `POST /coding-profiles/:platform/sync`, `DELETE /coding-profiles/:platform` — platform is `LEETCODE` or `GEEKSFORGEEKS` |
| Growth (auth) | `GET /growth/history` |
| Career readiness (auth) | `GET /career/readiness` |
| Resume (auth) | `GET /resume`, `POST /resume` (PDF only, 5 MB max, multipart field `resume`), `GET /resume/download`, `POST /resume/analyse`, `DELETE /resume` |
| AI (auth) | `GET /ai/insights` |
| Webhooks | `POST /webhooks/github` (HMAC-verified), `GET /webhooks/github/status` |

Two behaviours worth knowing: resume text is extracted locally with
`pdfjs-dist` — scanned PDFs without a text layer are reported as such, and
technologies found in a resume are never written as skills without the user's
confirmation. Career readiness is computed on read from stored evidence, so a
score never goes stale and every point names the requirement it came from.

## Demo Mode

`/demo` renders the same ten dashboard sections against synthetic fixtures that
are labelled as sample data on screen — no account, no backend, no real
personal data. The demo routes sit outside the auth guard by design, and while
the demo is mounted the API client refuses every write before any request is
sent. Open `http://localhost:5173/demo` once the frontend is running, or click
**Explore Demo** on the landing page.

## Testing and CI

```bash
# Backend — service tests (Prisma stubbed) + integration tests over real HTTP and PostgreSQL
cd Backend && npm test

# Frontend — 59 tests over extracted logic (UTC dates, difficulty fallbacks,
# demo isolation, API-client envelope & demo guard)
cd Frontend && npm test

# Browser E2E — Playwright Chromium against the production build + compiled backend
cd Backend && npm run build
cd ../Frontend
npx playwright install chromium   # one-time browser download
npm run test:e2e
```

Integration and E2E runs use dedicated disposable databases recreated per run,
so a test can never touch development data; E2E test-account passwords are
generated per run and never committed (see `Frontend/e2e/credentials.ts`).

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request
to `main`: the **backend** job applies migrations to an empty database, checks
schema/migration drift, builds and tests, and audits production dependencies;
the **frontend** job typechecks, builds, tests, and audits; the **browser E2E**
job runs 20 Playwright journeys against a disposable Postgres; and the
**Docker** job builds both images.

What the automated suite does not prove: live GitHub OAuth, the GitHub App
installation flow, real webhook delivery, and live Groq responses need real
credentials and stay outside CI.

## Project Structure

```text
DevProof/
├── Frontend/            # React SPA, public demo, and the Playwright E2E suite
│   ├── src/             # components, pages, dashboard sections, demo fixtures, API clients
│   ├── e2e/             # Playwright journeys (account passwords generated per run)
│   └── test/            # node --test suites
├── Backend/             # Express API
│   ├── prisma/          # schema.prisma + committed migrations
│   ├── src/             # controllers, routes, services, middlewares, validators, config
│   └── test/            # service + integration suites
├── docs/                # architecture diagram, screenshot checklist
├── docker-compose.yml   # full stack: postgres + backend + frontend
└── package.json         # root scripts delegating into Backend/Frontend
```

## Contributing

1. Branch from `main` (`git checkout -b fix/short-description`).
2. Keep commits conventional (`feat:`, `fix:`, `test:`, `docs:`, `ci:`).
3. Behaviour changes need tests; both suites must pass locally
   (`cd Backend && npm test`, `cd Frontend && npm test`).
4. Add new migrations with `npx prisma migrate dev` and commit the generated
   migration folder — never edit an already-applied migration.
5. Open a pull request; CI re-runs the migrations, both test suites, both
   builds, the dependency audit and the Docker builds.

## 👨‍💻 Authors

**Ishaan Saxena** · **Hardesh Agarwal**

Building full-stack, AI-powered, and data-driven software systems.

## License

DevProof is proprietary software developed by **Ishaan Saxena and Hardesh Agarwal**.

Unauthorized copying, redistribution, modification, or commercial use is not
permitted without prior written permission from the copyright holder.

Third-party libraries, frameworks, APIs, fonts, icons, and services remain
subject to their respective licenses.
