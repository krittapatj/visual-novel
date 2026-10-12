const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL
}));

app.use(express.json({
  limit: '100kb'
}));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Visual Novel API is running'
  });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

module.exports = app;