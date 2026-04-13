import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// 💡 FIX: Completely strip ALL query parameters from the URL to prevent database name mangling
const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.split('?')[0];

export const pool = new Pool({
  connectionString: cleanUrl,
  // 💡 Explicitly handle SSL securely for Neon
  ssl: {
    rejectUnauthorized: false, 
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error!');
    console.error(err); 
    return;
  }
  console.log('✅ Connected to Neon Database');
  release();
});