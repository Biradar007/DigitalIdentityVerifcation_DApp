const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Admin', AdminSchema);