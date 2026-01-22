const express = require('express');
const router = express.Router();

const clientRoutes = require('../features/client/client.routes');
const productRoutes = require('../features/product/product.routes');
const authRoutes = require('../features/auth/auth.routes');

router.use('/clients', clientRoutes);
router.use('/products', productRoutes);
router.use('/auth', authRoutes);
router.use('/stats', require('../features/stats/stats.routes'));
router.use('/files', require('../features/file/file.routes')); // New File Routes
router.use('/', require('../features/category/category.routes')); // Mount at root for flexible paths like /clients/:id/categories

module.exports = router;
