-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    user_id UUID REFERENCES auth.users(id),
    comment_id UUID REFERENCES public.card_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_likes
DO $$ 
BEGIN
    -- Create policies if they don't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Users can view all comment likes'
    ) THEN
        CREATE POLICY "Users can view all comment likes"
            ON public.comment_likes FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Users can like comments'
    ) THEN
        CREATE POLICY "Users can like comments"
            ON public.comment_likes FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'comment_likes' 
        AND policyname = 'Users can unlike comments'
    ) THEN
        CREATE POLICY "Users can unlike comments"
            ON public.comment_likes FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Drop existing comment_details view if it exists
DROP VIEW IF EXISTS comment_details;

-- Create enhanced comment_details view with likes information
CREATE VIEW public.comment_details AS
SELECT 
    c.*,
    p.username,
    p.profile_image_path,
    p.updated_at as profile_updated_at,
    COALESCE(l.likes_count, 0) as likes_count,
    EXISTS (
        SELECT 1 
        FROM public.comment_likes cl 
        WHERE cl.comment_id = c.id 
        AND cl.user_id = auth.uid()
    ) as is_liked_by_user
FROM public.card_comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
LEFT JOIN (
    SELECT comment_id, COUNT(*) as likes_count
    FROM public.comment_likes
    GROUP BY comment_id
) l ON c.id = l.comment_id;

-- Grant access to tables and views
GRANT ALL ON TABLE public.comment_likes TO authenticated;
GRANT ALL ON TABLE public.comment_likes TO service_role;
GRANT SELECT ON TABLE public.comment_likes TO anon;

-- Grant access to the view
GRANT ALL ON TABLE public.comment_details TO authenticated;
GRANT ALL ON TABLE public.comment_details TO anon;
GRANT ALL ON TABLE public.comment_details TO service_role;
