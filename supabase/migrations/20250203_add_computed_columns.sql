-- Create materialized view for card details with social features and counts
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

-- Create index for better performance
CREATE INDEX idx_card_details_id ON card_details(id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_card_details()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY card_details;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

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
