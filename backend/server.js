require('dotenv').config();

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
) {
  throw new Error('JWT_SECRET is missing or too short');
}

const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    const [rows] = await pool.query(
      'SELECT DATABASE() AS database_name, VERSION() AS version'
    );

    console.log('TiDB Cloud connected successfully');
    console.log('Database:', rows[0].database_name);
    console.log('Version:', rows[0].version);

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('TiDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();