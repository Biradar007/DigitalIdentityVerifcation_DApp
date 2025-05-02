const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.createAdmin = async (req, res) => {
  try {
    const { username, password, address } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new Admin({
      username,
      password: hashedPassword,
      address
    });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    res.status(200).json({ message: 'User deactivated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating user', error: error.message });
  }
};