import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Root@123',
    name: process.env.DB_NAME || 'crescent_wealth_db',
    logging: process.env.DB_LOGGING === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'crescent_wealth_jwt_super_secret_key_2026_x9281',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  aes: {
    secretKey: process.env.AES_SECRET_KEY || 'CrescentWealthSecureKey20261107_',
    iv: process.env.AES_IV || 'CrescentIv16Byte',
  },
};

