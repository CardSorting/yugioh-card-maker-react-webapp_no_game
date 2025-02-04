-- Drop existing view
drop view if exists deck_details;
drop materialized view if exists deck_details_materialized;

-- Create base view with security check
create view deck_details as
select 
  d.id,
  d.user_id,
  d.name,
  d.created_at,
  d.updated_at,
  coalesce(main_deck.count, 0) as main_deck_count,
  coalesce(extra_deck.count, 0) as extra_deck_count,
  coalesce(side_deck.count, 0) as side_deck_count
from decks d
left join (
  select deck_id, count(*) as count
  from deck_cards
  where deck_type = 'main'
  group by deck_id
) main_deck on d.id = main_deck.deck_id
left join (
  select deck_id, count(*) as count
  from deck_cards
  where deck_type = 'extra'
  group by deck_id
) extra_deck on d.id = extra_deck.deck_id
left join (
  select deck_id, count(*) as count
  from deck_cards
  where deck_type = 'side'
  group by deck_id
) side_deck on d.id = side_deck.deck_id
where d.user_id = auth.uid();

-- Create materialized view that inherits security
create materialized view deck_details_materialized as
select * from deck_details;

-- Create function to refresh materialized view
create or replace function refresh_deck_details_materialized()
returns trigger as $$
begin
  refresh materialized view deck_details_materialized;
  return null;
end;
$$ language plpgsql;

-- Create triggers to refresh materialized view
drop trigger if exists refresh_deck_details_on_deck_change on decks;
create trigger refresh_deck_details_on_deck_change
after insert or update or delete
on decks
for each statement
execute function refresh_deck_details_materialized();

drop trigger if exists refresh_deck_details_on_cards_change on deck_cards;
create trigger refresh_deck_details_on_cards_change
after insert or update or delete
on deck_cards
for each statement
execute function refresh_deck_details_materialized();

-- Grant permissions
grant select on deck_details to authenticated;
grant select on deck_details_materialized to authenticated;

-- Initial refresh
refresh materialized view deck_details_materialized;

-- Create indexes for better performance
create index deck_details_materialized_user_id_idx on deck_details_materialized(user_id);
create index deck_details_materialized_id_idx on deck_details_materialized(id);
