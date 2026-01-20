const express = require('express');
const router = express.Router();
const statsController = require('./stats.controller');
const { authenticateToken } = require('../auth/auth.controller');

// Protected Route
router.get('/dashboard', authenticateToken, statsController.getDashboardStats);

module.exports = router;
