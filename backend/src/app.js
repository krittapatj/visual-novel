const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const storyRoutes = require('./routes/storyRoutes');
const path = require('path');
const assetRoutes = require('./routes/assetRoutes');
const characterRoutes = require("./routes/characterRoutes");
const publishingRoutes = require('./routes/publishingRoutes');
const publicPlayerRoutes = require('./routes/publicPlayerRoutes');
const saveSlotRoutes = require("./routes/saveSlotRoutes");
const myGamesRoutes = require("./routes/myGamesRoutes");

// Create an Express application
const app = express();

// Set FRONTEND_URL to a comma-separated list of trusted frontend origins.
// Local development defaults to Vite on port 5173.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (e.g. server-to-server) are allowed.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  }
}));

app.use(express.json({
  limit: '1mb'
}));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Visual Novel API is running'
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', gameRoutes);

app.use('/api/creator', chapterRoutes);
app.use('/api/creator', storyRoutes);
app.use('/api/creator', assetRoutes);
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'))
);
app.use("/api/creator", characterRoutes);
app.use('/api', publishingRoutes);
app.use('/api', publicPlayerRoutes);
app.use("/api", saveSlotRoutes);
app.use("/api", myGamesRoutes);

// Centralized error handling: never expose stack traces in production.
app.use((err, req, res, next) => {
  if (err.message === 'CORS origin not allowed') {
    return res.status(403).json({ success: false, message: 'Origin not allowed' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }
  console.error('Unhandled request error:', err);
  return res.status(err.status && err.status >= 400 && err.status < 500 ? err.status : 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

module.exports = app;