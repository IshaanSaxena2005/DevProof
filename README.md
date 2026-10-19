# DevProof 🧠

> **Developer Intelligence & Engineering Evidence Platform**

DevProof is an AI-powered developer intelligence platform designed to transform real engineering activity into structured, evidence-backed professional intelligence.

Instead of relying only on resumes, self-reported skills, or static portfolios, DevProof brings together signals from GitHub, coding platforms, projects, certifications, and development activity to build a continuously evolving picture of a developer's technical capabilities.

**Connect → Analyze → Verify → Improve → Prove**

---

## 🚀 What is DevProof?

A developer's actual engineering ability is distributed across multiple platforms.

GitHub shows code.  
Coding platforms show problem-solving ability.  
Projects demonstrate implementation skills.  
Certifications demonstrate formal learning.  
A resume communicates what the developer claims.

**DevProof brings these signals together and turns them into engineering evidence.**

---

## 📍 Current Status

DevProof is under active development. The project's own first principle is that unavailable
data must read as unavailable — so this README states plainly what is wired end to end and
what is still scaffolding.

| Area | Status |
|---|---|
| Email/password auth, JWT cookies, protected routes | ✅ Built |
| GitHub App sign-in, profile + repository sync | ✅ Built |
| Repository static analysis engine (metrics + findings) | ✅ Built |
| Developer 360 aggregation endpoint | ✅ Built |
| AI insights endpoint (Groq) | ✅ Built |
| GitHub App JWT + webhook signature verification | ✅ Built |
| Dashboard: Overview, Repositories, Repository Details, Developer 360, AI Insights, Skills | ✅ Live backend data |
| Dashboard: Problem Solving, Growth, Career Readiness | ✅ Live backend data |
| Dashboard: Learning & Achievements | ✅ Live backend data (courses, certifications, hackathons) |
| Skill intelligence endpoints (derived from repo evidence) | ✅ Built |
| Certification endpoints (with evidence-ladder promotion) | ✅ Built |
| Course endpoints (with LEARNED promotion) | ✅ Built |
| Hackathon endpoints | ✅ Built |
| Growth history endpoint | ✅ Built |
| Career readiness scoring | ✅ Built |
| Resume upload + parsing | ✅ Built |
| LeetCode coding-profile sync | ✅ Built |
| GeeksforGeeks coding-profile sync | ✅ Built |
| LinkedIn ingestion | ❌ Not built — see below |

GeeksforGeeks publishes no API, so its profile is read from the page's own server-rendered
payload. It reports a solve count, a coding score, a monthly score and a Problem-of-the-Day
streak — and nothing else: no difficulty split, no acceptance rate, no contest rating and no
daily activity calendar. Those are stored as null and render as absent, never as zero.

LinkedIn is not a missing feature so much as an unavailable one. Its self-serve OIDC product
returns only name, picture, locale and email; experience, education, skills and certifications
are not exposed at any self-serve tier, so there is nothing to ingest. Certifications are
entered through the certification endpoints instead.

**Externally unverified:** the live GitHub OAuth round trip, real webhook deliveries from
GitHub, and Groq-generated insights need real credentials and external services. They are
pinned by local tests that exercise the same code paths (state-mismatch rejection, HMAC
signature verification, provider-missing and provider-unreachable handling), but no live
round trip has been run — treat those three as requiring a staging check with real
credentials before launch.

