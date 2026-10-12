import { useState, useEffect } from 'react';
import { fetchHealthCheck } from '../services/api.js';

/**
 * Hook to monitor backend connectivity status
 */
export const useHealthCheck = () => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkServer = async () => {
      try {
        const result = await fetchHealthCheck();
        if (isMounted) {
          if (result && result.success) {
            setStatus('connected');
            setData(result);
          } else {
            setStatus('disconnected');
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('disconnected');
        }
      }
    };

    checkServer();

    // Recheck every 30 seconds
    const interval = setInterval(checkServer, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { status, data };
};
