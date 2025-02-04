import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const projectUrl = Deno.env.get('PROJECT_URL');
const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY');
}

if (!projectUrl || !serviceKey) {
  throw new Error('Missing project environment variables');
}

const supabase = createClient(projectUrl, serviceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Parse request data
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error('Missing prompt parameter');
    }

    // Input validation
    if (prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }
    if (prompt.length > 4000) {
      throw new Error('Prompt is too long. Maximum length is 4000 characters.');
    }

    // Log the request being sent to DALL-E
    console.log('Sending request to DALL-E:', {
      prompt: prompt.substring(0, 100) + '...',
      size: '1792x1024',
      quality: 'hd'
    });

    // Generate image with DALL-E
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          n: 1,
          size: '1792x1024',
          quality: 'hd',
          response_format: 'b64_json',
        }),
    });

    if (!dalleResponse.ok) {
      const errorResponse = await dalleResponse.json();
      // Detailed error logging
      console.error('DALL-E API error details:', {
        status: dalleResponse.status,
        statusText: dalleResponse.statusText,
        headers: Object.fromEntries(dalleResponse.headers.entries()),
        error: errorResponse
      });
      
      // More specific error messages
      let errorMessage = 'Failed to generate image';
      if (errorResponse.error?.message) {
        errorMessage = errorResponse.error.message;
      } else if (errorResponse.error?.code) {
        switch (errorResponse.error.code) {
          case 'content_policy_violation':
            errorMessage = 'The prompt contains content that is not allowed. Please modify your request.';
            break;
          case 'rate_limit_exceeded':
            errorMessage = 'Rate limit exceeded. Please try again later.';
            break;
          case 'invalid_prompt':
            errorMessage = 'The prompt contains invalid content. Please revise your prompt.';
            break;
          default:
            errorMessage = `DALL-E API error: ${errorResponse.error.code}`;
        }
      }
      throw new Error(errorMessage);
    }

    const { data } = await dalleResponse.json();
    const imageData = data[0].b64_json;

    // Convert base64 to Uint8Array for storage
    const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `generated-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('card-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('card-images')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
