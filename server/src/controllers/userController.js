import { getUserProfile, updateUserProfile } from '../services/userService.js';

/**
 * Controller for GET /api/users/me
 */
export const getProfile = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.userId);
    return res.status(200).json({
      success: true,
      data: { user: profile }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for PATCH /api/users/me
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await updateUserProfile(req.userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};
