const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

// Create product for a specific client


// Get products by client slug (public)
router.get('/clients/:clientSlug/products', productController.getByClientSlug);

// Update product
router.put('/products/:id', productController.update);

module.exports = router;
