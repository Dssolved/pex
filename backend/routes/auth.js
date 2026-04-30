const { Router } = require('express');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

const router = Router();

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

router.post('/register', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!isValidUsername(username)) {
      return res.status(400).json({ message: 'Username must be 3-30 characters: letters, numbers or underscore' });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    const user = await User.create({
      username,
      passwordHash: hashPassword(password),
    });

    res.status(201).json({
      token: signToken(user),
      user,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    console.error('[AUTH] Register error:', err.message);
    res.status(500).json({ message: 'Failed to register' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const user = await User.findOne({ username });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      token: signToken(user),
      user,
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ message: 'Failed to login' });
  }
});

module.exports = router;