The AI Insights page reads `GET /api/v1/ai/insights` directly, so it shows a real Groq-generated
summary of your stored analyses — or an empty state when nothing has been analyzed yet. It renders
only the four things the endpoint actually returns (summary, strengths, risks, recommendations)
plus the measured average score; no projected career trajectory or invented sub-scores.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Secure Authentication** | Email/password with HTTP-only JWT cookies, plus GitHub App sign-in |
| 🐙 **GitHub Integration** | Connect GitHub, sync profile and repositories without duplicating rows |
| 🔍 **Repository Analysis** | Static analysis producing scored metrics and severity-ranked findings |
| 👨‍💻 **Developer 360** | Aggregates repositories, analyses, skills, credentials and target roles into one overview |
| 🤖 **AI Insights** | Groq-backed summary of strengths, risks and recommendations, grounded only in stored analysis data |
| 🪝 **GitHub App & Webhooks** | App JWT minting and HMAC-verified webhook intake |
| 🩺 **Health Endpoint** | Reports uptime, environment and live database connectivity |

### Planned

Every area in the status table above is served by the API **and** read by its dashboard
page. What remains is deployment: `docker-compose.yml` now provides a named volume for
`Backend/uploads` (so resumes survive container recreation), but whatever environment
hosts staging/production needs the equivalent mount — plus backups of both that volume
and Postgres — and the live OAuth, webhook and Groq checks recorded in the sections above.

---

## 🧠 The DevProof Philosophy

Traditional developer profiles answer:

> **"What does this developer say they can do?"**

DevProof aims to answer:

> **"What evidence demonstrates that they can do it?"**

```text
GitHub
Projects
Certifications
Coding Activity
Engineering Signals
       ↓
Evidence Engine
       ↓
Developer Intelligence
       ↓
Skills + Strengths + Risks
       ↓
Career Readiness
       ↓
Actionable Recommendations
```

---

## 🔍 Repository Analysis

The analysis engine reads repository contents through the GitHub API and scores six
categories, each stored as a `Metric` row alongside severity-ranked `Finding` rows:

- **Documentation** — README presence and quality
- **Testing** — test files and automation
- **Security** — hardcoded secrets and dynamic-execution sinks
- **Code Quality** — structure and clean-architecture signals
- **Maintainability** — CI/CD configuration
- **Dependency Health** — dependency management

Results roll up into an `overallScore` and a `healthStatus`. Where analysis has not run,
DevProof reports **Analysis Pending** rather than fabricating a score.

---

## 🤖 AI Insights

The AI layer interprets evidence — it never invents it.

- Provider: **Groq**, via its OpenAI-compatible chat completions API
- Default model: `openai/gpt-oss-120b` (override with `GROQ_MODEL`)
- The prompt contains only real stored metrics and findings
- Responses are forced to JSON and validated with Zod before reaching the frontend
- If the user has **no completed analyses, the model is never called** — the endpoint returns
  `hasEvidence: false` instead of letting an LLM confabulate plausible strengths
- `GROQ_API_KEY` is optional: the server boots without it and the endpoint returns a clear
  **503** rather than crashing at startup

---

## 🔐 GitHub App Sign-In

DevProof authenticates as a **GitHub App**, not an OAuth App. Two consequences
matter when setting it up:

1. **Authorizing and installing are separate steps.** Signing in proves identity.
   It grants access to no repositories at all until the user also *installs*
   DevProof and picks which repositories to share. A freshly signed-in user with
   no installation sees an explicit prompt to install, not an empty list.
2. **The `scope` parameter does nothing.** A GitHub App derives access from the
   permissions granted at install time, so repositories are enumerated per
   installation via `/user/installations` rather than `/user/repos`.

Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from
https://github.com/settings/apps. A GitHub App client id starts with `Iv1.` or
`Iv23`; the server rejects anything else rather than failing silently later.
`GITHUB_APP_SLUG` is optional and only shapes the install link.

Public repositories can still be analyzed by URL with no GitHub account linked
at all — installation is required only for private ones.

---

## 🔐 Authentication & Security

- Email/password authentication with bcrypt-hashed passwords
- HTTP-only JWT cookies — tokens are never stored in `localStorage` or `sessionStorage`
- GitHub App sign-in; access tokens stay server-side and are never exposed to the frontend
- Repository access is per-installation: the user chooses which repositories DevProof may read
- Zod request validation, Helmet security headers, CORS with credentials
- Rate limiting: 200 requests per 15 minutes per IP on `/api`
- Webhook payloads verified with a timing-safe HMAC SHA-256 comparison
- All repository and analysis data is scoped to the authenticated user

