import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import ProfileService from '../services/profile/profileService.js';

const router = Router();

// Get profile by username
router.get('/:username', async (req, res) => {
  try {
    const profile = await ProfileService.getByUsername(req.params.username);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }
    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get profile'
    });
  }
});

// Update profile (protected)
router.put('/', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.auth.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to update your profile'
      });
    }

    const updateData = {
      ...req.body,
      avatar_url: req.file ? `/uploads/${req.file.filename}` : undefined
    };

    const updatedProfile = await ProfileService.update(userId, updateData);
    res.json({ profile: updatedProfile });
  } catch (error) {
    if (error.message === 'Username already taken') {
      return res.status(409).json({
        error: 'Username taken',
        message: 'This username is already in use'
      });
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
});

// Get profile stats
router.get('/:username/stats', async (req, res) => {
  try {
    const profile = await ProfileService.getByUsername(req.params.username);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }

    const stats = await ProfileService.getStats(profile.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get profile stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get profile stats'
    });
  }
});

// Get followers
router.get('/:username/followers', async (req, res) => {
  try {
    const profile = await ProfileService.getByUsername(req.params.username);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }

    const followers = await ProfileService.getFollowers(profile.id);
    res.json({ followers });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get followers'
    });
  }
});

// Get following
router.get('/:username/following', async (req, res) => {
  try {
    const profile = await ProfileService.getByUsername(req.params.username);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }

    const following = await ProfileService.getFollowing(profile.id);
    res.json({ following });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get following'
    });
  }
});

// Follow a user (protected)
router.post('/follow/:username', requireAuth, async (req, res) => {
  try {
    const followerId = req.auth.id;
    if (!followerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to follow users'
      });
    }

    const profileToFollow = await ProfileService.getByUsername(req.params.username);
    if (!profileToFollow) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }

    if (followerId === profileToFollow.id) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot follow yourself'
      });
    }

    await ProfileService.follow(followerId, profileToFollow.id);
    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to follow user'
    });
  }
});

// Unfollow a user (protected)
router.delete('/follow/:username', requireAuth, async (req, res) => {
  try {
    const followerId = req.auth.id;
    if (!followerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to unfollow users'
      });
    }

    const profileToUnfollow = await ProfileService.getByUsername(req.params.username);
    if (!profileToUnfollow) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }

    await ProfileService.unfollow(followerId, profileToUnfollow.id);
    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to unfollow user'
    });
  }
});

// Check if following (protected)
router.get('/follow/:username/status', requireAuth, async (req, res) => {
  try {
    const followerId = req.auth.id;
    if (!followerId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to check follow status'
      });
    }

    const profileToCheck = await ProfileService.getByUsername(req.params.username);
    if (!profileToCheck) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }

    const isFollowing = await ProfileService.isFollowing(followerId, profileToCheck.id);
    res.json({ isFollowing });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check follow status'
    });
  }
});

export default router;
