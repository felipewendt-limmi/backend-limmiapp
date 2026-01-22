const express = require('express');
const router = express.Router();

const clientRoutes = require('../features/client/client.routes');
const productRoutes = require('../features/product/product.routes');
const authRoutes = require('../features/auth/auth.routes');
const { authenticateToken } = require('../features/auth/auth.middleware');

router.use('/clients', clientRoutes);
router.use('/products', productRoutes);
router.use('/auth', authRoutes);
router.use('/stats', authenticateToken, require('../features/stats/stats.routes'));
router.use('/files', authenticateToken, require('../features/file/file.routes')); // New File Routes
router.use('/settings', require('../features/settings/settings.routes'));
router.use('/', require('../features/category/category.routes')); // Category usually public for store but we should check internal routes later

module.exports = router;
