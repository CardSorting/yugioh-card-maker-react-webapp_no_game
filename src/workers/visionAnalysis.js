import OpenAI from "openai";

const openai = new OpenAI();

export const analyzeImage = async (imageData) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this scene in detail." },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
          ],
        },
      ],
      store: true,
    });

    return {
      success: true,
      analysis: response.choices[0].message.content
    };
  } catch (error) {
    console.error('Vision analysis worker error:', error);
    return {
      success: false,
      error: error.message || 'Internal server error'
    };
  }
};
