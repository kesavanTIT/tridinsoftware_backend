require('dotenv').config();
const express = require('express');
const cors = require('cors');

const contactRoutes = require('./routes/contact.routes');
const careerRoutes = require('./routes/career.routes');
const adminRoutes = require('./routes/admin.routes');
const onboardingRoutes = require('./routes/onboarding.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Bulletproof CORS Configuration for Production & Local Development
const allowedOrigins = [
  'https://tridinsoftware.com',
  'https://www.tridinsoftware.com',
  'https://admin.tridinsoftware.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:4173'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.tridinsoftware\.com$/.test(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Ensure Vary: Origin is present on all responses to prevent CDN/Cloudflare caching issues
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    server: 'Tridin Backend API Engine',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/contact', contactRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onboarding', onboardingRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Unhandled Error Handler (Ensures CORS headers are retained on internal errors)
app.use((err, req, res, next) => {
  console.error('Unhandled Backend Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Tridin Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  console.log(`📑 Onboarding API: http://localhost:${PORT}/api/onboarding/all`);
});
