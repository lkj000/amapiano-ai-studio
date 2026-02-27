create table if not exists public.ethical_data_partnerships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  artist_name text not null,
  contact_email text,
  data_rights_granted text[] default '{}',
  compensation_model text,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table public.ethical_data_partnerships enable row level security;
create policy "Users manage own partnerships" on public.ethical_data_partnerships
  for all to authenticated using (auth.uid() = user_id);

create table if not exists public.micro_royalty_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  partnership_id uuid references public.ethical_data_partnerships(id),
  amount_cents integer not null,
  currency text default 'USD',
  description text,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table public.micro_royalty_transactions enable row level security;
create policy "Users view own transactions" on public.micro_royalty_transactions
  for select to authenticated using (auth.uid() = user_id);