**Known limitations, stated plainly:** a session is a single JWT cookie with a fixed
lifetime (7 days by default) and there is deliberately no refresh-token endpoint —
logging in again issues a fresh token; the rate limiters key on the client IP, so an
API deployed behind a reverse proxy must set `TRUST_PROXY` to its hop count first;
and secure cookies assume the deployment terminates TLS in front of the backend.
Credential guessing has its own tighter budget: 10 attempts per 15 minutes on
`POST /auth/login`, scoped so OAuth callbacks and logout are never throttled.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    USER["Developer"]
    FE["DevProof Frontend<br/>React 19 + TypeScript + Vite"]
    API["Backend API<br/>Node.js + Express + TypeScript"]
    DB[("PostgreSQL 16<br/>Prisma")]
    GH["GitHub API<br/>App auth + Installations + Webhooks"]
    AI["Groq<br/>openai/gpt-oss-120b"]

    USER --> FE
    FE --> API
    API --> DB
    API --> GH
    GH -. webhooks .-> API
    API --> AI
```

---

## 🛠️ Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- Motion (`motion/react`)
- Lucide Icons
- Spline (interactive WebGL background)

### Backend

- Node.js
- Express 4
- TypeScript
- Prisma 5
- PostgreSQL 16
- jsonwebtoken + bcryptjs
- Zod
- Helmet, CORS, express-rate-limit
- Morgan + Winston logging

---

## 📁 Project Structure

```text
DevProof/
├── Frontend/
│   ├── src/
│   │   ├── components/      # landing sections, dashboard primitives, state blocks
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── dashboard/   # Overview, Repositories, Developer360, Skills, ...
│   │   ├── layouts/
│   │   ├── context/         # AuthContext
│   │   ├── hooks/
│   │   ├── services/        # typed API clients (auth, skills, courses, hackathons, …)
│   │   ├── demo/            # public demo mode: synthetic fixtures, routes, shell
│   │   └── lib/             # api.mts, types.ts, useResource.ts
│   ├── test/                # node --test suites (no browser needed)
│   ├── Dockerfile
│   └── package.json
│
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── config/          # env.ts, database.ts
│   │   └── utils/           # apiResponse, appError, logger
│   ├── test/
│   ├── Dockerfile
│   ├── docker-compose.yml   # PostgreSQL only
│   └── package.json
│
├── docker-compose.yml       # full stack: postgres + backend + frontend
├── README.md
└── package.json             # root scripts that delegate into Backend/Frontend
```

---

## ⚙️ Local Development

### Prerequisites

- Node.js
- npm
- Docker Desktop
- Git

### Clone

```bash
git clone https://github.com/IshaanSaxena2005/DevProof.git
cd DevProof
```

### Option A — full stack in Docker

Create `Backend/.env` first (see below), then:

```bash
docker compose up -d --build
```

This starts PostgreSQL, the backend and the frontend together. The backend service
includes a healthcheck that probes the real `/api/v1/health` endpoint (which itself
checks the database), and the frontend waits for it to report healthy before starting.

### Option B — Postgres in Docker, apps on the host

Start just the database:

```bash
cd Backend
docker compose up -d
```

Install dependencies, apply migrations and run the backend:

```bash
npm install
npm run prisma:migrate
npm run dev
```

Backend: `http://localhost:5000`

In another terminal:

```bash
cd Frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

> PostgreSQL is published on host port **5434** (not 5432), because 5432 and 5433 are
> commonly already taken by other local Postgres instances.

### After pulling

Three things can arrive with a pull, and each fails at runtime with an error
that does not name its cause. Run all three after every pull:

```bash
cd Backend
npm install              # new dependencies
npx prisma migrate deploy  # new migrations
npx prisma generate        # regenerate the client
```

Skipping them produces, respectively: `Cannot find module …`, a missing table,
and type errors about columns that plainly exist in `schema.prisma`.

### Root scripts

From the repository root:

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm test
```

