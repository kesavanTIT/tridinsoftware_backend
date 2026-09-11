require('dotenv').config();
const express = require('express');
const cors = require('cors');

const contactRoutes = require('./routes/contact.routes');
const careerRoutes = require('./routes/career.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Tridin Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/health`);
});
