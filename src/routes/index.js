import { Router } from 'express';
import authRoutes from './auth.js';
import profileRoutes from './profile.js';
import imageRoutes from './image.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Semi-protected routes (some endpoints require auth)
router.use('/profiles', profileRoutes);

// Protected routes
router.use('/image', imageRoutes);

// Future protected routes
// Cards
// router.use('/cards', requireAuth, cardRoutes);
// Decks
// router.use('/decks', requireAuth, deckRoutes);
// Social
// router.use('/social', requireAuth, socialRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