---

## 🔑 Environment Variables

Both apps ship a `.env.example` — copy it and fill in the values.

### Backend — `Backend/.env`

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

# Reverse proxy only — set to the hop count (usually 1) when TLS terminates at
# a proxy in front of the API. Leave empty when directly exposed; only a
# positive integer is accepted, never "true".
TRUST_PROXY=

# AI insights (optional — endpoint returns 503 when unset)
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

`DATABASE_URL` and `JWT_SECRET` are the only required values; `JWT_SECRET` must be at least
8 characters. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend — `Frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Optional — `src/lib/api.mts` falls back to that exact value when unset.

> Never commit `.env` files, OAuth secrets, JWT secrets, or API credentials.

---

## 🔌 API Reference

All routes are mounted under `/api/v1`. `/` and `/health` redirect to the health endpoint.

### Health

```text
GET    /api/v1/health
```

### Authentication

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me                  🔒
GET    /api/v1/auth/github
GET    /api/v1/auth/github/callback
POST   /api/v1/auth/github/sync         🔒
POST   /api/v1/auth/github/disconnect   🔒
```

### Repositories 🔒

```text
GET    /api/v1/repositories
GET    /api/v1/repositories/github
GET    /api/v1/repositories/:id
POST   /api/v1/repositories/connect
POST   /api/v1/repositories/sync
DELETE /api/v1/repositories/:id
```

### Analysis 🔒

```text
POST   /api/v1/analysis/trigger
GET    /api/v1/analysis/repo/:repositoryId
GET    /api/v1/analysis/:id
```

### Developer Intelligence 🔒

```text
GET    /api/v1/developer360/overview
```

### Skills 🔒

```text
GET    /api/v1/skills
POST   /api/v1/skills            (add a CLAIMED skill)
POST   /api/v1/skills/derive     (rebuild from repository evidence)
DELETE /api/v1/skills/:id
```

### Certifications 🔒

```text
GET    /api/v1/certifications
POST   /api/v1/certifications
PATCH  /api/v1/certifications/:id
DELETE /api/v1/certifications/:id
```

### Courses 🔒

```text
GET    /api/v1/courses
POST   /api/v1/courses
PATCH  /api/v1/courses/:id
DELETE /api/v1/courses/:id
```

### Hackathons 🔒

```text
GET    /api/v1/hackathons
POST   /api/v1/hackathons
PATCH  /api/v1/hackathons/:id
DELETE /api/v1/hackathons/:id
```

### Growth 🔒

```text
GET    /api/v1/growth/history
```

### Career readiness 🔒

```text
GET    /api/v1/career/readiness
```

### Resume 🔒

```text
GET    /api/v1/resume
POST   /api/v1/resume            (multipart, field name "resume")
GET    /api/v1/resume/download
POST   /api/v1/resume/analyse
DELETE /api/v1/resume
```

PDF only, 5MB maximum, validated on its bytes rather than its declared type.
Text is extracted locally with `pdfjs-dist` — no external service and no API
key. Scanned PDFs have no text layer and are reported as such rather than
stored as empty.

Technologies found in the text are **reported, never written as skills**. A
resume mentions tools in passing, often describing a team’s stack rather than
the author’s own work, so the user confirms them.

Files are stored under `Backend/uploads/` (gitignored) with generated names —
an uploaded filename is user input and never reaches the filesystem.

Roles are sets of explicit requirements checked against stored evidence. Each
requirement reports whether it was met and names what satisfied it, so every
point in a score traces back to one sentence. Weights are 1–3 — supporting,
important, core — and a score is the share of requirement weight met.

