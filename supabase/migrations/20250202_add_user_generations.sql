-- Create user_generations table
CREATE TABLE IF NOT EXISTS user_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    used_in_card UUID REFERENCES cards(id),
    is_used BOOLEAN DEFAULT false
);

-- Create indices for better performance
CREATE INDEX user_generations_user_id_idx ON user_generations(user_id);
CREATE INDEX user_generations_used_in_card_idx ON user_generations(used_in_card);

-- Enable RLS
ALTER TABLE user_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own generations"
    ON user_generations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
    ON user_generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations"
    ON user_generations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations"
    ON user_generations
    FOR DELETE
    USING (auth.uid() = user_id);
