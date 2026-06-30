create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists signal_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  domain text not null,
  type text not null,
  severity text not null,
  actor_id uuid null references users(id) on delete set null,
  actor_type text not null,
  actor_display_name text null,
  actor_role text null,
  subject_id text null,
  participant_id text null,
  property_id text null,
  shift_id text null,
  incident_id text null,
  occurred_at timestamptz not null,
  observed_at timestamptz null,
  received_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  correlation_id text null,
  causation_id text null,
  previous_hash text null,
  hash text not null,
  signature text null,
  visibility text not null default 'provider',
  retention_class text not null default 'standard',
  schema_version integer not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists signal_events_tenant_hash_unique on signal_events (tenant_id, hash);
create index if not exists signal_events_tenant_occurred_idx on signal_events (tenant_id, occurred_at desc, created_at desc);
create index if not exists signal_events_participant_idx on signal_events (tenant_id, participant_id, occurred_at desc);
create index if not exists signal_events_property_idx on signal_events (tenant_id, property_id, occurred_at desc);
create index if not exists signal_events_shift_idx on signal_events (tenant_id, shift_id, occurred_at desc);
create index if not exists signal_events_incident_idx on signal_events (tenant_id, incident_id, occurred_at desc);
create index if not exists signal_events_hash_idx on signal_events (tenant_id, hash);

create table if not exists signal_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references signal_events(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  topic text not null,
  payload jsonb not null,
  published_at timestamptz null,
  attempts integer not null default 0,
  last_error text null,
  locked_at timestamptz null,
  locked_by text null,
  created_at timestamptz not null default now(),
  unique (event_id)
);

create index if not exists signal_outbox_unpublished_idx on signal_outbox (published_at, locked_at, created_at);

create table if not exists workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_event_id uuid not null references signal_events(id) on delete cascade,
  type text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  title text not null,
  description text null,
  assigned_role text null,
  assigned_user_id uuid null references users(id) on delete set null,
  due_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, source_event_id, type)
);

create index if not exists workflow_tasks_tenant_status_idx on workflow_tasks (tenant_id, status, priority, created_at desc);

create table if not exists evidence_objects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  uploaded_by_user_id uuid null references users(id) on delete set null,
  kind text not null,
  filename text not null,
  content_type text not null,
  size_bytes bigint not null,
  storage_uri text not null,
  sha256 text null,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evidence_objects_tenant_idx on evidence_objects (tenant_id, created_at desc);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid null references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_tenant_idx on audit_log (tenant_id, created_at desc);
