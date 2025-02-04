-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all likes" ON card_likes;
DROP POLICY IF EXISTS "Users can like cards" ON card_likes;
DROP POLICY IF EXISTS "Users can unlike cards" ON card_likes;

-- Enable RLS
ALTER TABLE card_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for card_likes
CREATE POLICY "Users can view all likes"
ON card_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like cards"
ON card_likes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM cards
    WHERE id = card_id
  )
);

CREATE POLICY "Users can unlike cards"
ON card_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate likes
ALTER TABLE card_likes
DROP CONSTRAINT IF EXISTS card_likes_user_id_card_id_key,
ADD CONSTRAINT card_likes_user_id_card_id_key 
UNIQUE (user_id, card_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON card_likes TO authenticated;
GRANT SELECT ON card_likes TO anon;
