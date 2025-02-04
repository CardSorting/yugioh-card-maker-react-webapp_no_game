-- Add foreign key relationship between card_comments and profiles
ALTER TABLE card_comments
DROP CONSTRAINT IF EXISTS card_comments_user_id_fkey,
ADD CONSTRAINT card_comments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id);

-- Create card_bookmarks table
CREATE TABLE card_bookmarks (
    user_id UUID REFERENCES auth.users(id),
    card_id UUID REFERENCES cards(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, card_id)
);

-- Enable RLS
ALTER TABLE card_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_bookmarks
CREATE POLICY "Users can view all bookmarks"
    ON card_bookmarks FOR SELECT
    USING (true);

CREATE POLICY "Users can bookmark cards"
    ON card_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
    ON card_bookmarks FOR DELETE
    USING (auth.uid() = user_id);
