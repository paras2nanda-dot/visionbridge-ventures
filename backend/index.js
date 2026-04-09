import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// 🔐 Auth Imports
import authRoutes from './routes/auth.routes.js';
import authMiddleware from './middleware/auth.middleware.js';

// 📂 Route Imports
import clientRoutes from './routes/clients.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js'; 
import clientDashboardRoutes from './routes/clientDashboard.routes.js'; 
import sipRoutes from './routes/sips.routes.js';
import mfschemeRoutes from './routes/mfSchemes.routes.js'; 
import transactionRoutes from './routes/transactions.routes.js'; 
import reportRoutes from './routes/reports.routes.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// --- 🛡️ SECURITY MIDDLEWARE ---
app.use(express.json({ limit: '10kb' })); // Prevents large body attacks
app.use(cookieParser()); // Required for HttpOnly cookies

// --- 🚦 RATE LIMITING (Brute Force Protection) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login/reset attempts per window
  message: { error: "Too many attempts. Please try again in 15 minutes." }
});

// --- 🌐 RESTRICTED CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://visionbridge-ventures.vercel.app',
  'https://visionbridge-ventures-iota.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isWhitelisted = allowedOrigins.includes(origin);
    const isVercel = origin.endsWith('.vercel.app');

    if (isWhitelisted || isVercel) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Required to allow cookies to be sent
}));

// --- 🔓 PUBLIC API ROUTES ---
app.use('/api/auth', authLimiter, authRoutes); 

// --- 🔐 PROTECTED API ROUTES ---
app.use('/api/dashboard', authMiddleware, dashboardRoutes); 
app.use('/api/client-dashboard', authMiddleware, clientDashboardRoutes); 
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/sips', authMiddleware, sipRoutes);
app.use('/api/mf-schemes', authMiddleware, mfschemeRoutes); 
app.use('/api/transactions', authMiddleware, transactionRoutes); 
app.use('/api/reports', authMiddleware, reportRoutes); 

app.get('/', (req, res) => res.send('✅ VisionBridge API Secure & Active'));

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Secure Backend running on port ${PORT}`);
});