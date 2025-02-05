import { serve } from "./http/server.ts";
import { createClient } from "@supabase/supabase-js";

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

async function parseJsonResponse(response: Response, context: string) {
  // Log response details
  console.log(`${context} response details:`, {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
    headers: Object.fromEntries(Array.from(response.headers))
  });

  // Get raw response text first
  const rawText = await response.text();
  
  // Log raw response with extra debug info
  console.log(`Raw ${context} response:`, rawText);
  console.log(`${context} response length:`, rawText.length);
  console.log(`${context} response first 100 chars:`, rawText.substring(0, 100));
  
  // Check for common encoding issues
  const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(rawText);
  if (hasInvalidChars) {
    console.warn(`${context} response contains invalid control characters`);
  }
  
  try {
    // Attempt to parse as JSON
    const data = JSON.parse(rawText);
    console.log(`Parsed ${context} data:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`Failed to parse ${context} JSON:`, error);
    console.log(`Invalid ${context} JSON received:`, rawText);
    throw new Error(`Invalid JSON response from API during ${context}`);
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
        'Accept': 'application/json'
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
      interface GoAPIErrorResponse {
        data?: {
          error?: {
            message: string;
          };
        };
        message?: string;
        error?: {
          message: string;
        };
        code?: number;
      }

      const errorResponse = await goApiResponse.json() as GoAPIErrorResponse;
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
          headers: corsHeaders,
        }
      );
    }

    interface GoAPIOutput {
      image_urls?: string[];
      image_url?: string;
      temporary_image_urls?: string[];
      discord_image_url?: string;
    }

    interface GoAPIData {
      task_id: string;
      status?: string;
      output?: GoAPIOutput;
      error?: {
        message: string;
      };
    }

    interface GoAPISuccessResponse {
      code: number;
      message?: string;
      error?: {
        message: string;
      };
      data: GoAPIData;
    }

    const responseData = await parseJsonResponse(goApiResponse, 'initial') as GoAPISuccessResponse;
    
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
          'Accept': 'application/json'
        },
      });
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check generation status');
      }
      
      // Log response details
      console.log('Status response headers:', {
        ...Object.fromEntries(statusResponse.headers.entries()),
        contentType: statusResponse.headers.get('content-type'),
        contentLength: statusResponse.headers.get('content-length')
      });
      
      const statusData = await parseJsonResponse(statusResponse, 'status check') as GoAPISuccessResponse;
      console.log('Raw status response:', JSON.stringify(statusData, null, 2));

      // Additional request metadata
      console.log('Request metadata:', {
        timestamp: new Date().toISOString(),
        endpoint: `https://api.goapi.ai/api/v1/task/${taskId}`,
        attemptNumber: attempts,
        responseStatus: statusResponse.status,
        responseStatusText: statusResponse.statusText
      });

      // Log specific data paths and error locations
      console.log('Response data paths:', {
        code: statusData.code,
        message: statusData.message,
        status: statusData.data?.status,
        rootError: statusData.error,
        dataError: statusData.data?.error,
        imageUrls: statusData.data?.output?.image_urls,
        imageUrl: statusData.data?.output?.image_url,
        temporaryUrls: statusData.data?.output?.temporary_image_urls,
        discordUrl: statusData.data?.output?.discord_image_url,
        outputKeys: statusData.data?.output ? Object.keys(statusData.data.output) : []
      });

      // Log status check summary
      console.log('Status check summary:', {
        taskId,
        attempt: attempts,
        timeElapsed: `${Math.floor(totalTimeElapsed / 1000)}s`,
        status: statusData.data?.status || 'unknown'
      });
      
      // Validate response structure
      if (!statusData || typeof statusData !== 'object') {
        console.error('Invalid response format:', {
          rawData: statusData,
          type: typeof statusData,
          isNull: statusData === null,
          hasProperties: statusData ? Object.keys(statusData) : []
        });
        throw new Error('Invalid response format from API');
      }

      if (!statusData.data) {
        console.error('Missing data field in response:', statusData);
        throw new Error('Missing data field in API response');
      }

      if (statusData.code !== 200) {
        const errorInfo = {
          code: statusData.code,
          message: statusData.message,
          error: statusData.error,
          dataError: statusData.data?.error,
          fullResponse: statusData
        };
        console.error('API error details:', errorInfo);
        const errorMsg = statusData.message || statusData.error?.message || 'API returned non-200 status code';
        throw new Error(errorMsg);
      }

      // Handle different status states
      const currentStatus = statusData.data.status || 'Unknown';
      switch (currentStatus) {
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
          return new Response(
            JSON.stringify({ error: statusData.data.error?.message || 'Image generation failed' }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        case 'Completed':
          break;
        default:
          console.log(`Unknown status: ${statusData.data.status}`);
      }

      // If not completed, wait with adaptive interval then continue polling
      if (!['Completed', 'Failed'].includes(currentStatus)) {
        // Use shorter intervals at first, then back off
        // Adjust polling intervals based on status
        const waitTime = currentStatus === 'Creating' ? 2000 : // Creating state: check every 2 seconds
                        attempts < 12 ? 1000 : // First 12 attempts: check every second
                        attempts < 60 ? 3000 : // Next 48 attempts: check every 3 seconds
                        5000;                  // After that: check every 5 seconds
        console.log(`Waiting ${waitTime}ms before next check...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        totalTimeElapsed += waitTime;
        continue;
      }

      // Process completed task
      if (currentStatus === 'Completed') {
        const output = statusData.data.output;
        let imageUrls: string[] = [];
        
        if (output?.image_urls && output.image_urls.length > 0) {
          imageUrls = output.image_urls;
        } else if (output?.image_url) {
          imageUrls = [output.image_url];
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
      
      // Filter out null values and ensure we have strings
      const successfulUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (successfulUrls.length === 0) {
        throw new Error('Failed to upload any images');
      }

      return new Response(
        JSON.stringify({ imageUrls: successfulUrls }, null),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } // end of while loop
  // Check if we hit the timeout
  if (attempts >= maxAttempts) {
    throw new Error('Timeout waiting for image generation');
  }
} catch (error) {
  return new Response(
    JSON.stringify({ error: error.message }, null),
    {
      status: 400,
      headers: corsHeaders,
    }
  );
}
});
