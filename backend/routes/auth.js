const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Assuming User model is in '../models/User' - this path might need adjustment
// const User = require('../models/User');

const router = express.Router();

// Placeholder for JWT secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Mock User model functions for now - replace with actual User model interactions
const User = {
  users: [], // In-memory store for mock users
  nextId: 1,

  async findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  },

  async createUser(name, email, hashedPassword) {
    const newUser = {
      id: this.nextId++,
      name,
      email,
      password: hashedPassword,
      hasCompletedPreferences: false,
      profileImageUrl: '', // Conceptually added to User model
    };
    this.users.push(newUser);
    return newUser;
  },

  async findUserById(userId) {
    return this.users.find(user => user.id === parseInt(userId));
  },

  async updateUserPreferences(userId, hasCompletedPreferences) {
    const user = await this.findUserById(userId);
    if (user) {
      user.hasCompletedPreferences = hasCompletedPreferences;
      return user;
    }
    return null;
  },

  async updateUserProfileImageUrl(userId, imageUrl) { // Conceptually added
    const user = await this.findUserById(userId);
    if (user) {
      user.profileImageUrl = imageUrl;
      return user;
    }
    return null;
  }
};
// End of Mock User model

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.createUser(name, email, hashedPassword);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        hasCompletedPreferences: newUser.hasCompletedPreferences,
        profileImageUrl: newUser.profileImageUrl, // Conceptually added
      },
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or user not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasCompletedPreferences: user.hasCompletedPreferences,
        profileImageUrl: user.profileImageUrl, // Conceptually added
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// PUT /api/auth/user/:userId/preferences
router.put('/user/:userId/preferences', async (req, res) => {
  const { userId } = req.params;
  const { hasCompletedPreferences } = req.body;

  if (typeof hasCompletedPreferences !== 'boolean') {
    return res.status(400).json({ message: 'hasCompletedPreferences must be a boolean' });
  }

  try {
    // Here, you would typically also have authentication middleware to ensure
    // the logged-in user is authorized to update these preferences,
    // or that an admin is performing the action.
    // For simplicity, direct update is shown.
    // TODO: Future Enhancement: This endpoint could also accept detailed preferences
    // (categories, ambiance, priceRange, etc.) in req.body and save them to the User model.
    // This would require expanding User.updateUserPreferences and the User model schema.

    const updatedUser = await User.updateUserPreferences(userId, hasCompletedPreferences);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Preferences updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasCompletedPreferences: updatedUser.hasCompletedPreferences,
        profileImageUrl: updatedUser.profileImageUrl, // Conceptually added
      },
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

// TODO: Future endpoint for profile image updates
// PUT /api/auth/user/:userId/profile-image
// - Should accept an image file or an image URL.
// - If a file, handle upload to cloud storage (e.g., S3, Cloudinary) and get URL.
// - Update user's profileImageUrl in the database.
// - Return updated user info or new image URL.
// - Requires authentication middleware.

module.exports = router;
