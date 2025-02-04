-- Add public column to decks table
alter table decks
add column public boolean default false;

-- Create deck_bookmarks table
create table deck_bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  deck_id uuid references decks(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, deck_id)
);

-- Add index for deck_bookmarks
create index deck_bookmarks_user_id_idx on deck_bookmarks(user_id);
create index deck_bookmarks_deck_id_idx on deck_bookmarks(deck_id);

-- Enable RLS on deck_bookmarks
alter table deck_bookmarks enable row level security;

-- Update deck RLS policies to allow viewing public decks
drop policy if exists "Users can view their own decks" on decks;
create policy "Users can view their own or public decks"
  on decks for select
  using (auth.uid() = user_id or public = true);

-- Deck bookmarks policies
create policy "Users can view their own bookmarks"
  on deck_bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can add their own bookmarks"
  on deck_bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own bookmarks"
  on deck_bookmarks for delete
  using (auth.uid() = user_id);

-- Update deck_details view to include public status and bookmark counts
drop materialized view if exists deck_details_materialized;
drop view if exists deck_details cascade;
create view deck_details as
select 
  d.id,
  d.user_id,
  d.name,
  d.public,
  d.created_at,
  d.updated_at,
  coalesce(main_deck.count, 0) as main_deck_count,
  coalesce(extra_deck.count, 0) as extra_deck_count,
  coalesce(side_deck.count, 0) as side_deck_count,
  coalesce(bookmark_count.count, 0) as bookmark_count,
  exists(
    select 1 from deck_bookmarks db
    where db.deck_id = d.id
    and db.user_id = auth.uid()
  ) as is_bookmarked
from decks d
left join (
  select deck_id, count(*) as count
  from deck_cards dc
  where deck_type = 'main'
  group by deck_id
) main_deck on d.id = main_deck.deck_id
left join (
  select deck_id, count(*) as count
  from deck_cards dc
  where deck_type = 'extra'
  group by deck_id
) extra_deck on d.id = extra_deck.deck_id
left join (
  select deck_id, count(*) as count
  from deck_cards dc
  where deck_type = 'side'
  group by deck_id
) side_deck on d.id = side_deck.deck_id
left join (
  select deck_id, count(*) as count
  from deck_bookmarks
  group by deck_id
) bookmark_count on d.id = bookmark_count.deck_id
where d.user_id = auth.uid() or d.public = true;

-- Grant permissions
grant all on deck_bookmarks to authenticated;
grant select on deck_details to authenticated;

-- Recreate the materialized view
create materialized view deck_details_materialized as
select * from deck_details;

-- Grant permissions on materialized view
grant select on deck_details_materialized to authenticated;

-- Create function to refresh materialized view
create or replace function refresh_deck_details_materialized()
returns trigger as $$
begin
  refresh materialized view concurrently deck_details_materialized;
  return null;
end;
$$ language plpgsql;

-- Create triggers to refresh materialized view
create trigger refresh_deck_details_mv
after insert or update or delete
on decks
for each statement
execute procedure refresh_deck_details_materialized();

create trigger refresh_deck_details_mv_cards
after insert or update or delete
on deck_cards
for each statement
execute procedure refresh_deck_details_materialized();

create trigger refresh_deck_details_mv_bookmarks
after insert or update or delete
on deck_bookmarks
for each statement
execute procedure refresh_deck_details_materialized();
