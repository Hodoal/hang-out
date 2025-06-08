const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with an environment variable in production

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  User.findUserByEmail(email, async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error checking for existing user.', error: err.message });
    }
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      User.createUser(name, email, hashedPassword, null, null, (err, newUser) => {
        if (err) {
          return res.status(500).json({ message: 'Error creating user.', error: err.message });
        }

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            hasCompletedPreferences: newUser.hasCompletedPreferences,
          },
        });
      });
    } catch (error) {
      res.status(500).json({ message: 'Error hashing password.', error: error.message });
    }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  User.findUserByEmail(email, async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding user.', error: err.message });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          preferences: user.preferences,
          hasCompletedPreferences: user.hasCompletedPreferences,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error comparing passwords.', error: error.message });
    }
  });
});

module.exports = router;
