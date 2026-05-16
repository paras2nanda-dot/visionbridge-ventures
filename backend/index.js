/* eslint-disable no-unused-vars */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet'; 

// 📂 Routes
import authRoutes from './routes/auth.routes.js';
import authMiddleware from './middleware/auth.middleware.js';
import clientRoutes from './routes/clients.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js'; 
import clientDashboardRoutes from './routes/clientDashboard.routes.js'; 
import sipRoutes from './routes/sips.routes.js';
import mfschemeRoutes from './routes/mfSchemes.routes.js'; 
import transactionRoutes from './routes/transactions.routes.js'; 
import reportRoutes from './routes/reports.routes.js'; 
import activityRoutes from './routes/activity.routes.js'; 
import subDistributorRoutes from './routes/subDistributor.routes.js';

// 🛡️ Middleware
import auditMiddleware from './middleware/audit.middleware.js';

// 🛡️ Security Table Initializer
import { ensureWebAuthnTables } from './controllers/auth.controller.js';

dotenv.config();

/**
 * 🔒 CRIT-02 FIX: SERVER LOCKDOWN
 * Ensures the system does not start in a vulnerable state if the JWT_SECRET is missing.
 */
if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL ERROR: JWT_SECRET is not defined in .env file. System exiting for security.");
    process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

// 🛡️ SUGG-03 FIX: ENHANCED HELMET SECURITY
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
})); 

app.use(express.json({ limit: '10kb' })); 
app.use(cookieParser());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { error: "Too many requests." }
});
app.use('/api', globalLimiter); 

const allowedOrigins = [
  'http://localhost:5173',
  'https://visionbridge-ventures.vercel.app',
  'https://visionbridge-ventures-iota.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Block'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

/**
 * 🚀 STARTUP INITIALIZATION
 * 🛡️ M-3 FIX: Verifies required tables once at startup for performance.
 */
ensureWebAuthnTables().then(() => {
    console.log("✅ Security & Authentication Tables Verified");
}).catch(err => {
    console.error("❌ Startup Error (DB Tables):", err.message);
});

/**
 * 🚦 ROUTE MOUNTING
 */

// 1. Public Routes
app.use('/api/auth', authRoutes);

// 🟢 Captures all subsequent API actions in the audit_logs table.
app.use('/api', auditMiddleware);

// 2. Protected Routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/client-dashboard', authMiddleware, clientDashboardRoutes); 
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/sips', authMiddleware, sipRoutes);
app.use('/api/mf-schemes', authMiddleware, mfschemeRoutes); 
app.use('/api/transactions', authMiddleware, transactionRoutes); 
app.use('/api/reports', authMiddleware, reportRoutes); 
app.use('/api/activities', authMiddleware, activityRoutes);
app.use('/api/sub-distributors', authMiddleware, subDistributorRoutes);

app.get('/', (req, res) => res.send('✅ VisionBridge Engine Secure & Active'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 VisionBridge Server Listening on Port ${PORT}`));