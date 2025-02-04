-- Drop existing view
DROP VIEW IF EXISTS card_social_features;

-- Ensure columns exist in cards table
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_username TEXT,
ADD COLUMN IF NOT EXISTS creator_profile_image TEXT;

-- Create a function to update likes count
CREATE OR REPLACE FUNCTION update_card_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cards
    SET likes_count = likes_count + 1
    WHERE id = NEW.card_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cards
    SET likes_count = likes_count - 1
    WHERE id = OLD.card_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update comments count
CREATE OR REPLACE FUNCTION update_card_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cards
    SET comments_count = comments_count + 1
    WHERE id = NEW.card_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cards
    SET comments_count = comments_count - 1
    WHERE id = OLD.card_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain counts
DROP TRIGGER IF EXISTS update_card_likes_count_trigger ON card_likes;
CREATE TRIGGER update_card_likes_count_trigger
AFTER INSERT OR DELETE ON card_likes
FOR EACH ROW
EXECUTE FUNCTION update_card_likes_count();

DROP TRIGGER IF EXISTS update_card_comments_count_trigger ON card_comments;
CREATE TRIGGER update_card_comments_count_trigger
AFTER INSERT OR DELETE ON card_comments
FOR EACH ROW
EXECUTE FUNCTION update_card_comments_count();

-- Recreate view with correct column names
CREATE OR REPLACE VIEW card_social_features AS
SELECT 
  c.id as card_id,
  COALESCE(c.likes_count, 0) as likes_count,
  COALESCE(c.comments_count, 0) as comments_count,
  EXISTS (
    SELECT 1 FROM card_likes cl 
    WHERE cl.card_id = c.id 
    AND cl.user_id = auth.uid()
  ) as is_liked,
  EXISTS (
    SELECT 1 FROM card_bookmarks cb 
    WHERE cb.card_id = c.id 
    AND cb.user_id = auth.uid()
  ) as is_bookmarked,
  p.username as creator_username,
  p.profile_image_path as creator_profile_image
FROM cards c
LEFT JOIN profiles p ON c.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON card_social_features TO authenticated;

-- Create an index to improve performance
CREATE INDEX IF NOT EXISTS cards_social_features_idx ON cards(id, likes_count, comments_count);
