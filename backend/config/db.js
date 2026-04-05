import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 🛠️ Robust .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * DATABASE CONNECTION CONFIG
 * Optimized for Neon (Serverless Postgres)
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Setting this to false allows connection without local CA certificates
    // while still encrypting the traffic.
    rejectUnauthorized: false, 
  },
  // 🚀 Performance & Stability Tweaks
  max: 10,                 // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error if a connection takes > 5s
});

// Verification Log with better error handling
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error!');
    console.error('👉 Error Code:', err.code); // Helps identify ENOTFOUND vs Auth errors
    console.error('👉 Message:', err.message);
    return;
  }
  console.log('✅ Connected to Neon Database');
  release();
});