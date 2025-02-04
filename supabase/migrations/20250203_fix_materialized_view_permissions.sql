-- Drop existing triggers first
DROP TRIGGER IF EXISTS refresh_card_details_on_like ON card_likes;
DROP TRIGGER IF EXISTS refresh_card_details_on_comment ON card_comments;
DROP TRIGGER IF EXISTS refresh_card_details_on_card_change ON cards;
DROP TRIGGER IF EXISTS refresh_card_details_on_profile_change ON profiles;

-- Drop existing function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS refresh_card_details() CASCADE;

-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS card_details;

-- Recreate materialized view with security definer function
CREATE MATERIALIZED VIEW card_details AS
SELECT 
  c.*,
  p.username as creator_username,
  p.profile_image_path as creator_profile_image,
  COALESCE(l.likes_count, 0) as likes_count,
  COALESCE(cm.comments_count, 0) as comments_count
FROM cards c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN (
  SELECT card_id, COUNT(*) as likes_count
  FROM card_likes
  GROUP BY card_id
) l ON l.card_id = c.id
LEFT JOIN (
  SELECT card_id, COUNT(*) as comments_count
  FROM card_comments
  GROUP BY card_id
) cm ON cm.card_id = c.id;

-- Create unique index to support concurrent refresh
CREATE UNIQUE INDEX card_details_id_idx ON card_details(id);

-- Grant access to the materialized view
GRANT SELECT ON card_details TO anon, authenticated;

-- Create refresh function with security definer
CREATE OR REPLACE FUNCTION refresh_card_details()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW card_details;
  RETURN NULL;
END;
$$;

-- Create triggers to refresh the materialized view
CREATE TRIGGER refresh_card_details_on_like
AFTER INSERT OR DELETE ON card_likes
FOR EACH STATEMENT EXECUTE FUNCTION refresh_card_details();

CREATE TRIGGER refresh_card_details_on_comment
AFTER INSERT OR DELETE ON card_comments
FOR EACH STATEMENT EXECUTE FUNCTION refresh_card_details();

CREATE TRIGGER refresh_card_details_on_card_change
AFTER INSERT OR UPDATE OR DELETE ON cards
FOR EACH STATEMENT EXECUTE FUNCTION refresh_card_details();

-- Add trigger for profile changes since the view includes profile data
CREATE TRIGGER refresh_card_details_on_profile_change
AFTER UPDATE ON profiles
FOR EACH STATEMENT EXECUTE FUNCTION refresh_card_details();

-- Grant execute permission on the refresh function
GRANT EXECUTE ON FUNCTION refresh_card_details() TO authenticated;
