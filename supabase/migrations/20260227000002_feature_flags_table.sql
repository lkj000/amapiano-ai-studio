-- Feature flags table for progressive rollout of agentic capabilities
create table if not exists public.feature_flags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  enabled boolean not null default true,
  rollout_percentage integer not null default 100 check (rollout_percentage between 0 and 100),
  user_groups text[] not null default '{}',
  description text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: readable by all authenticated users, writable only by service role
alter table public.feature_flags enable row level security;

create policy "Feature flags are readable by authenticated users"
  on public.feature_flags for select
  to authenticated
  using (true);

-- Seed default flags
insert into public.feature_flags (name, enabled, rollout_percentage, description)
values
  ('aura_sidebar',                true,  100, 'Show the Aura AI assistant sidebar'),
  ('enhanced_style_exchange',     true,  100, 'Enable style transfer features'),
  ('ai_model_router',             true,  100, 'Enable multi-provider LLM routing (Lovable → Anthropic fallback)'),
  ('realtime_collaboration',      true,  100, 'Enable collaborative sessions'),
  ('multi_agent_system',          true,  100, 'Enable the full multi-agent composition pipeline'),
  ('cultural_authenticity_engine',true,  100, 'Enable cultural authenticity validation via LLM'),
  ('micro_royalty_system',        true,  100, 'Enable micro-royalty tracking'),
  ('voice_ai_guide',              true,  100, 'Enable voice AI guide'),
  ('neural_music_engine',         true,  100, 'Enable ElevenLabs music generation')
on conflict (name) do update
  set description = excluded.description,
      updated_at = now();

-- Updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.update_updated_at_column();
