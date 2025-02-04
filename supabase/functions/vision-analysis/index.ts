import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface OpenAIVisionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

interface ErrorResponse {
  error: string;
  code: string;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY');
}

// Yu-Gi-Oh specific prompt for detailed art analysis
const ANALYSIS_PROMPT = `Analyze this artwork for use as a Yu-Gi-Oh card image. Please provide a detailed description focusing on:

1. Character/Creature Design:
- Main subject's appearance, pose, and distinctive features
- Any weapons, armor, or notable accessories
- Monster type characteristics (Dragon, Warrior, Spellcaster, etc.)

2. Magical Effects/Energy:
- Magical auras, energy effects, or supernatural elements
- Special attack or ability visualizations
- Energy color schemes and patterns

3. Background/Setting:
- Environmental details and atmosphere
- Terrain or location characteristics
- Mood and lighting effects

4. Color Palette:
- Primary and accent colors that define the mood
- Color combinations that enhance the card's impact
- Light and shadow treatment

5. Art Style:
- Overall artistic approach (painted, digital, realistic, stylized)
- Texture and detail level
- Visual effects and techniques used

6. Yu-Gi-Oh Specific Elements:
- How it fits the Yu-Gi-Oh art style
- Dramatic poses and dynamic compositions
- Integration of monster/spell/trap card visual themes

Format this analysis into a DALL-E prompt that would create similar artwork, emphasizing the Yu-Gi-Oh card game's distinctive visual style.`;

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
    const { image } = await req.json();
    if (!image) {
      throw new Error('Missing image parameter');
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
                text: ANALYSIS_PROMPT
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!visionResponse.ok) {
      const errorResponse = await visionResponse.json();
      console.error('Vision API error:', JSON.stringify(errorResponse, null, 2));
      throw new Error(`Vision API error: ${errorResponse.error?.message || errorResponse.error || 'Unknown error'}`);
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
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: error.message,
      code: error instanceof Error && 'code' in error 
        ? (error as any).code 
        : 'UNKNOWN_ERROR'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: error instanceof Error && 'code' in error && (error as any).code === 'UNAUTHORIZED' 
          ? 401 
          : 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
