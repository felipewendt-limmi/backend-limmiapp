const express = require('express');
const router = express.Router();

const clientRoutes = require('../features/client/client.routes');
const productRoutes = require('../features/product/product.routes');
const authRoutes = require('../features/auth/auth.routes');

router.use('/clients', clientRoutes);
router.use('/products', productRoutes);
router.use('/auth', authRoutes);

module.exports = router;
