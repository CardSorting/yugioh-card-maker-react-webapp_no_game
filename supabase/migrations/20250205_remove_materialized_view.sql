-- Drop materialized view triggers first
DROP TRIGGER IF EXISTS refresh_deck_details_on_deck_change ON decks;
DROP TRIGGER IF EXISTS refresh_deck_details_on_cards_change ON deck_cards;

-- Drop refresh function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS refresh_deck_details_materialized() CASCADE;

-- Drop materialized view and its indices
DROP MATERIALIZED VIEW IF EXISTS deck_details_materialized;

-- Ensure proper permissions on deck_details view
GRANT SELECT ON deck_details TO authenticated;
