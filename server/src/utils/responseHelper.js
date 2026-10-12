/**
 * Standard API response format helpers
 */

export const sendSuccess = (res, message = 'Success', data = null, statusCode = 200, extra = {}) => {
  const response = {
    success: true,
    message,
    ...extra
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message
  };

  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};
