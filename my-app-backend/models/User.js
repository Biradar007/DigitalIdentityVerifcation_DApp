const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['applicant', 'employer', 'institution', 'admin'] },
  address: { type: String }, // Ethereum address for employer/institution
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);