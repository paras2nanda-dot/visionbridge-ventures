import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// 💡 Completely strip query parameters to prevent database name mangling
const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.split('?')[0];

export const pool = new Pool({
  connectionString: cleanUrl,
  ssl: {
    rejectUnauthorized: false, 
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ✅ FIX: Handle unexpected errors on idle clients
// This prevents the "Connection terminated unexpectedly" error from crashing or spamming your logs
pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle database client:', err.message);
});

// Initial connection check
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error!');
    console.error(err);
  } else {
    console.log('✅ Connected to Neon Database at:', res.rows[0].now);
  }
});