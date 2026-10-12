/**
 * Lightweight in-memory per-user sliding window rate limiter
 * Note: Resets on server restart and is scoped to single-instance memory.
 */
const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 25; // 25 requests per minute per user

export const aiRateLimiter = (req, res, next) => {
  const userId = req.userId || req.ip || 'anonymous';
  const now = Date.now();

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  const timestamps = rateLimitMap.get(userId);

  // Remove timestamps outside the sliding window
  const recentTimestamps = timestamps.filter((time) => now - time < WINDOW_MS);

  if (recentTimestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many AI chat requests. Please wait a moment before sending more messages.'
    });
  }

  recentTimestamps.push(now);
  rateLimitMap.set(userId, recentTimestamps);

  next();
};

export const resetAiRateLimiter = () => {
  rateLimitMap.clear();
};
