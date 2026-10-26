import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175'
];

const isLocalOrPrivateNetwork = (hostname) => {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === 'smart-rasoi.home.arpa' ||
    hostname.endsWith('.home.arpa') ||
    hostname.endsWith('.arpa') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home') ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or requests without origin (like mobile apps, Postman or curl)
    if (!origin) {
      return callback(null, true);
    }
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development or test, allow localhost, 127.0.0.1, or any LAN Wi-Fi IP address
    if (env.NODE_ENV !== 'production') {
      try {
        const parsed = new URL(origin);
        if (isLocalOrPrivateNetwork(parsed.hostname)) {
          return callback(null, true);
        }
      } catch {
        // invalid URL
      }
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

// Body parser with size limits to prevent abuse
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse HttpOnly cookies
app.use(cookieParser());

// Mount API routes under /api
app.use('/api', apiRoutes);

// Serve static frontend files and SPA fallback when built
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Fallback 404 for undefined routes
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

export default app;
