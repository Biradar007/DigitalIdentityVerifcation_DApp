const express = require('express');
const { createAdmin, getAllUsers, deactivateUser } = require('../controllers/adminController');
const router = express.Router();

router.post('/create', createAdmin);
router.get('/users', getAllUsers);
router.put('/users/:userId/deactivate', deactivateUser);

module.exports = router;

const adminRoutes = require('./routes/adminRoutes');

// Add admin routes
app.use('/api/admin', adminRoutes);