-- Add index to optimize querying cards by user_id
CREATE INDEX IF NOT EXISTS idx_card_details_user_id ON card_details(user_id);

-- Add index to optimize querying likes by user_id and card_id combination
CREATE INDEX IF NOT EXISTS idx_card_likes_user_card ON card_likes(user_id, card_id);

-- Add index to optimize querying bookmarks by user_id and card_id combination
CREATE INDEX IF NOT EXISTS idx_card_bookmarks_user_card ON card_bookmarks(user_id, card_id);
