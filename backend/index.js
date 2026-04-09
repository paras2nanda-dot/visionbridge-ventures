import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

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

// Middlewares
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate Limiter for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, // Increased slightly for production testing
  message: { error: "Too many attempts. Please try again later." }
});

// Advanced CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://visionbridge-ventures.vercel.app',
  'https://visionbridge-ventures-iota.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// API Routes
// Note: This makes your login URL: /api/auth/login
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