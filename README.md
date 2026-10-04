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
| Dashboard: Growth, Career Readiness, Problem Solving | ⚠️ Sample data in the UI |
| Skill intelligence endpoints (derived from repo evidence) | ✅ Built |
| Certification endpoints (with evidence-ladder promotion) | ✅ Built |
| Course endpoints (with LEARNED promotion) | ✅ Built |
| Hackathon endpoints | ✅ Built |
| Growth history endpoint | ✅ Built |
| Career readiness scoring | ✅ Built |
| Resume upload + parsing | ✅ Built |
| LeetCode coding-profile sync | ✅ Built |
| GeeksforGeeks / LinkedIn / resume ingestion | ❌ Not built |
| LeetCode / GeeksforGeeks integration | ❌ Not built |

The three sample-data pages render a `SampleDataNotice` banner in the UI naming exactly what
is not real, rather than passing mock numbers off as measurements.

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

Skill intelligence endpoints, competitive-programming ingestion, growth analytics and career
readiness scoring are designed in the schema (`Skill`, `SkillEvidence`, `CodingProfile`,
`TargetRole`, `Recommendation`) but are not yet served by the API.

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
│   │   ├── services/        # auth.ts, github.ts
│   │   └── lib/             # api.ts, types.ts, useResource.ts
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

This starts PostgreSQL, the backend and the frontend together.

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

Optional — `src/lib/api.ts` falls back to that exact value when unset.

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

Adding a certification promotes any skill it names to `CREDENTIAL_VERIFIED`,
unless repository evidence already places it higher. Removing the last
certification backing a skill drops it back to `CLAIMED`.

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
/                              Landing page
/login                         Login / register

/dashboard/overview            🔒 live data
/dashboard/repositories        🔒 live data
/dashboard/repositories/:id    🔒 live data
/dashboard/developer-360       🔒 live data
/dashboard/skills              🔒 live data
/dashboard/problem-solving     🔒 sample data
/dashboard/credentials         🔒
/dashboard/growth              🔒 sample data
/dashboard/career-readiness    🔒 sample data
/dashboard/ai-insights         🔒 live data
/dashboard/settings            🔒
```

---

## ⚙️ Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

| Job | Checks |
|---|---|
| **Backend** | `npm ci`, migrations applied to an empty database, schema/migration drift, typecheck, 73 tests |
| **Frontend** | `npm ci`, typecheck, production build |
| **Docker** | Both images build |

Migrations run against a fresh PostgreSQL service container, so one that only
works on an already-populated schema fails in CI rather than on a teammate’s
machine. The drift check fails when the committed migrations no longer
reproduce `schema.prisma`.

---

## 🧪 Testing

The backend test suite runs on the built output via `node --test`, so `npm test` compiles first:

```bash
cd Backend
npm test
```

Covers the analysis routes, GitHub service, GitHub App service, webhook routes and AI service.

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
