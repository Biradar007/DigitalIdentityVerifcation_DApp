const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();

// Update your existing User model to include isActive field
const UserSchema = new mongoose.Schema({
  // ... existing fields ...
  isActive: { type: Boolean, default: true }
});

const adminAuth = async (req, res, next) => {
  try {
    // Get admin ID from JWT token or request header
    const adminId = req.header('Admin-Auth');
    
    if (!adminId) {
      return res.status(401).json({ message: 'No admin token provided' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update the login endpoint in server.js
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    res.json({
      message: 'Login successful.',
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = adminAuth;