Computed on read rather than stored: a saved score goes stale the moment the
next analysis completes.

Reconstructed from stored timestamps — nothing is interpolated or back-filled.
Months with no measurement are omitted rather than returned as zero, and
improvement is only reported per repository across repeated analyses: comparing
one repository against another measures two codebases, not progress.

A hackathon is entirely self-reported, so it never promotes a skill. Listed
technologies are created at `CLAIMED` if they do not already exist, and an
existing skill is left on whatever rung it already occupies.

A **completed** course promotes the skills it names to `LEARNED`; one still in
progress promotes nothing. Reopening or deleting it drops those skills back to
`CLAIMED`, unless a certification or repository evidence still holds them higher.

### Coding profiles 🔒

```text
GET    /api/v1/coding-profiles
POST   /api/v1/coding-profiles
POST   /api/v1/coding-profiles/:platform/sync
DELETE /api/v1/coding-profiles/:platform
```

`platform` is `LEETCODE` or `GEEKSFORGEEKS`. Connecting fetches the profile
before anything is written, so an invalid or private username leaves no row
behind. A sync re-fetches using the *stored* username rather than one supplied
by the caller, so it can never quietly repoint a profile at another account.

Neither platform is an authenticated API — LeetCode's own GraphQL endpoint and
GeeksforGeeks' page payload are both undocumented and unversioned — so a shape
change upstream costs statistics rather than failing the sync, and an unreachable
platform returns 503 rather than 500.

### AI 🔒

```text
GET    /api/v1/ai/insights
```

### Webhooks

```text
GET    /api/v1/webhooks/github/status
POST   /api/v1/webhooks/github
```

🔒 = requires the session cookie.

---

## 🖥️ Frontend Routes

```text
/                              Landing page (Spline background)
/login                         Login / register

/demo                          Public read-only demo → /demo/overview
/demo/:section                 Sample-data mirror of every dashboard section

/dashboard/overview            🔒 live backend data
/dashboard/repositories        🔒 live backend data
/dashboard/repositories/:id    🔒 live backend data
/dashboard/developer-360       🔒 live backend data
/dashboard/skills              🔒 live backend data
/dashboard/problem-solving     🔒 live backend data
/dashboard/learning            🔒 live backend data
/dashboard/growth              🔒 live backend data
/dashboard/career-readiness    🔒 live backend data
/dashboard/ai-insights         🔒 live backend data
/dashboard/settings            🔒 GitHub connect / sync / disconnect
```

---

## 🎮 Demo Mode

`/demo` renders the same ten dashboard pages against synthetic fixtures — no account,
no backend, no real personal data. It exists so anyone can evaluate the product before
connecting anything.

- **Public by design:** the demo routes sit outside the auth guard deliberately; nothing
  below `/dashboard` changed to make them public.
- **Read-only:** while the demo is mounted, the API client refuses every write
  (POST/PATCH/DELETE) with a clear explanation — no request is even sent, so a demo
  visitor cannot touch an account they do not have.
- **Honest:** sample screens are labelled as sample data on screen, and the fixtures
  are deterministic for a given day.

Open it locally at `http://localhost:5173/demo` once the frontend is running, or click
**Explore Demo** on the landing page.

---

## ⚙️ Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

| Job | Checks |
|---|---|
| **Backend** | `npm ci`, migrations applied to an empty database, schema/migration drift check, build + 130 tests, dependency audit |
| **Frontend** | `npm ci`, typecheck, production build, 59 tests, dependency audit |
| **Browser E2E** | Playwright Chromium drives the production build + the compiled backend against a disposable Postgres: 20 journeys (homepage, auth, dashboard, demo, mocked repository flow, regressions) |
| **Docker** | Both images build |

Migrations run against a fresh PostgreSQL service container, so one that only
works on an already-populated schema fails in CI rather than on a teammate’s
machine. The drift check fails when the committed migrations no longer
reproduce `schema.prisma`.

