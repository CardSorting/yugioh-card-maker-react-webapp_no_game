import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

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
    const url = new URL(req.url);
    const isAnalyzeEndpoint = url.pathname.endsWith('/analyze');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const requestData = await req.json();

    // Handle image analysis
    if (isAnalyzeEndpoint) {
      const { image } = requestData;
      if (!image) {
        throw new Error('Missing image in request body');
      }

      // Call OpenAI Vision API
      const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please analyze this Yu-Gi-Oh card artwork reference image and provide a detailed description that could be used as a prompt for generating similar artwork. Focus on the composition, style, colors, and key visual elements that make it suitable for a Yu-Gi-Oh card."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });

      if (!visionResponse.ok) {
        const error = await visionResponse.text();
        throw new Error(`Vision API error: ${error}`);
      }

      const visionResult = await visionResponse.json() as OpenAIVisionResponse;
      const analysis = visionResult.choices[0].message.content;

      return new Response(
        JSON.stringify({ analysis }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Handle image generation
    const { prompt } = requestData;
    if (!prompt) {
      throw new Error('Missing prompt in request body');
    }

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
      const error = await dalleResponse.text();
      throw new Error(`DALL-E API error: ${error}`);
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
