import { getHealthStatus } from '../services/healthService.js';

/**
 * Controller for GET /api/health
 */
export const checkHealth = (req, res, next) => {
  try {
    const healthData = getHealthStatus();
    return res.status(200).json(healthData);
  } catch (error) {
    next(error);
  }
};
