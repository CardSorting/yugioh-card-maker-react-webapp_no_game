-- Create user_follows table
CREATE TABLE user_follows (
    follower_id UUID REFERENCES auth.users(id),
    following_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Create card_likes table
CREATE TABLE card_likes (
    user_id UUID REFERENCES auth.users(id),
    card_id UUID REFERENCES cards(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, card_id)
);

-- Create card_comments table
CREATE TABLE card_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    card_id UUID REFERENCES cards(id),
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES card_comments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows"
    ON user_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON user_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON user_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- RLS Policies for card_likes
CREATE POLICY "Users can view all likes"
    ON card_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like cards"
    ON card_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike cards"
    ON card_likes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for card_comments
CREATE POLICY "Users can view all comments"
    ON card_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can add comments"
    ON card_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON card_comments FOR DELETE
    USING (auth.uid() = user_id);
