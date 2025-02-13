-- Drop existing tables if they exist
DROP TABLE IF EXISTS generated_images CASCADE;
DROP TABLE IF EXISTS card_comments CASCADE;
DROP TABLE IF EXISTS card_likes CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create users table (replacing Supabase auth.users)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create cards table
CREATE TABLE cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    
    -- Link monster data
    links JSONB
);

-- Create user_follows table
CREATE TABLE user_follows (
    follower_id UUID REFERENCES users(id),
    following_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Create card_likes table
CREATE TABLE card_likes (
    user_id UUID REFERENCES users(id),
    card_id UUID REFERENCES cards(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id, card_id)
);

-- Create card_comments table
CREATE TABLE card_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    card_id UUID REFERENCES cards(id),
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES card_comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create deck tables
CREATE TABLE decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE deck_cards (
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    zone TEXT NOT NULL CHECK (zone IN ('main', 'extra', 'side')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (deck_id, card_id, zone)
);

-- Create generated_images table
CREATE TABLE generated_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indices for better performance
CREATE INDEX cards_user_id_idx ON cards(user_id);
CREATE INDEX card_comments_card_id_idx ON card_comments(card_id);
CREATE INDEX card_comments_user_id_idx ON card_comments(user_id);
CREATE INDEX deck_cards_deck_id_idx ON deck_cards(deck_id);
CREATE INDEX deck_cards_card_id_idx ON deck_cards(card_id);
CREATE INDEX generated_images_user_id_idx ON generated_images(user_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decks_updated_at
    BEFORE UPDATE ON decks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
