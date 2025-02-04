-- First ensure the card_comments table exists with the correct structure
DO $$ 
DECLARE
    table_exists boolean;
    parent_id_exists boolean;
    parent_comment_id_exists boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'card_comments'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.card_comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id),
            card_id UUID REFERENCES public.cards(id),
            content TEXT NOT NULL,
            parent_comment_id UUID REFERENCES public.card_comments(id),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Check if parent_id column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'card_comments'
            AND column_name = 'parent_id'
        ) INTO parent_id_exists;

        -- Check if parent_comment_id column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'card_comments'
            AND column_name = 'parent_comment_id'
        ) INTO parent_comment_id_exists;

        -- If parent_id exists but parent_comment_id doesn't, rename it
        IF parent_id_exists AND NOT parent_comment_id_exists THEN
            ALTER TABLE public.card_comments
            RENAME COLUMN parent_id TO parent_comment_id;
        -- If neither exists, add parent_comment_id
        ELSIF NOT parent_id_exists AND NOT parent_comment_id_exists THEN
            ALTER TABLE public.card_comments
            ADD COLUMN parent_comment_id UUID REFERENCES public.card_comments(id);
        END IF;
    END IF;

    -- Enable RLS if not already enabled
    ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;

    -- Ensure RLS policies exist
    BEGIN
        CREATE POLICY "Users can view all comments"
            ON public.card_comments FOR SELECT
            USING (true);
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        CREATE POLICY "Users can add comments"
            ON public.card_comments FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

    BEGIN
        CREATE POLICY "Users can delete their own comments"
            ON public.card_comments FOR DELETE
            USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;

END $$;

-- Now create the view in a separate transaction
DO $$
BEGIN
    -- Drop existing view if it exists
    DROP VIEW IF EXISTS public.comment_details;

    -- Create view with all necessary columns
    CREATE VIEW public.comment_details AS
    SELECT 
        c.id,
        c.user_id,
        c.card_id,
        c.content,
        c.parent_comment_id,
        c.created_at,
        p.username,
        p.profile_image_path,
        p.updated_at as profile_updated_at
    FROM public.card_comments c
    LEFT JOIN public.profiles p ON c.user_id = p.id;

    -- Grant access to the view
    GRANT SELECT ON public.comment_details TO anon, authenticated;
END $$;
