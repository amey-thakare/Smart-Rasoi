/**
 * Health check service
 */
export const getHealthStatus = () => {
  return {
    success: true,
    message: 'Smart Rasoi API is running',
    timestamp: new Date().toISOString()
  };
};
