import prisma from '../config/prisma.js';
import {
  normalizeEmail,
  isValidEmail,
  hashPassword,
  comparePassword,
  signJwtToken,
  sanitizeUser
} from '../utils/authUtils.js';

export class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Register a new user
 */
export const registerUser = async ({ name, email, password, confirmPassword }) => {
  // Validate presence
  if (!name || !email || !password || !confirmPassword) {
    throw new AuthError('All fields (name, email, password, confirmPassword) are required', 400);
  }

  const trimmedName = String(name).trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new AuthError('Name must be between 2 and 100 characters', 400);
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new AuthError('Please enter a valid email address', 400);
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new AuthError('Password must be at least 8 characters long', 400);
  }

  if (password.length > 128) {
    throw new AuthError('Password must not exceed 128 characters', 400);
  }

  if (password !== confirmPassword) {
    throw new AuthError('Password and confirmation do not match', 400);
  }

  // Check duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new AuthError('An account with this email address already exists', 409);
  }

  // Hash password & save user
  const passwordHash = await hashPassword(password);
  const newUser = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      passwordHash
    }
  });

  const token = signJwtToken(newUser.id);

  return {
    user: sanitizeUser(newUser),
    token
  };
};

/**
 * Login existing user
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AuthError('Email and password are required', 400);
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new AuthError('Invalid email or password', 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  // Generic message on failure to prevent user enumeration
  if (!user) {
    throw new AuthError('Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError('Invalid email or password', 401);
  }

  const token = signJwtToken(user.id);

  return {
    user: sanitizeUser(user),
    token
  };
};

/**
 * Get current user profile by verified user ID
 */
export const getCurrentUser = async (userId) => {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  return sanitizeUser(user);
};
