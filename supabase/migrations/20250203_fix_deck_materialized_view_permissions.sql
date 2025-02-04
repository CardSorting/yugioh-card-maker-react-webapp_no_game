-- Drop existing triggers first
DROP TRIGGER IF EXISTS refresh_deck_details_on_deck_change ON decks;
DROP TRIGGER IF EXISTS refresh_deck_details_on_cards_change ON deck_cards;

-- Drop existing function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS refresh_deck_details_materialized() CASCADE;

-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS deck_details_materialized;

-- Recreate materialized view
CREATE MATERIALIZED VIEW deck_details_materialized AS
SELECT * FROM deck_details;

-- Create unique index to support concurrent refresh
CREATE UNIQUE INDEX deck_details_materialized_id_idx ON deck_details_materialized(id);
CREATE INDEX deck_details_materialized_user_id_idx ON deck_details_materialized(user_id);

-- Grant access to the materialized view
GRANT SELECT ON deck_details_materialized TO authenticated;

-- Create refresh function with security definer
CREATE OR REPLACE FUNCTION refresh_deck_details_materialized()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW deck_details_materialized;
  RETURN NULL;
END;
$$;

-- Create triggers to refresh the materialized view
CREATE TRIGGER refresh_deck_details_on_deck_change
AFTER INSERT OR UPDATE OR DELETE ON decks
FOR EACH STATEMENT EXECUTE FUNCTION refresh_deck_details_materialized();

CREATE TRIGGER refresh_deck_details_on_cards_change
AFTER INSERT OR UPDATE OR DELETE ON deck_cards
FOR EACH STATEMENT EXECUTE FUNCTION refresh_deck_details_materialized();

-- Grant execute permission on the refresh function
GRANT EXECUTE ON FUNCTION refresh_deck_details_materialized() TO authenticated;

-- Initial refresh
REFRESH MATERIALIZED VIEW deck_details_materialized;
