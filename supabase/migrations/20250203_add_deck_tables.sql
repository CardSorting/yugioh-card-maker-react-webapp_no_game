-- Grant necessary permissions first
grant usage on schema public to postgres, authenticated;
grant create on schema public to postgres, authenticated;
grant all on all tables in schema public to postgres, authenticated;
grant all on all sequences in schema public to postgres, authenticated;
grant all on all routines in schema public to postgres, authenticated;

-- Create deck_type enum
create type deck_type as enum ('main', 'extra', 'side');

-- Grant usage on the enum type
grant usage on type deck_type to authenticated;

-- Create decks table
create table decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create deck_cards table
create table deck_cards (
  id uuid default gen_random_uuid() primary key,
  deck_id uuid references decks(id) on delete cascade not null,
  card_id uuid references cards(id) on delete cascade not null,
  deck_type deck_type not null,
  position integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes
create index deck_user_id_idx on decks(user_id);
create index deck_cards_deck_id_idx on deck_cards(deck_id);
create index deck_cards_card_id_idx on deck_cards(card_id);

-- Add RLS policies
alter table decks enable row level security;
alter table deck_cards enable row level security;

-- Deck policies
create policy "Users can view their own decks"
  on decks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own decks"
  on decks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own decks"
  on decks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own decks"
  on decks for delete
  using (auth.uid() = user_id);

-- Deck cards policies
create policy "Users can view cards in their decks"
  on deck_cards for select
  using (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can insert cards to their decks"
  on deck_cards for insert
  with check (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can update cards in their decks"
  on deck_cards for update
  using (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
      and decks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can delete cards from their decks"
  on deck_cards for delete
  using (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

-- Create function to update deck updated_at timestamp
create or replace function update_deck_updated_at()
returns trigger as $$
begin
  update decks
  set updated_at = now()
  where id = new.deck_id;
  return new;
end;
$$ language plpgsql;

-- Create trigger to update deck updated_at when cards are modified
create trigger update_deck_timestamp
after insert or update or delete
on deck_cards
for each row
execute function update_deck_updated_at();

-- Create view for deck details including card counts
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
  from deck_cards dc
  where deck_type = 'main'
  and exists (
    select 1 from decks d2
    where d2.id = dc.deck_id
    and d2.user_id = auth.uid()
  )
  group by deck_id
) main_deck on d.id = main_deck.deck_id
left join (
  select deck_id, count(*) as count
  from deck_cards dc
  where deck_type = 'extra'
  and exists (
    select 1 from decks d2
    where d2.id = dc.deck_id
    and d2.user_id = auth.uid()
  )
  group by deck_id
) extra_deck on d.id = extra_deck.deck_id
left join (
  select deck_id, count(*) as count
  from deck_cards dc
  where deck_type = 'side'
  and exists (
    select 1 from decks d2
    where d2.id = dc.deck_id
    and d2.user_id = auth.uid()
  )
  group by deck_id
) side_deck on d.id = side_deck.deck_id
where d.user_id = auth.uid();

-- Grant permissions on deck_details view
grant select on deck_details to authenticated;
