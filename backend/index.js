import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet'; // 🛡️ ADDED: Helmet for HTTP Headers

// Auth & Routes
import authRoutes from './routes/auth.routes.js';
import authMiddleware from './middleware/auth.middleware.js';
import clientRoutes from './routes/clients.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js'; 
import clientDashboardRoutes from './routes/clientDashboard.routes.js'; 
import sipRoutes from './routes/sips.routes.js';
import mfschemeRoutes from './routes/mfSchemes.routes.js'; 
import transactionRoutes from './routes/transactions.routes.js'; 
import reportRoutes from './routes/reports.routes.js'; 

dotenv.config();
const app = express();

// 🛡️ 1. SECURITY MIDDLEWARES
app.use(helmet()); // Secures HTTP headers, blocks XSS, hides Express identity
app.use(express.json({ limit: '10kb' })); // Prevents massive payload crashing
app.use(cookieParser());

// 🛡️ 2. GLOBAL RATE LIMITER (Protects against scraping and DoS)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use('/api', globalLimiter); 

// 🛡️ 3. STRICT RATE LIMITER FOR AUTH (Prevents Brute Force/Password Guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, // Strict limit: 20 login attempts per 15 mins
  message: { error: "Too many login attempts. Please try again after 15 minutes." }
});

// 🛡️ 4. STRICT CORS CONFIGURATION (The "Bouncer")
const allowedOrigins = [
  'http://localhost:5173',
  'https://visionbridge-ventures.vercel.app',
  'https://visionbridge-ventures-iota.vercel.app'
  // 🚫 REMOVED the dangerous .vercel.app wildcard!
];

app.use(cors({
  origin: function (origin, callback) {
    // !origin allows backend tools like Postman for testing
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`); // Logs unauthorized attempts
      callback(new Error('Blocked by CORS Policy: Unauthorized Domain'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);

// Protected Routes
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/client-dashboard', authMiddleware, clientDashboardRoutes); 
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/sips', authMiddleware, sipRoutes);
app.use('/api/mf-schemes', authMiddleware, mfschemeRoutes); 
app.use('/api/transactions', authMiddleware, transactionRoutes); 
app.use('/api/reports', authMiddleware, reportRoutes); 

// Health Check
app.get('/', (req, res) => res.send('✅ VisionBridge API Secure & Active'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server on port ${PORT}`));