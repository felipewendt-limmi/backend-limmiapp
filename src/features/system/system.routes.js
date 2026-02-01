const express = require('express');
const router = express.Router();
const systemController = require('./system.controller');
const { authenticateToken } = require('../auth/auth.middleware');

router.post('/reset-db', authenticateToken, systemController.resetDatabase);

module.exports = router;
