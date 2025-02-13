import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { expressjwt } from 'express-jwt';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// JWT middleware configuration
export const requireAuth = expressjwt({
  secret: JWT_SECRET,
  algorithms: ['HS256'],
  requestProperty: 'auth',
  getToken: function fromHeaderOrQuerystring(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  }
});

// Password hashing utility
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Password verification utility
export const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Error handling middleware for auth errors
export const handleAuthError = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'You need to be logged in to access this resource'
    });
  }
  next(err);
};

// Middleware to check user role/permissions if needed
export const checkPermission = (requiredRole) => {
  return (req, res, next) => {
    const user = req.auth;
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    // Add role checking logic here when implementing roles
    next();
  };
};
