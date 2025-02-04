-- Create storage bucket for card images
-- Note: storage-api extension is automatically enabled by Supabase

INSERT INTO storage.buckets (id, name, public) 
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload card images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view card images" ON storage.objects;

-- Create a policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload card images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'card-images' AND
    auth.uid() = owner
);

-- Create a policy to allow public to view files
CREATE POLICY "Anyone can view card images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-images');

-- Create cards table with user relations
CREATE TABLE IF NOT EXISTS cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Card metadata
    ui_lang TEXT NOT NULL,
    card_lang TEXT NOT NULL,
    holo BOOLEAN DEFAULT false,
    card_rare TEXT,
    
    -- Card details
    card_key TEXT,
    card_title TEXT NOT NULL,
    card_image_path TEXT,
    storage_object_id UUID REFERENCES storage.objects(id),
    card_type TEXT NOT NULL CHECK (card_type IN ('Monster', 'Spell', 'Trap')),
    card_subtype TEXT,
    card_effect_1 TEXT,
    card_effect_2 TEXT,
    card_attribute TEXT,
    card_race TEXT,
    custom_race_enabled BOOLEAN DEFAULT false,
    custom_race TEXT,
    
    -- Monster specific fields
    is_pendulum BOOLEAN DEFAULT false,
    is_special BOOLEAN DEFAULT false,
    card_level TEXT,
    pendulum_blue INTEGER,
    pendulum_red INTEGER,
    pendulum_size INTEGER,
    pendulum_info TEXT,
    card_atk TEXT,
    card_def TEXT,
    
    -- Link monster data as JSONB for flexibility
    links JSONB,
    
    -- Card text
    info_size TEXT,
    card_info TEXT,

    CONSTRAINT valid_storage_object CHECK (
        (card_image_path IS NULL AND storage_object_id IS NULL) OR
        (card_image_path IS NOT NULL AND storage_object_id IS NOT NULL)
    )
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cards" ON cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON cards;

-- Create an RLS policy to allow users to only see their own cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards"
    ON cards
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
    ON cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
    ON cards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
    ON cards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create indices for better performance
DROP INDEX IF EXISTS cards_user_id_idx;
DROP INDEX IF EXISTS cards_storage_object_id_idx;
CREATE INDEX cards_user_id_idx ON cards(user_id);
CREATE INDEX cards_storage_object_id_idx ON cards(storage_object_id);
