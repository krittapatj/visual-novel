const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserDisplayName
} = require('../models/userModel');

const createToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: '2h',
      algorithm: 'HS256'
    }
  );
};

// REGISTER
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      display_name
    } = req.body || {};

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration data'
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !/^[a-zA-Z0-9_]{3,50}$/.test(cleanUsername) ||
      cleanEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72 ||
      (display_name != null &&
        (typeof display_name !== 'string' ||
         display_name.trim().length > 100))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username, email or password'
      });
    }

    const existingUser = await findUserByEmail(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userId = await createUser({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      displayName: display_name?.trim() || cleanUsername
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        user_id: userId,
        username: cleanUsername,
        email: cleanEmail
      }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    console.error('Register error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await findUserByEmail(
      email.trim().toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended'
      });
    }

    const token = createToken(user.user_id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User unavailable'
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


const updateProfile = async (req, res) => {
  try {
    const body = req.body;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(body, 'display_name')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Only display_name can be updated'
      });
    }

    const { display_name } = body;

    if (typeof display_name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Display name must be a string'
      });
    }

    const cleanDisplayName = display_name.trim();

    if (
      cleanDisplayName.length < 1 ||
      cleanDisplayName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Display name must be 1-100 characters'
      });
    }

    const userId = req.user.userId;

    const currentUser = await findUserById(userId);

    if (!currentUser || currentUser.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User unavailable'
      });
    }

    await updateUserDisplayName(userId, cleanDisplayName);

    const updatedUser = await findUserById(userId);

    if (!updatedUser || updatedUser.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User unavailable'
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};