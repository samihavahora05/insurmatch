<div align="center">

<img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white"/>
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>

# 🛡️ InsurMatch

### AI-powered insurance agent discovery and consultation platform for India

</div>

---

## Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Client and agent sign-up/login via Supabase Auth, with Row Level Security enforced at the database level |
| 🤖 **AI Matchmaker** | Semantic search over agent profiles using pgvector cosine similarity on query embeddings |
| 🔁 **Graceful Fallback** | If the embedding service is unavailable, matching automatically falls back to client-side keyword matching against specialties, company, location, and bio |
| 📇 **Agent Directory** | Browsable, searchable directory of insurance agents with public profile pages |
| 📅 **Booking** | Clients can book consultations directly from an agent's public profile |
| 📊 **Agent Dashboard** | Agents manage their own profile, bookings, and reviews from a dedicated dashboard |
| 🐳 **Containerized** | Full local stack (app + Postgres/pgvector) runs via a single `docker compose up` |

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui-style components, lucide-react
- **Backend:** Bolt Database (Supabase) — Postgres, Auth, Row Level Security, Edge Functions
- **AI/Search:** pgvector cosine similarity (`<=>`) over agent profile embeddings, via a Deno edge function
- **Containerization:** Docker + docker-compose

## Folder Structure

```
app/
├── login/                      # Sign in
├── register/                   # Sign up as client or agent
├── app/                        # Client tabbed app
│   ├── dashboard/               
│   ├── matchmaker/              # AI-powered agent search
│   ├── directory/               
│   └── account/
├── agent/[id]/                 # Public agent profile + booking
└── agent-dashboard/             # Agent's own dashboard

components/                     # Shared UI (shadcn-style primitives + app components)

lib/
├── supabase/                   # Supabase clients, auth context
├── types/
└── matching.ts                 # Client-side keyword-matching fallback

supabase/
├── migrations/
│   ├── 0001_init.sql           # Schema, RLS, indexes, pgvector, RPCs
│   └── 0002_seed.sql           # 10 demo agents + sample reviews
└── functions/
    └── generate-embedding/     # Deno edge function

Dockerfile                      # Multi-stage build (node:20-alpine builder + lean runner)
docker-compose.yml               # web + db services
```

## How Matching Works

1. **Primary:** the client's query is embedded via the `generate-embedding` edge function, then agents are ranked using the `match_agents` pgvector RPC.
2. **Fallback:** if the edge function or RPC is unavailable, matching falls back to `lib/matching.ts`, doing client-side keyword matching against agent specialties, companies, location, and bio text.

This means the Matchmaker always returns a result, even if the AI service is temporarily down.

## Installation

**Prerequisites:** Node.js, npm, a Supabase (Bolt Database) project, Docker (optional, for containerized setup)

```bash
git clone https://github.com/samihavahora05/insurmatch.git
cd insurmatch

npm install
cp .env.example .env
```

Fill in your Supabase project details in `.env`:
```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Run the SQL migrations against your project (via the Supabase SQL editor, CLI, or MCP deploy tool), in order:
```bash
# supabase/migrations/0001_init.sql   — schema, RLS, indexes, pgvector, RPCs
# supabase/migrations/0002_seed.sql   — 10 demo agents + sample reviews
```

Deploy the embedding edge function:
```bash
supabase functions deploy generate-embedding
supabase secrets set OPENAI_API_KEY=sk-...
```

Run the dev server:
```bash
npm run dev
```
The app runs at [http://localhost:3000](http://localhost:3000).

## Run with Docker

```bash
docker compose up --build
```

This starts:
- **`web`** — the Next.js app at [http://localhost:3000](http://localhost:3000)
- **`db`** — a local `supabase/postgres` instance (Postgres + pgvector) at `localhost:5432`, seeded from `supabase/migrations` on first boot

Set `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` in `.env` before running — point them at the `db` service for a fully local stack, or at your hosted project otherwise.

## Future Improvements

- [ ] Add automated tests for the matching fallback logic
- [ ] Add agent verification/trust badges to the directory
- [ ] Support agent-side analytics on profile views and bookings
- [ ] Add in-app messaging between clients and agents

## License

MIT — see [LICENSE](LICENSE).
