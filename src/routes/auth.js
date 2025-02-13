import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword, generateToken, requireAuth } from '../middleware/auth.js';
import pool from '../config/database.js';
import { transaction } from '../config/database.js';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Email, password, and username are required'
    });
  }

  try {
    const result = await transaction(async (client) => {
      // Check if email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Email already registered');
      }

      // Check if username already exists
      const existingUsername = await client.query(
        'SELECT id FROM profiles WHERE username = $1',
        [username]
      );

      if (existingUsername.rows.length > 0) {
        throw new Error('Username already taken');
      }

      // Create user
      const userId = uuidv4();
      const hashedPassword = await hashPassword(password);

      await client.query(
        'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
        [userId, email, hashedPassword]
      );

      // Create profile
      await client.query(
        'INSERT INTO profiles (id, username) VALUES ($1, $2)',
        [userId, username]
      );

      return {
        id: userId,
        email,
        username
      };
    });

    // Generate token
    const token = generateToken(result);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        email: result.email,
        username: result.username
      }
    });

  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'Please use a different email address'
      });
    }

    if (error.message === 'Username already taken') {
      return res.status(409).json({
        error: 'Username already taken',
        message: 'Please choose a different username'
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Email and password are required'
    });
  }

  try {
    // Get user
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, p.username 
       FROM users u 
       JOIN profiles p ON u.id = p.id 
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to log in'
    });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, p.username, p.bio, p.avatar_url
       FROM users u
       JOIN profiles p ON u.id = p.id
       WHERE u.id = $1`,
      [req.auth.id] // Changed from req.user?.id to req.auth.id
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to find user profile'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user information'
    });
  }
});

export default router;
