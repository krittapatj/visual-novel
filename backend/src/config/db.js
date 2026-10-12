const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const caPath = path.resolve(
  __dirname,
  '../../',
  process.env.DB_CA_PATH || './certs/isrgrootx1.pem'
);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca: fs.readFileSync(caPath),
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

module.exports = pool;