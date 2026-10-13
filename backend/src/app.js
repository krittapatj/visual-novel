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


// Create an Express application
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL
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


// Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

module.exports = app;