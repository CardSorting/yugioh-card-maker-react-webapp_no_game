-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS card_comments
DROP CONSTRAINT IF EXISTS card_comments_user_id_fkey;

-- Add proper foreign key constraint
ALTER TABLE card_comments
ADD CONSTRAINT card_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- Refresh the comment_details view to ensure it uses correct relationships
DROP VIEW IF EXISTS comment_details;
CREATE VIEW comment_details AS
SELECT 
    cc.*,
    p.username,
    p.profile_image_path,
    p.bio,
    p.updated_at as profile_updated_at,
    (
        SELECT COUNT(*)
        FROM comment_likes cl
        WHERE cl.comment_id = cc.id
    ) as likes_count
FROM card_comments cc
JOIN profiles p ON cc.user_id = p.id;

-- Grant necessary permissions
GRANT SELECT ON comment_details TO anon, authenticated;
