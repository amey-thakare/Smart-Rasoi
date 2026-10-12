/**
 * Central Error Handling Middleware
 * Prevents leaking stack traces or sensitive environment details in production.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  
  // Log error server-side for observability
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const response = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
};
