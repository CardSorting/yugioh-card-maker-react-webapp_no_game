-- Create card_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS card_likes (
    user_id UUID REFERENCES auth.users(id),
    card_id UUID REFERENCES cards(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, card_id)
);

-- Enable RLS on card_likes
ALTER TABLE card_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_likes
DO $$ 
BEGIN
    -- Create policies if they don't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'card_likes' 
        AND policyname = 'Users can view all likes'
    ) THEN
        CREATE POLICY "Users can view all likes"
            ON card_likes FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'card_likes' 
        AND policyname = 'Users can like cards'
    ) THEN
        CREATE POLICY "Users can like cards"
            ON card_likes FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'card_likes' 
        AND policyname = 'Users can unlike cards'
    ) THEN
        CREATE POLICY "Users can unlike cards"
            ON card_likes FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Fix card_comments user_id reference
ALTER TABLE card_comments
DROP CONSTRAINT IF EXISTS card_comments_user_id_fkey,
ADD CONSTRAINT card_comments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id);
