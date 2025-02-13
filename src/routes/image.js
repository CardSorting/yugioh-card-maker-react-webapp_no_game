import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateImage } from '../workers/imageGeneration.js';
import { analyzeImage } from '../workers/visionAnalysis.js';

const router = Router();

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await generateImage(prompt, userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      imageId: result.imageId,
      imageData: result.imageData,
      created_at: result.created_at
    });
  } catch (error) {
    console.error('Image generation route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    const result = await analyzeImage(imageData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      analysis: result.analysis
    });
  } catch (error) {
    console.error('Vision analysis route error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
