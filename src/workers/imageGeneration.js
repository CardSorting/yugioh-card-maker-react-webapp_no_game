import OpenAI from 'openai';
import axios from 'axios';
import { saveImageToDatabase } from '../services/image/imageStorageService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const convertImageUrlToBase64 = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image to base64');
  }
};

export const generateImage = async (prompt, userId) => {
  try {
    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      response_format: "url"
    });

    // Convert image to base64
    const imageBase64 = await convertImageUrlToBase64(response.data[0].url);

    // Save to database
    const result = await saveImageToDatabase(userId, prompt, imageBase64);

    if (!result.success) {
      throw new Error(result.error || 'Failed to save image to database');
    }

    return {
      success: true,
      imageId: result.id,
      imageData: imageBase64,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Image generation worker error:', error);
    return {
      success: false,
      error: error.message || 'Internal server error',
    };
  }
};
