const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key'; // Ensure this matches the one in auth.js and ideally from env

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = userPayload; // Add payload to request
    next();
  });
};

// GET /api/user/profile
router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  User.findUserById(userId, (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user profile.', error: err.message });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Exclude password from the response
    const { password, ...userProfile } = user;
    res.status(200).json(userProfile);
  });
});

// PUT /api/user/profile
router.put('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, profilePicture, preferences, hasCompletedPreferences } = req.body;

  // Basic validation: ensure at least one field is being updated if needed,
  // or rely on User.updateUserProfile to handle empty updates if it's designed to.
  // For now, we'll let User.updateUserProfile handle it.

  const updates = {
    userId,
    name,
    profilePicture,
    preferences,
    hasCompletedPreferences, // Pass this directly
  };

  User.updateUserProfile(updates, (err, updatedUser) => {
    if (err) {
      if (err.message === 'User not found or no changes made') {
        return res.status(404).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Error updating user profile.', error: err.message });
    }
    // Exclude password from the response
    const { password, ...userProfile } = updatedUser;
    res.status(200).json(userProfile);
  });
});

module.exports = router;
