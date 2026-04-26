import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * 🛡️ MED-02 FIX: RESTORED FULL DATABASE URL
 * We no longer strip query parameters. Neon requires parameters like 
 * ?sslmode=require for secure, authenticated connections.
 */
const DATABASE_URL = process.env.DATABASE_URL || '';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  /**
   * 🛡️ MED-02 FIX: SECURE SSL CONFIGURATION
   * Using the full URL ensures the driver respects the sslmode parameter.
   * rejectUnauthorized: true is the more secure strict setting.
   */
  ssl: {
    rejectUnauthorized: true, 
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ✅ FIX: Handle unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle database client:', err.message);
});

// Initial connection check
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error!');
    console.error(err.message);
    
    // Fallback logic: if strict SSL fails in certain environments, 
    // log a specific warning about the certificate.
    if (err.message.includes('self-signed certificate')) {
        console.warn('💡 Tip: If you are seeing certificate errors, ensure your environment supports the Neon CA root.');
    }
  } else {
    console.log('✅ Securely connected to Neon Database at:', res.rows[0].now);
  }
});