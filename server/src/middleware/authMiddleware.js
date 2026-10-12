import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { verifyJwtToken, sanitizeUser } from '../utils/authUtils.js';

/**
 * Reusable JWT Authentication Middleware
 * Checks HttpOnly cookie first, with Bearer Authorization header support
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract from HttpOnly cookie
    if (req.cookies && req.cookies[env.COOKIE_NAME]) {
      token = req.cookies[env.COOKIE_NAME];
    }
    // 2. Fallback to Bearer authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyJwtToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' 
          ? 'Session has expired. Please log in again.' 
          : 'Invalid authentication session.'
      });
    }

    if (!decoded || !decoded.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token claims.'
      });
    }

    // Retrieve user from SQLite
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists or session was revoked.'
      });
    }

    // Attach safe user identity to request
    req.user = sanitizeUser(user);
    req.userId = user.id;

    next();
  } catch (error) {
    next(error);
  }
};
