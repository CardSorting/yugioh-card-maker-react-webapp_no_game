-- Add new column for multiple image URLs
ALTER TABLE user_generations 
ADD COLUMN variation_urls TEXT[] DEFAULT array[]::TEXT[];

-- Copy existing image_url values to variation_urls array
UPDATE user_generations 
SET variation_urls = array[image_url]
WHERE variation_urls IS NULL OR array_length(variation_urls, 1) = 0;

-- Make variation_urls NOT NULL after data migration
ALTER TABLE user_generations 
ALTER COLUMN variation_urls SET NOT NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN user_generations.variation_urls IS 'Array of CDN URLs for all variations of the generated image';

-- image_url will now store the primary/selected variation
COMMENT ON COLUMN user_generations.image_url IS 'URL of the primary/selected image variation';
