const pool = require('../config/db');

const checkDatabase = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT 1 AS connected'
    );

    res.json({
      success: true,
      message: 'Database connected successfully',
      database: process.env.DB_NAME,
      result: rows[0]
    });

  } catch (error) {
    console.error('Database error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
};

module.exports = {
  checkDatabase
};