-- Apply this migration in Supabase SQL Editor for an existing Band Hub database.
alter table public.songs add column if not exists feel text;
alter table public.songs add column if not exists tags text[] not null default '{}';
alter table public.gigs add column if not exists doors_at timestamptz;

-- Prevent direct self-promotion through the profiles API.
revoke update on public.profiles from authenticated;
grant update (name, instrument) on public.profiles to authenticated;

create or replace function public.audit_gig_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (
    actor_id, entity_type, entity_id, action, before_data, after_data
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

drop trigger if exists audit_gigs on public.gigs;
create trigger audit_gigs
after insert or update or delete on public.gigs
for each row execute function public.audit_gig_change();

create or replace function public.audit_setlist_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (
    actor_id, entity_type, entity_id, action, before_data, after_data
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

drop trigger if exists audit_setlists on public.setlist_items;
create trigger audit_setlists
after insert or update or delete on public.setlist_items
for each row execute function public.audit_setlist_change();
