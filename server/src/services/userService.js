import prisma from '../config/prisma.js';
import { sanitizeUser } from '../utils/authUtils.js';

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
};

/**
 * Update user profile (supports updating name only in Phase 2)
 */
export const updateUserProfile = async (userId, updateData) => {
  const { name } = updateData;

  if (!name || typeof name !== 'string') {
    const error = new Error('A valid name is required');
    error.statusCode = 400;
    throw error;
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    const error = new Error('Name must be between 2 and 100 characters');
    error.statusCode = 400;
    throw error;
  }

  // Update only name; ignore any attempts to modify id, email, passwordHash, createdAt
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: trimmedName
    }
  });

  return sanitizeUser(updatedUser);
};
