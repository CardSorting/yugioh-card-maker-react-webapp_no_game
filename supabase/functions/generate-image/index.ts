import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const GOAPI_KEY = Deno.env.get('GOAPI_KEY');
const projectUrl = Deno.env.get('PROJECT_URL');
const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');

if (!GOAPI_KEY) {
  throw new Error('Missing GOAPI_KEY');
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
    // Log request details for debugging
    console.log('Incoming request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Parse request data
    const { prompt, aspectRatio = '1:1' } = await req.json();
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
    
    // Log parsed data
    console.log('Parsed request data:', { prompt, aspectRatio });

    // Log the request being sent to GoAPI
    console.log('Sending request to GoAPI:', {
      prompt: prompt.substring(0, 100) + '...',
      aspect_ratio: aspectRatio,
      process_mode: 'fast'
    });

    // Generate image with GoAPI Midjourney
    const goApiResponse = await fetch('https://api.goapi.ai/api/v1/task', {
      method: 'POST',
      headers: {
        'x-api-key': GOAPI_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'midjourney',
        task_type: 'imagine',
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          process_mode: 'fast',
          skip_prompt_check: false
        }
      }),
    });

    if (!goApiResponse.ok) {
      const errorResponse = await goApiResponse.json();
      // Detailed error logging with full response
      const errorDetails = {
        status: goApiResponse.status,
        statusText: goApiResponse.statusText,
        headers: Object.fromEntries(goApiResponse.headers.entries()),
        error: errorResponse
      };
      console.error('GoAPI error details:', errorDetails);
      
      // More descriptive error message
      let errorMessage = 'Failed to generate image';
      
      if (errorResponse.data?.error?.message) {
        errorMessage = errorResponse.data.error.message;
      } else if (errorResponse.message) {
        errorMessage = errorResponse.message;
      } else if (errorResponse.error?.message) {
        errorMessage = errorResponse.error.message;
      }
      
      // Log the error message being sent back
      console.error('Sending error response:', errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const responseData = await goApiResponse.json();
    console.log('Full GoAPI initial response:', JSON.stringify(responseData, null, 2));
    
    if (responseData.code !== 200) {
      console.error('GoAPI error:', responseData);
      throw new Error(responseData.message || 'Failed to generate image');
    }

    // Get task ID from the response
    const taskId = responseData.data.task_id;
    
    // Poll for task completion with adaptive intervals
    let attempts = 0;
    const maxAttempts = 240; // 10 minutes max with variable intervals
    let totalTimeElapsed = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      console.log(`[${new Date().toISOString()}] Polling attempt ${attempts} for task ${taskId} (${Math.floor(totalTimeElapsed / 1000)} seconds elapsed)`);
      const statusResponse = await fetch(`https://api.goapi.ai/api/v1/task/${taskId}`, {
        headers: {
          'x-api-key': GOAPI_KEY,
        },
      });
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check generation status');
      }
      
      const statusData = await statusResponse.json();
      console.log('Status check details:', {
        taskId,
        attempt: attempts,
        status: statusData.data?.status,
        error: statusData.data?.error,
        timeElapsed: `${Math.floor(totalTimeElapsed / 1000)} seconds`,
        urls: statusData.data?.output?.image_urls,
        imageUrl: statusData.data?.output?.image_url,
        temporaryUrls: statusData.data?.output?.temporary_image_urls,
        discordUrl: statusData.data?.output?.discord_image_url
      });
      
      if (!statusData || !statusData.data) {
        console.error('Invalid status response structure:', statusData);
        throw new Error('Invalid status response from API');
      }

      // Handle different status states
      switch (statusData.data.status) {
        case 'Processing':
          console.log(`Task processing (${Math.floor(totalTimeElapsed / 1000)}s elapsed)`);
          break;
        case 'Pending':
          console.log(`Task pending (${Math.floor(totalTimeElapsed / 1000)}s elapsed)`);
          break;
        case 'Creating':
          console.log(`Task creating (${Math.floor(totalTimeElapsed / 1000)}s elapsed)`);
          break;
        case 'Failed':
          throw new Error(statusData.data.error?.message || 'Image generation failed');
        case 'Completed':
          break;
        default:
          console.log(`Unknown status: ${statusData.data.status}`);
      }

      // If not completed, wait with adaptive interval then continue polling
      if (!['Completed', 'Failed'].includes(statusData.data.status)) {
        // Use shorter intervals at first, then back off
        const waitTime = attempts < 12 ? 1000 : // First 12 attempts: check every second
                        attempts < 60 ? 3000 : // Next 48 attempts: check every 3 seconds
                        5000;                // After that: check every 5 seconds
        console.log(`Waiting ${waitTime}ms before next check...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        totalTimeElapsed += waitTime;
        continue;
      }

      // Process completed task
      if (statusData.data.status === 'Completed') {
        let imageUrls = [];
        if (statusData.data.output?.image_urls?.length > 0) {
          imageUrls = statusData.data.output.image_urls;
        } else if (statusData.data.output?.image_url) {
          imageUrls = [statusData.data.output.image_url];
        } else {
          console.error('No image URLs found in completed response:', statusData.data.output);
          throw new Error('No image URLs in completed response');
        }
        console.log('Got image URLs:', imageUrls);

        // Upload all images to Supabase Storage
        const uploadedUrls = await Promise.all(
          imageUrls.map(async (url, index) => {
            // Download the image
            const imageResponse = await fetch(url);
            if (!imageResponse.ok) {
              console.error(`Failed to download image ${index + 1}:`, url);
              return null;
            }

            const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());

            // Upload to Supabase Storage with unique name
            const fileName = `generated-${Date.now()}-${index + 1}.png`;
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('card-images')
              .upload(fileName, imageBytes, {
                contentType: 'image/png',
                cacheControl: '3600',
              });

            if (uploadError) {
              console.error(`Failed to upload image ${index + 1}:`, uploadError);
              return null;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase
              .storage
              .from('card-images')
              .getPublicUrl(fileName);

            return publicUrl;
          })
        );

        // Filter out any failed uploads
        const successfulUrls = uploadedUrls.filter(url => url !== null);
        
        if (successfulUrls.length === 0) {
          throw new Error('Failed to upload any images');
        }

        return new Response(
          JSON.stringify({ imageUrls: successfulUrls }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Check if we hit the timeout
    if (attempts >= maxAttempts) {
      throw new Error('Timeout waiting for image generation');
    }
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