The audit step fails only on a high or critical advisory in a **production**
dependency. Dev tooling is reported but never blocks: a ReDoS in the hot-reload
file watcher is a different risk from one in a request path, and failing every
push on it would only teach everyone to ignore the step.

---

## 🧪 Testing

The backend suites run on the compiled output (`npm test` builds first); the frontend
suite runs its `.mts` sources directly with `node --test`.

```bash
cd Backend
npm test              # 130 tests: 100 service + 30 integration
npm run test:unit     # 100 service tests, database stubbed
npm run test:integration  # 30 tests over real HTTP, Prisma and PostgreSQL
```

```bash
cd Frontend
npm test              # 59 tests: UTC date logic, difficulty fallbacks,
                      # demo isolation, API-client envelope & demo guard
```

### Browser end-to-end tests (Playwright)

The E2E suite drives the **production build** (`vite preview`) with real Chromium
against the **compiled backend**, on an isolated stack — its own
`devproof_e2e_test` database (recreated per run on the local Postgres), its own
port (5399), and GitHub OAuth + Groq disabled. Nothing in it can touch
`devproof_db` or any live external service.

```bash
# One-time setup
cd Backend && npm run build     # the suite runs dist/server.js, not ts-node
cd ../Frontend
npx playwright install chromium # one-time browser download (--with-deps on Linux)

# Every run (builds the e2e bundle, then runs Playwright)
npm run test:e2e
```

Prerequisite: the local Postgres from `docker compose up -d postgres` (port
5434), or point the suite at any disposable Postgres with `E2E_DATABASE_URL`.
To test an already-running stack instead of the managed one, set `E2E_BASE_URL`
(and `E2E_API_ORIGIN`) — Playwright then starts no servers.

What it covers: the public homepage (console-clean, lazy dashboard chunks,
Spline device/reduced-motion gating, 390px overflow), signed-out redirects and
login error states, register → dashboard → logout, every dashboard section for
a signed-in user, nested-route deep links, cross-account data isolation, demo
mode (synthetic-data badge, no write request ever reaches the API, Exit Demo),
the repository connect/analysis UI with GitHub mocked at the browser network
layer (loading, success, empty, error), and resume upload error handling.

The login rate limit (10 attempts / 15 min per IP) is a real security control
and is **not** relaxed for tests: global setup signs each test account in once
and saves the session as Playwright storage state, which every other spec
injects; only `auth.spec.ts` drives the login form itself.

Test-account passwords are **never committed**. Each run generates fresh ones
and stores them in the git-ignored `e2e/.auth/credentials.json` (alongside the
saved sessions), so global setup and every worker agree on one password per
run. Against the managed stack nothing needs configuring: the database — and
with it the accounts — is recreated from scratch on every run. When pointing
the suite at an already-running stack (`E2E_BASE_URL`) whose accounts predate
the run, set `E2E_MAIN_PASSWORD` / `E2E_ISOLATION_PASSWORD` to those accounts’
passwords; the suite fails with an explicit message rather than an unexplained
login error if it cannot create or log in the test users. These passwords only
ever authenticate against the disposable E2E database, never a real one.

**What the mocks do not prove:** a browser test with mocked GitHub responses
does not verify live GitHub OAuth, the GitHub App installation flow, webhook
delivery, or real repository analysis. Those need real credentials and stay
outside the automated suite.

**Service tests** stub Prisma and cover the rules: skill derivation and its
confidence ceilings, certification and course matching, LeetCode and
GeeksforGeeks mapping,
growth arithmetic, readiness scoring, resume validation.

**Integration tests** start the app on an ephemeral port and drive it over HTTP
against a real database, covering the things only visible end to end: that every
protected route rejects an anonymous caller, that validation returns field-level
errors, that a completed course promotes a skill through the whole stack, and
that one user can neither list, modify nor delete another user’s records.

