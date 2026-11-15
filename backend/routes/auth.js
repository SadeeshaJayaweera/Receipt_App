const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { config } = require('../src/config/env');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    console.log('Register request received:', { body: req.body });
    const { businessName, email, password, phone, address } = req.body;

    if (!businessName || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    console.log('Creating new user...');
    const user = new User({ businessName, email, password, phone, address });
    await user.save();
    console.log('User created:', user._id);

    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

    console.log('Registration successful for:', email);
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user._id, businessName: user.businessName, email: user.email, phone: user.phone, address: user.address }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, businessName: user.businessName, email: user.email, phone: user.phone, address: user.address }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { businessName, phone, address } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (businessName) user.businessName = businessName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      message: 'Profile updated',
      user: { id: user._id, businessName: user.businessName, email: user.email, phone: user.phone, address: user.address }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: { id: user._id, businessName: user.businessName, email: user.email, phone: user.phone, address: user.address } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;