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

// CORS Configuration
app.use(cors({
  origin: 'http://localhost:5173', // Matches your Vite frontend port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  // 💡 THE FIX: 'Authorization' must be allowed so the frontend can send the JWT Token
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());

// --- Home Route ---
app.get('/', (req, res) => res.send('✅ VisionBridge API is active'));

// --- 🔓 PUBLIC API ROUTES ---
// Anyone can access this to login or reset their password
app.use('/api/auth', authRoutes); 

// --- 🔐 PROTECTED API ROUTES ---
// The authMiddleware acts as a bouncer. No valid token = No entry.
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
  console.log(`✅ VisionBridge Backend running on http://localhost:${PORT}`);
});