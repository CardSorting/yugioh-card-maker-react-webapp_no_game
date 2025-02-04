# DALL-E Image Generation Function

This Edge Function provides image generation capabilities using OpenAI's DALL-E API and stores the generated images in Supabase Storage.

## Setup Instructions

1. **Create a Supabase Storage Bucket**
   ```sql
   -- Execute in Supabase SQL Editor
   insert into storage.buckets (id, name, public) values ('card-images', 'card-images', true);
   ```

2. **Set Environment Variables**
   In your Supabase project dashboard:
   1. Go to Settings > API
   2. Note your project URL and service_role key
   3. Go to Settings > Functions
   4. Add the following secrets:
      - `OPENAI_API_KEY`: Your OpenAI API key (get from [OpenAI Dashboard](https://platform.openai.com/api-keys))
      - `PROJECT_URL`: Your project URL (from step 2)
      - `SERVICE_ROLE_KEY`: Your service_role key (from step 2)

3. **Deploy the Function**
   ```bash
   # Install Supabase CLI if not already installed
   brew install supabase

   # Login to Supabase
   supabase login

   # Deploy the function (from project root)
   supabase functions deploy generate-image --project-ref your-project-ref
   ```

4. **Test the Function**
   ```bash
   curl -i --location --request POST 'https://[PROJECT_REF].supabase.co/functions/v1/generate-image' \
   --header 'Authorization: Bearer [ACCESS_TOKEN]' \
   --header 'Content-Type: application/json' \
   --data '{"prompt":"A majestic dragon with glowing eyes"}'
   ```

## Security Considerations

- The function requires authentication through Supabase Auth
- Images are stored in a public bucket but with random filenames
- The OpenAI API key is securely stored as an environment variable
