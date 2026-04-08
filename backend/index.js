import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// --- 🌐 ENHANCED CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://visionbridge-ventures.vercel.app',
  'https://visionbridge-ventures-iota.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // 2. Allow if it's in our specific list
    const isWhitelisted = allowedOrigins.includes(origin);
    
    // 3. Allow ANY vercel.app domain (Very helpful for Vercel dynamic links)
    const isVercel = origin.endsWith('.vercel.app');

    if (isWhitelisted || isVercel) {
      callback(null, true);
    } else {
      console.log("❌ CORS Blocked Origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Added OPTIONS for security pre-flights
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// --- Home Route ---
app.get('/', (req, res) => res.send('✅ VisionBridge API is active'));

// --- 🔓 PUBLIC API ROUTES ---
app.use('/api/auth', authRoutes); 

// --- 🔐 PROTECTED API ROUTES ---
app.use('/api/dashboard', authMiddleware, dashboardRoutes); 
app.use('/api/client-dashboard', authMiddleware, clientDashboardRoutes); 
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/sips', authMiddleware, sipRoutes);
app.use('/api/mf-schemes', authMiddleware, mfschemeRoutes); 
app.use('/api/transactions', authMiddleware, transactionRoutes); 
app.use('/api/reports', authMiddleware, reportRoutes); 

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.stack);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ VisionBridge Backend running on port ${PORT}`);
});