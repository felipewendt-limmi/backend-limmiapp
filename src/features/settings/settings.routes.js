const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticateToken } = require('../auth/auth.middleware');

router.use(authenticateToken);

// Sessions
router.get('/sessions', settingsController.getSessions);
router.post('/sessions/rename', settingsController.renameSession);
router.post('/sessions/disconnect', settingsController.disconnectSession);

// Account
router.post('/account/request-update', settingsController.requestAccountUpdate);
router.post('/account/verify-update', settingsController.verifyAndSaveAccount);

module.exports = router;
