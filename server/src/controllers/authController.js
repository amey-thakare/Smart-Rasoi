import { registerUser, loginUser } from '../services/authService.js';
import { getCookieOptions } from '../utils/authUtils.js';
import { env } from '../config/env.js';

/**
 * Controller for POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const { user, token } = await registerUser({ name, email, password, confirmPassword });

    // Set HttpOnly authentication cookie
    res.cookie(env.COOKIE_NAME, token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    // Set HttpOnly authentication cookie
    res.cookie(env.COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie(env.COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
