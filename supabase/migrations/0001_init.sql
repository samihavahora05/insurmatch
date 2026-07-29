-- InsurMatch: initial schema
-- Enables pgvector for semantic agent matching and sets up all tables
-- with Row Level Security (RLS).

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- agent_profiles
-- ---------------------------------------------------------------------
create table if not exists agent_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  bio text default '',
  years_experience int not null default 0,
  license_number text default '',
  license_state text default '',
  specialties jsonb not null default '[]'::jsonb,
  companies jsonb not null default '[]'::jsonb,
  base_location text not null default '',
  service_areas jsonb not null default '[]'::jsonb,
  is_all_india boolean not null default false,
  rating_avg numeric not null default 0,
  review_count int not null default 0,
  profile_photo_url text,
  embedding_text text default '',
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agent_profiles enable row level security;

create policy "Agent profiles are viewable by all authenticated users"
  on agent_profiles for select
  to authenticated
  using (true);

create policy "Agents can insert their own profile"
  on agent_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Agents can update their own profile"
  on agent_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Agents can delete their own profile"
  on agent_profiles for delete
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- client_profiles
-- ---------------------------------------------------------------------
create table if not exists client_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  contact_number text,
  location text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table client_profiles enable row level security;

create policy "Clients can view their own profile"
  on client_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Clients can insert their own profile"
  on client_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Clients can update their own profile"
  on client_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Clients can delete their own profile"
  on client_profiles for delete
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- consultations
-- ---------------------------------------------------------------------
create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  scheduled_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table consultations enable row level security;

create policy "Participants can view their consultations"
  on consultations for select
  to authenticated
  using (auth.uid() = client_id or auth.uid() = agent_id);

create policy "Clients can create consultations"
  on consultations for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy "Participants can update their consultations"
  on consultations for update
  to authenticated
  using (auth.uid() = client_id or auth.uid() = agent_id)
  with check (auth.uid() = client_id or auth.uid() = agent_id);

create policy "Clients can delete their own consultations"
  on consultations for delete
  to authenticated
  using (auth.uid() = client_id);

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references consultations (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  feedback_text text default '',
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

create policy "Reviews are public"
  on reviews for select
  to authenticated, anon
  using (true);

create policy "Clients can insert their own reviews"
  on reviews for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy "Clients can delete their own reviews"
  on reviews for delete
  to authenticated
  using (auth.uid() = client_id);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_consultations_client_id on consultations (client_id);
create index if not exists idx_consultations_agent_id on consultations (agent_id);
create index if not exists idx_consultations_status on consultations (status);
create index if not exists idx_reviews_agent_id on reviews (agent_id);
create index if not exists idx_reviews_consultation_id on reviews (consultation_id);

-- Approximate nearest-neighbor index for fast semantic search.
-- Note: ivfflat should be created after the table has data for best
-- clustering, but is safe to create up front for a fresh install.
create index if not exists agent_profiles_embedding_idx
  on agent_profiles using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ---------------------------------------------------------------------
-- match_agents RPC: cosine-distance similarity search over agent_profiles
-- ---------------------------------------------------------------------
create or replace function match_agents(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  full_name text,
  email text,
  bio text,
  years_experience int,
  license_number text,
  license_state text,
  specialties jsonb,
  companies jsonb,
  base_location text,
  service_areas jsonb,
  is_all_india boolean,
  rating_avg numeric,
  review_count int,
  profile_photo_url text,
  embedding_text text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    a.id, a.full_name, a.email, a.bio, a.years_experience, a.license_number,
    a.license_state, a.specialties, a.companies, a.base_location,
    a.service_areas, a.is_all_india, a.rating_avg, a.review_count,
    a.profile_photo_url, a.embedding_text, a.created_at, a.updated_at,
    1 - (a.embedding <=> query_embedding) as similarity
  from agent_profiles a
  where a.embedding is not null
  order by a.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------
-- recalc_agent_rating: recompute rating_avg/review_count from reviews
-- ---------------------------------------------------------------------
create or replace function recalc_agent_rating(p_agent_id uuid)
returns void
language plpgsql
as $$
begin
  update agent_profiles
  set
    rating_avg = coalesce((select avg(rating)::numeric(3,2) from reviews where agent_id = p_agent_id), 0),
    review_count = (select count(*) from reviews where agent_id = p_agent_id),
    updated_at = now()
  where id = p_agent_id;
end;
$$;

create or replace function trigger_recalc_agent_rating()
returns trigger
language plpgsql
as $$
begin
  perform recalc_agent_rating(coalesce(new.agent_id, old.agent_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recalc_rating on reviews;
create trigger reviews_recalc_rating
  after insert or update or delete on reviews
  for each row execute function trigger_recalc_agent_rating();
