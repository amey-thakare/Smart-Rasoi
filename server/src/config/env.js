import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from the server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'smart_rasoi_dev_jwt_secret_change_in_production_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: 'smart_rasoi_auth_token',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '',
  GEMINI_MODEL: process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : 'gemini-3.5-flash-lite',
  GEMINI_TIMEOUT_MS: process.env.GEMINI_TIMEOUT_MS ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10) : 45000
};
