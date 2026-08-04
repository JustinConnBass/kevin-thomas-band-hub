create type public.band_role as enum (
  'Administrator',
  'Bandleader',
  'Band member',
  'Production crew',
  'Substitute musician'
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role band_role not null default 'Band member',
  instrument text,
  created_at timestamptz default now()
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  key text not null,
  bpm int check (bpm between 30 and 300),
  duration_seconds int,
  feel text,
  tags text[] not null default '{}',
  chart text,
  created_by uuid references profiles,
  updated_at timestamptz default now()
);

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text not null,
  address text,
  starts_at timestamptz not null,
  doors_at timestamptz,
  soundcheck_at timestamptz,
  itinerary jsonb default '[]',
  advance text,
  fee_cents int,
  status text default 'Hold',
  created_by uuid references profiles,
  updated_at timestamptz default now()
);

create table public.setlist_items (
  gig_id uuid references gigs on delete cascade,
  song_id uuid references songs on delete cascade,
  position int not null,
  primary key (gig_id, song_id)
);

create table public.availability (
  gig_id uuid references gigs on delete cascade,
  user_id uuid references profiles on delete cascade,
  response text check (response in ('available', 'unavailable', 'maybe', 'pending')),
  updated_at timestamptz default now(),
  primary key (gig_id, user_id)
);

create table public.musician_notes (
  song_id uuid references songs on delete cascade,
  user_id uuid references profiles on delete cascade,
  note text,
  updated_at timestamptz default now(),
  primary key (song_id, user_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table songs enable row level security;
alter table gigs enable row level security;
alter table setlist_items enable row level security;
alter table availability enable row level security;
alter table musician_notes enable row level security;
alter table audit_log enable row level security;

create function public.my_role()
returns band_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create policy "members read profiles"
on profiles for select to authenticated using (true);

create policy "user updates own profile"
on profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Prevent a member from changing their own role through a direct API request.
revoke update on profiles from authenticated;
grant update (name, instrument) on profiles to authenticated;

create policy "members read songs"
on songs for select to authenticated using (true);

create policy "leaders manage songs"
on songs for all to authenticated
using (my_role() in ('Administrator', 'Bandleader'))
with check (my_role() in ('Administrator', 'Bandleader'));

create policy "members read gigs"
on gigs for select to authenticated using (true);

-- This is the database-level permission check for calendar add/edit/delete.
create policy "leaders manage gigs"
on gigs for all to authenticated
using (my_role() in ('Administrator', 'Bandleader'))
with check (my_role() in ('Administrator', 'Bandleader'));

revoke select (fee_cents) on gigs from authenticated;
grant select (fee_cents) on gigs to service_role;

create function public.get_gig_finance(gig_uuid uuid)
returns table (fee_cents int)
language sql
stable
security definer
set search_path = public
as $$
  select g.fee_cents
  from gigs g
  where g.id = gig_uuid and my_role() = 'Administrator'
$$;

grant execute on function get_gig_finance(uuid) to authenticated;

create policy "members read setlists"
on setlist_items for select to authenticated using (true);

create policy "leaders manage setlists"
on setlist_items for all to authenticated
using (my_role() in ('Administrator', 'Bandleader'))
with check (my_role() in ('Administrator', 'Bandleader'));

create policy "members read availability"
on availability for select to authenticated using (true);

create policy "users set own availability"
on availability for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notes are private"
on musician_notes for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members read audit"
on audit_log for select to authenticated using (true);

create policy "no client audit writes"
on audit_log for insert to authenticated with check (false);

-- Audit payloads deliberately omit fee_cents so finance stays admin-only.
create function public.audit_gig_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (
    actor_id,
    entity_type,
    entity_id,
    action,
    before_data,
    after_data
  ) values (
    auth.uid(),
    'gig',
    coalesce(new.id, old.id),
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then
      jsonb_build_object(
        'title', old.title,
        'venue', old.venue,
        'starts_at', old.starts_at,
        'status', old.status
      )
    end,
    case when tg_op in ('INSERT', 'UPDATE') then
      jsonb_build_object(
        'title', new.title,
        'venue', new.venue,
        'starts_at', new.starts_at,
        'status', new.status
      )
    end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_gigs
after insert or update or delete on gigs
for each row execute function audit_gig_change();

create function public.audit_setlist_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (
    actor_id,
    entity_type,
    entity_id,
    action,
    before_data,
    after_data
  ) values (
    auth.uid(),
    'setlist',
    coalesce(new.gig_id, old.gig_id),
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_setlists
after insert or update or delete on setlist_items
for each row execute function audit_setlist_change();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'band-files',
  'band-files',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
);

create policy "members read band files"
on storage.objects for select to authenticated
using (bucket_id = 'band-files');

create policy "crew upload band files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'band-files'
  and my_role() in ('Administrator', 'Bandleader', 'Production crew')
);
