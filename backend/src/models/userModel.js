
const pool = require('../config/db');

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  return rows[0] || null;
};

const findUserById = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT
       user_id, username, email, display_name,
       avatar_url, role, status, created_at
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

const createUser = async ({
  username,
  email,
  passwordHash,
  displayName
}) => {
  const [result] = await pool.execute(
    `INSERT INTO users
      (username, email, password_hash, display_name)
     VALUES (?, ?, ?, ?)`,
    [username, email, passwordHash, displayName]
  );

  return result.insertId;
};

// UPDATE PROFILE
const updateUserDisplayName = async (userId, displayName) => {
  const [result] = await pool.execute(
    `UPDATE users
     SET display_name = ?
     WHERE user_id = ?
       AND status = 'active'`,
    [displayName, userId]
  );

  return result.affectedRows > 0;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserDisplayName
};