They use a separate `<database>_test` database, created and migrated on first
run, so a test run can never touch development data.

Production builds:

```bash
cd Backend
npm run build
```

```bash
cd Frontend
npm run build
```

---

## 🧯 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend exits immediately on start | Postgres not running, or wrong port | `cd Backend && docker compose up -d`; the local port is **5434**, not 5432 |
| `Cannot find module …` after a pull | New dependency | `cd Backend && npm install` |
| Missing table / column after a pull | New migration | `npx prisma migrate deploy` |
| Type errors about columns that exist in `schema.prisma` | Stale generated client | `npx prisma generate` |
| `DATABASE_URL is required` at boot | `Backend/.env` missing | Copy `Backend/.env.example` to `Backend/.env` and fill it in |
| "GitHub OAuth is not configured…" or a bounce back to `/login?error=` | Missing or wrong GitHub credentials | Use a **GitHub App** client id (`Iv1.` / `Iv23` prefix) and secret; an OAuth App id is rejected on purpose |
| Webhook POSTs return 503 | `GITHUB_WEBHOOK_SECRET` unset | Set it to the same value configured on the GitHub App |
| AI Insights returns 503 | `GROQ_API_KEY` unset | Set it — or ignore it; the rest of the app works without it |
| Landing page loads but every dashboard request fails | Backend not running, or wrong API URL | Start the backend; point `Frontend/.env` (`VITE_API_URL`) at it if it is not on `localhost:5000` |
| Browser tab still shows the old favicon | Browser icon cache | Icon URLs are versioned (`?v=…`); hard-refresh the page |

---

## 🔒 Engineering Principles

### Evidence Over Claims

A technology should be supported by actual engineering activity.

### No Fabricated Metrics

Unavailable data is represented as unavailable rather than invented. A missing average score
is `null`, not a placeholder number; an unanalyzed repository reads **Analysis Pending**; and
sample-data screens say so on screen.

### Server-Side Secrets

OAuth credentials and access tokens remain on the backend.

### User Ownership

Developer data is scoped to the authenticated user; a repository is tracked at most once per
user and never leaks across users.

### Optional Integrations Degrade Cleanly

Missing GitHub or Groq credentials produce a clear error at call time, never a startup crash.

---

## 🎯 Vision

> **Your engineering profile should be backed by evidence, not just claims.**

A developer shouldn't have to repeatedly explain what they can do.

DevProof should be able to show the evidence behind it.

```text
          What You Built
                +
          How You Built It
                +
          What You Solved
                +
          What You Learned
                +
          How You Improved
                ↓
         ┌───────────────┐
         │   DevProof    │
         │   Developer   │
         │  Intelligence │
         └───────────────┘
```

---

## 🤝 Contributing

1. Branch from `main` (`git checkout -b fix/short-description`).
2. Keep commits conventional (`feat:`, `fix:`, `test:`, `docs:`, `ci:`).
3. Behaviour changes need tests; both suites must pass locally
   (`cd Backend && npm test`, `cd Frontend && npm test`).
4. Add new migrations with `npx prisma migrate dev` and commit the generated
   migration folder — never edit an already-applied migration.
5. Open a pull request. CI re-runs the migrations, both test suites, both builds,
   the dependency audit and the Docker builds.

---

## 👨‍💻 Author

**Ishaan Saxena**
**Hardesh Agarwal**

Developers focused on building full-stack, AI-powered, and data-driven software systems.

---

## 📄 License

DevProof is proprietary software developed by **Ishaan Saxena and Hardesh Agarwal**.

Unauthorized copying, redistribution, modification, or commercial use is not permitted without prior written permission from the copyright holder.

Third-party libraries, frameworks, APIs, fonts, icons, and services remain subject to their respective licenses.

---

<p align="center">

<strong>🧠 DevProof</strong>

<br>

Connect your engineering. Prove your skills. Understand your growth.

</p>
