# DevProof

**Developer Intelligence Backed by Evidence, Not Claims.**

[![CI](https://github.com/IshaanSaxena2005/DevProof/actions/workflows/ci.yml/badge.svg)](https://github.com/IshaanSaxena2005/DevProof/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat&logo=playwright&logoColor=white)

DevProof turns real engineering activity — GitHub repositories and their
analysis findings, coding-platform profiles, skills, certifications,
hackathons, and a parsed resume — into a structured, evidence-backed
developer-intelligence profile.

Instead of asking what a developer *says* they can do, DevProof shows what
their work demonstrates. Every number on screen is one of three honest kinds,
and the interface never blurs them:

- **Measured** — repository-analysis metrics and findings, coding-platform
  statistics fetched from LeetCode and GeeksforGeeks, growth and readiness
  scores computed from stored evidence.
- **Provided** — certifications, hackathons, claimed skills, and resume
  content the user entered themselves, labelled as such.
- **Generated** — AI insights produced only from stored analyses, validated
  before rendering, and absent (not invented) when no evidence exists.

Connect → Analyze → Verify → Improve → Prove.

## Project Overview

A developer's engineering ability is distributed across platforms: GitHub
shows code, coding platforms show problem-solving, certifications and
hackathons show learning, and a resume shows claims. DevProof consolidates
these signals into one profile where skills are derived from evidence,
scores trace back to individual findings, and unavailable data reads as
unavailable — never as a fabricated zero.

The product is a full-stack TypeScript application: a React SPA with a
public read-only demo, an Express API with GitHub App integration and
webhook intake, PostgreSQL persistence through Prisma, and an optional
Groq-powered insight layer.

## Live Demo

A public, read-only demo of every dashboard section runs with synthetic,
on-screen-labelled sample data — no account, no backend, no real personal
data:

```bash
git clone https://github.com/IshaanSaxena2005/DevProof.git
cd DevProof/Frontend && npm install && npm run dev
# open http://localhost:5173/demo
```

A hosted deployment URL is not recorded in this repository; the demo above
is the verified way to walk the product. See [Demo Mode](#demo-mode) for how
its isolation is enforced.

## Table of Contents

- [Key Features](#key-features)
- [Product Screenshots](#product-screenshots)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Security and Authentication](#security-and-authentication)
- [Project Structure](#project-structure)
- [Local Development and Setup](#local-development-and-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Demo Mode](#demo-mode)
- [Testing and CI](#testing-and-ci)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## Key Features

Every row below exists in the code today. The **Kind** column keeps the
positioning honest: what DevProof measured, what the user provided, and what
the AI layer generated.

| Feature | Description | Kind |
|---|---|---|
| **Authentication & sessions** | Email/password with bcrypt hashing; JWT session in an HTTP-only cookie; session restored on refresh | Provided |
| **GitHub App sign-in** | Authorize and install are separate steps — signing in grants no repository access until the user installs the App and picks repositories; client ids are validated (`Iv1.`/`Iv23`) | Provided |
| **Repository sync** | Connect, sync and disconnect GitHub repositories per installation, without duplicating rows | Measured |
| **Repository analysis engine** | Static analysis scores six categories (documentation, testing, security, code quality, maintainability, dependency health) into metrics plus severity-ranked findings; un-analyzed repositories read “Analysis Pending”, never a fabricated score | Measured |
| **Developer 360** | One aggregated view of repositories, analyses, skills, credentials and target roles | Measured |
| **Skills intelligence** | Skills derived from repository evidence and certifications on a claimed → learned → proven ladder; self-reported records never outrank measured ones | Mixed |
| **LeetCode & GeeksforGeeks sync** | Public profile statistics fetched per platform; statistics a platform does not publish render as unavailable, never as zero | Measured |
| **Problem-solving activity** | 26-week submission heatmap, difficulty donut, activity chart and streaks derived from platform calendars | Measured |
| **Certifications** | CRUD records that promote skills up the evidence ladder | Provided |
| **Hackathons** | Self-reported participation records; by design they never promote a skill | Provided |
| **Resume upload & analysis** | PDF upload (5 MB max, byte-validated), text extracted locally with `pdfjs-dist`; technologies found in the text are reported for confirmation, never written as skills automatically | Provided |
| **Growth analytics** | History reconstructed from stored timestamps — months without measurements are omitted, not back-filled | Measured |
| **Career readiness** | Weighted requirement checklists computed on read from stored evidence; every point names the requirement it came from | Measured |
| **AI insights** | Groq-backed summary of strengths, risks and recommendations, grounded only in stored analyses, Zod-validated before rendering; with no evidence the model is never called | Generated |
| **Account & platform management** | Settings page for profile updates, data export, account deletion, and GitHub / coding-platform connections | Provided |
| **Public demo mode** | Every dashboard section with synthetic, labelled fixtures; writes are refused before any request is sent | Synthetic |
| **Responsive dashboard** | Ten route-split lazy-loaded sections, overflow-free at 390 px (browser-tested) | — |

## Product Screenshots

The fastest way to see the product is the [live local demo](#live-demo). The
captured screenshot set is being assembled against the running stack; every
planned shot and what must be visible in it is tracked in
[docs/screenshots.md](docs/screenshots.md). As each file lands in
`screenshots/`, it is embedded here with a caption — this section never links
an image that does not exist.

| Planned capture | Shows |
|---|---|
| `01-landing-page` → `02-login-register` | Public site and authentication |
| `03-demo-overview` → `04-dashboard-overview` | Sample data vs. live data |
| `05-repositories` → `06-repository-analysis` | Repository intelligence and findings |
| `07-developer-360` → `08-skills-intelligence` | Aggregation and the evidence ladder |
| `09-problem-solving` → `12-career-readiness` | Activity, learning, growth, readiness |
| `13-ai-insights` → `15-mobile-responsive` | AI layer, settings, 390 px layout |

## System Architecture

![DevProof system architecture](docs/architecture.png)

*The full diagram, including its arrow legend, lives in
[docs/architecture.svg](docs/architecture.svg) — the editable source the PNG
is rendered from.*

The system has three zones, drawn apart on purpose:

- **Client** — the React SPA is the only thing in the browser. It holds no
  tokens: the session is an HTTP-only cookie the browser attaches
  automatically, and every dashboard page is a lazy-loaded chunk fetched on
  navigation.
- **Application boundary** — the Express API plus PostgreSQL sit behind
  cookie authentication; every database row is scoped to the authenticated
  user, and repository access is per GitHub App installation. The backend
  owns auth, the analysis engine, skill/evidence services, resume storage and
  local PDF parsing.
- **External services** — GitHub (App REST reads plus inbound webhooks
  verified with a timing-safe HMAC SHA-256 comparison), LeetCode and
  GeeksforGeeks (public statistics from undocumented endpoints), and Groq
  (optional insight generation).

Data moves one way per request: the browser asks the API, the API queries
Prisma, and only the API talks outward — an external service never reaches
the database or the browser directly.

## Technology Stack

Versions below are read from the lockfiles — nothing is listed because it
merely “would fit”.

| Layer | Technology | Role |
|---|---|---|
| UI | React 19, TypeScript (strict) | Component model and type safety across both apps |
| Build | Vite 8 | Dev server and production bundler; `--mode e2e` builds the browser-test bundle |
| Styling | Tailwind CSS 4, custom glass-panel design tokens | Utility styling and the dark dashboard theme |
| Routing | React Router 7 | Route tables shared between `/dashboard` and `/demo` |
| Animation | Motion (`motion/react`), Lucide icons, Spline | Entrance animations, iconography, WebGL landing background |
| API | Node.js 20+, Express 4, TypeScript | HTTP server, routing, middleware pipeline |
| Validation | Zod | Request schemas and AI-response validation |
| Security | bcryptjs, jsonwebtoken, Helmet, CORS, express-rate-limit | Hashing, sessions, headers, origin policy, throttling |
| Logging | Morgan + Winston | Request and application logging |
| Data | PostgreSQL 16, Prisma ORM 5 | Persistence, migrations, typed queries |
| Files | Multer (uploads), `pdfjs-dist` (local text extraction) | Resume intake and parsing without external services |
| Integrations | GitHub App (REST + webhooks), LeetCode GraphQL, GeeksforGeeks page payloads, Groq (`openai/gpt-oss-120b`) | Evidence sources and the optional AI layer |
| Testing | node:test (service + integration), Playwright (20 browser journeys) | Unit, over-HTTP integration, and real-browser coverage |
| Delivery | Docker Compose, GitHub Actions CI | Local full stack and per-push verification |

## Security and Authentication

Verified implementation behaviour — each item exists in the code today:

| Control | Implementation |
|---|---|
| Password storage | bcrypt hashes; plaintext passwords never stored or logged |
| Session | Single JWT in an HTTP-only, SameSite cookie — never in `localStorage` or `sessionStorage`; tokens are never sent to the frontend |
| GitHub sign-in | GitHub **App** flow: client id validated (`Iv1.`/`Iv23` prefix); access tokens stay server-side; repositories are enumerated per installation, so authorizing alone grants nothing |
| Data scoping | Every repository, analysis, skill and credential row is owned by one authenticated user; cross-account reads are blocked at the API and covered by integration and browser tests |
| Request validation | Zod schemas on every mutating endpoint; field-level errors returned |
| Transport hardening | Helmet security headers; credentialed CORS restricted to the configured frontend origin |
| Rate limiting | 200 requests / 15 min per IP on `/api`, plus a dedicated 10 attempts / 15 min budget on password login that never throttles OAuth callbacks or logout |
| Webhook intake | GitHub payloads verified with a timing-safe HMAC SHA-256 comparison; an unverifiable payload is refused, never processed |
| Resume privacy | PDFs validated by content (not declared type), stored server-side under gitignored `uploads/` with generated filenames; text is extracted locally — no external service sees the document |
| Demo isolation | Demo routes sit outside the auth guard by design; while mounted, the API client refuses every write before a request is sent, and the demo renders only its synthetic sample identity |
| Secrets | Everything sensitive arrives via environment variables; `.env` files are gitignored, templates carry placeholders, and no real credential appears in the repository |

Known limitations, stated plainly — see [Testing and CI](#testing-and-ci) for
what automation does **not** prove:

- A session is one JWT with a fixed lifetime (7 days default) and no
  refresh-token endpoint; logging in again issues a fresh token.
- Rate limiters key on client IP: behind a reverse proxy set `TRUST_PROXY` to
  the hop count; secure cookies assume TLS terminates in front of the API.
- LeetCode and GeeksforGeeks are read from undocumented, unversioned
  endpoints; an upstream shape change degrades statistics rather than
  crashing the sync, and private profiles are simply not readable.
- The live GitHub OAuth round trip, real webhook deliveries and live Groq
  responses need real credentials and are covered by tests over the same
  code paths — not by live round trips.

## Project Structure

```text
DevProof/
├── Frontend/                 # React SPA, public demo, browser E2E suite
│   ├── src/
│   │   ├── components/       # landing sections, dashboard primitives, state blocks
│   │   ├── pages/            # Login + dashboard sections (one folder per section)
│   │   │   └── dashboard/ps/ # problem-solving logic as pure .mts modules
│   │   ├── layouts/          # DashboardLayout (sidebar, header, video background)
│   │   ├── context/          # AuthContext
│   │   ├── demo/             # demo routes, shell, synthetic fixtures
│   │   ├── services/         # typed API clients
│   │   └── lib/              # api client, useResource, shared types
│   ├── e2e/                  # Playwright journeys (per-run generated credentials)
│   ├── test/                 # node --test suites over extracted logic
│   └── Dockerfile
│
├── Backend/                  # Express API
│   ├── prisma/               # schema.prisma + committed migrations
│   ├── src/
│   │   ├── controllers/  routes/  services/
│   │   ├── middlewares/  validators/  config/  utils/
│   ├── test/                 # service tests (Prisma stubbed) + integration over HTTP
│   └── Dockerfile
│
├── docs/                     # architecture diagram (SVG + PNG), screenshot checklist
├── screenshots/              # product captures (planned; see docs/screenshots.md)
├── docker-compose.yml        # full stack: postgres + backend + frontend
└── package.json              # root scripts delegating into Backend/Frontend
```

## Local Development and Setup

### Prerequisites

Node.js 20+, npm, Docker Desktop, Git.

### 1. Clone and configure

```bash
git clone https://github.com/IshaanSaxena2005/DevProof.git
cd DevProof

cp Backend/.env.example Backend/.env      # then set JWT_SECRET (required)
# Frontend/.env is optional — the API client defaults to localhost:5000
```

Generate the one required secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# paste the output as JWT_SECRET in Backend/.env
```

All other variables are optional integrations — see
[Environment Variables](#environment-variables).

### 2. Start the full stack with Docker

```bash
docker compose up -d --build
```

This starts PostgreSQL, the backend (healthchecked against the real
`/api/v1/health` endpoint) and the frontend, in that order.

### 3. Or run the apps on the host

```bash
cd Backend
docker compose up -d        # just PostgreSQL — host port 5434, not 5432
npm install
npm run prisma:migrate       # apply all committed migrations
npm run dev                  # http://localhost:5000
```

```bash
cd Frontend
npm install
npm run dev                  # http://localhost:5173
```

Open http://localhost:5173 — register an account, or explore the public demo
at http://localhost:5173/demo without one.

### After every pull

Three things can arrive with a pull, and each fails at runtime with an error
that does not name its cause:

```bash
cd Backend
npm install                 # new dependencies
npx prisma migrate deploy   # new migrations
npx prisma generate         # regenerate the client
```

Root-level shortcuts (`npm run dev:backend`, `dev:frontend`, `build`, `test`,
`docs:check`) delegate into the two apps and the documentation validator.

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend exits on start; connection refused | Postgres not running, or wrong port | `cd Backend && docker compose up -d` — the local port is **5434** |
| `Cannot find module …` after a pull | New dependency | `cd Backend && npm install` |
| Missing table/column after a pull | New migration or stale client | `npx prisma migrate deploy && npx prisma generate` |
| `DATABASE_URL is required` at boot | `Backend/.env` missing | Copy `Backend/.env.example` to `Backend/.env` and set `JWT_SECRET` |
| “GitHub OAuth is not configured…” or bounce to `/login?error=` | OAuth-App credentials where a **GitHub App** is required | Use a GitHub App client id (`Iv1.` / `Iv23`); OAuth-App ids are rejected on purpose |
| AI Insights returns 503 | `GROQ_API_KEY` unset | Set it — or ignore it; the rest of the app works without it |
| Landing loads but every dashboard request fails | Backend not running or wrong API URL | Start the backend; point `Frontend/.env` (`VITE_API_URL`) at it if not on `localhost:5000` |

## Environment Variables

Both apps ship a template — copy `Backend/.env.example` to `Backend/.env` and
fill in the values. Only two are required; every optional integration
degrades cleanly (clear error at call time, never a startup crash).

### Backend — `Backend/.env`

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (local compose: port **5434**) |
| `JWT_SECRET` | ✅ | Session-token signing key, minimum 8 characters — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `PORT` | no | API port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` / `test` |
| `JWT_EXPIRES_IN` | no | Session lifetime (default `7d`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | no | GitHub **App** sign-in; the id must start with `Iv1.` or `Iv23` — anything else is rejected |
| `GITHUB_CALLBACK_URL` | no | OAuth callback registered on the App (default `http://localhost:5000/api/v1/auth/github/callback`) |
| `GITHUB_APP_ID` / `GITHUB_PRIVATE_KEY` | no | App-authenticated calls (installation enumeration, App JWT). The key is the App's `.pem` content pasted verbatim — literal `\n` escapes will not work |
| `GITHUB_APP_SLUG` | no | Only shapes the “install DevProof” link |
| `GITHUB_WEBHOOK_SECRET` | no | Shared HMAC secret you invent and paste into the App's webhook settings; without it every webhook is refused with 503 |
| `FRONTEND_URL` | no | CORS origin (default `http://localhost:5173`) |
| `TRUST_PROXY` | no | Proxy hop count (positive integer, usually `1`) when TLS terminates in front of the API; empty when directly exposed — `true` is never accepted |
| `GROQ_API_KEY` | no | Enables AI insights; unset means a clear 503 on that endpoint only |
| `GROQ_MODEL` | no | Model override (default `openai/gpt-oss-120b`) |

### Frontend — `Frontend/.env`

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | no | Backend base URL; falls back to `http://localhost:5000/api/v1` |

Never commit `.env` files, OAuth secrets, JWT secrets, or API keys — all are
gitignored, and the committed templates carry placeholders only.

## API Overview

All routes are mounted under `/api/v1`. Endpoints marked **(auth)** require
the session cookie; everything else is public or webhook-authenticated.

| Group | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` (auth), `GET /auth/github`, `GET /auth/github/callback`, `POST /auth/github/sync` (auth), `POST /auth/github/disconnect` (auth) |
| Repositories (auth) | `GET /repositories`, `GET /repositories/github`, `GET /repositories/:id`, `POST /repositories/connect`, `POST /repositories/sync`, `DELETE /repositories/:id` |
| Analysis (auth) | `POST /analysis/trigger`, `GET /analysis/repo/:repositoryId`, `GET /analysis/:id` |
| Developer 360 (auth) | `GET /developer360/overview` |
| Skills (auth) | `GET /skills`, `POST /skills`, `POST /skills/derive`, `DELETE /skills/:id` |
| Certifications (auth) | `GET /certifications`, `POST /certifications`, `PATCH /certifications/:id`, `DELETE /certifications/:id` |
| Hackathons (auth) | `GET /hackathons`, `POST /hackathons`, `PATCH /hackathons/:id`, `DELETE /hackathons/:id` |
| Coding profiles (auth) | `GET /coding-profiles`, `POST /coding-profiles`, `POST /coding-profiles/:platform/sync`, `DELETE /coding-profiles/:platform` — platform is `LEETCODE` or `GEEKSFORGEEKS` |
| Growth (auth) | `GET /growth/history` |
| Career readiness (auth) | `GET /career/readiness` |
| Resume (auth) | `GET /resume`, `POST /resume` (multipart field `resume`; PDF only, 5 MB max), `GET /resume/download`, `POST /resume/analyse`, `DELETE /resume` |
| AI (auth) | `GET /ai/insights` |
| Webhooks | `POST /webhooks/github` (HMAC-verified), `GET /webhooks/github/status` |

> **Note on Courses.** A courses subsystem (`/courses` CRUD with skill
> promotion) still exists in the codebase — including a mounted route group —
> but it is **designated for removal** and is therefore excluded from this
> documentation and from the feature list. Removing it cleanly requires
> dropping the `Course` model, its migrations, service, validator, tests and
> the Learning page section; that has not been done yet, and this README does
> not pretend otherwise.

Request constraints worth knowing: resumes are PDF-only and validated by
their bytes, coding-profile usernames are fetched before anything is written
(an invalid or private handle leaves no row), and every mutation is Zod
validated with field-level errors.

## Demo Mode

`/demo` renders the same ten dashboard sections against synthetic fixtures —
no account, no backend, no real personal data:

- **Public by design** — demo routes sit outside the auth guard; nothing below
  `/dashboard` was weakened to make them reachable.
- **Read-only by construction** — while the demo shell is mounted, the API
  client refuses every write (POST/PATCH/DELETE) before any request is sent,
  so a visitor cannot touch an account they do not have.
- **Honest on screen** — sample screens carry a sample-data badge and a
  notice explaining the fixtures are fictional; the sample identity is the
  only identity the shell renders, even when a signed-in visitor opens the
  demo.

Open `http://localhost:5173/demo` or click **Explore Demo** on the landing
page. The browser E2E suite asserts the badge, the write-refusal, and that
demo navigation never escapes its prefix.

## Testing and CI

Four stages of testing, all executed locally against the current source as
part of this documentation pass:

| Suite | Count | What it proves |
|---|---|---|
| Backend service | 107 | Business rules with Prisma stubbed: skill derivation and confidence ceilings, certification matching, LeetCode/GFG mapping, growth arithmetic, readiness scoring, resume validation, webhook signature handling |
| Backend integration | 43 | The real HTTP stack over real PostgreSQL: anonymous callers rejected on every protected route, field-level validation errors, cross-user isolation, skill promotion end to end |
| Frontend | 63 | Extracted logic under `node --test`: UTC date handling, difficulty fallbacks, demo fixtures and isolation, API-client envelope, page render-state rules |
| Browser E2E | 20 | Playwright Chromium against the production build + compiled backend: auth journeys, every dashboard section, demo mode, mocked repository flows, 390 px overflow, console cleanliness |

```bash
cd Backend  && npm test          # builds, then service + integration suites
cd Frontend && npm test          # node --test over .mts sources
cd Frontend && npm run test:e2e  # builds the e2e bundle, runs Playwright
```

Isolation guarantees: integration tests use a dedicated `<database>_test`
schema derived from your `DATABASE_URL`; the browser suite runs against a
dropped-and-recreated `devproof_e2e_test` database on port 5399 with GitHub
and Groq disabled; E2E account passwords are generated per run and never
committed.

GitHub Actions (`.github/workflows/ci.yml`) runs five jobs on every push and
pull request to `main`: **docs** (link, anchor and image validation),
**backend** (migrations on an empty disposable
Postgres, schema-drift check, build + 150 tests, production-dependency
audit), **frontend** (typecheck, build, 63 tests, audit), **browser E2E**
(20 journeys), and **docker** (both images build).

**What the automated suite does not prove:** live GitHub OAuth, the GitHub
App installation flow, real webhook delivery, and live Groq responses need
real credentials and stay outside CI — the same code paths are exercised
with stubs, which is not the same as a live round trip.

## Deployment

Current state, stated precisely:

- **Frontend** — deployed to **Vercel** as a static build. No production URL
  is recorded in this repository; add it here once the deployment is
  confirmed.
- **Backend** — hosted separately; no provider, URL or production database
  has been confirmed in this repository, so none is claimed. The Dockerfile
  and `docker-compose.yml` (including the named `uploads` volume so resumes
  survive container recreation) define the intended deployment shape.

### Production checklist

When a production backend is stood up, the verified configuration surface is
small and entirely environment-driven:

1. **Secrets** — set a fresh `JWT_SECRET` (never the example value),
   `GITHUB_WEBHOOK_SECRET`, and real GitHub App + Groq credentials through
   your secret manager; never bake them into images.
2. **Database** — a dedicated PostgreSQL instance; apply committed
   migrations with `npx prisma migrate deploy` on release, and back up both
   the database and the uploads volume.
3. **TLS and cookies** — terminate HTTPS in front of the API; secure cookies
   assume TLS. Set `TRUST_PROXY` to the proxy hop count so rate limiting
   keys on real client IPs.
4. **CORS** — set `FRONTEND_URL` to the exact production frontend origin.
5. **GitHub App** — register the production callback URL on the App; preview
   and production frontends share one App unless separated deliberately.
6. **Health** — `/api/v1/health` reports database connectivity and is the
   compose healthcheck; use it for liveness probes.

## Contributing

1. Branch from `main` (`git checkout -b fix/short-description`).
2. Keep commits conventional (`feat:`, `fix:`, `test:`, `docs:`, `ci:`).
3. Behaviour changes need tests; both suites must pass locally
   (`cd Backend && npm test`, `cd Frontend && npm test`).
4. Add migrations with `npx prisma migrate dev` and commit the generated
   migration folder — never edit an already-applied migration.
5. Open a pull request; CI re-runs migrations, tests, builds, the dependency
   audit, and the Docker builds before anything merges.

## Authors

**Ishaan Saxena**

**Hardesh Agarwal**

Full-stack, AI-powered, and data-driven software systems.

## License

DevProof is proprietary software developed by **Ishaan Saxena and Hardesh
Agarwal**. Unauthorized copying, redistribution, modification, or commercial
use is not permitted without prior written permission from the copyright
holder. (The repository does not currently carry a standalone `LICENSE`
file; the terms above are the project's statement of record.)

Third-party libraries, frameworks, APIs, fonts, icons, and services remain
subject to their respective licenses.
