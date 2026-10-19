import app from './app.js';
import { env } from './config/env.js';

const initialPort = env.PORT || 5000;
let currentServer = null;

function startServer(port) {
  const srv = app.listen(port, '0.0.0.0', () => {
    console.log(`[Smart Rasoi Server] Running on http://0.0.0.0:${port}`);
    console.log(`[Smart Rasoi Server] Health check available at http://0.0.0.0:${port}/api/health`);
    console.log(`[Smart Rasoi Server] Allowed Client URL: ${env.CLIENT_URL}`);
    console.log(`[Smart Rasoi Server] Database: SQLite (${env.DATABASE_URL})`);
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === 5000) {
      console.warn(
        `[Smart Rasoi Server] Notice: Port 5000 is currently occupied (commonly by macOS AirPlay Receiver). Automatically falling back to port 5001.`
      );
      currentServer = startServer(5001);
    } else {
      console.error(`[Smart Rasoi Server] Server error:`, err);
      process.exit(1);
    }
  });

  return srv;
}

currentServer = startServer(initialPort);

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`\n[Smart Rasoi Server] Received ${signal}. Closing HTTP server...`);
  if (currentServer) {
    currentServer.close(() => {
      console.log('[Smart Rasoi Server] HTTP server closed gracefully.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default currentServer;
