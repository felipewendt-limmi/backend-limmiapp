const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

// Create product for a specific client

// Create product for a specific client
router.post('/clients/:clientId/products', productController.create);
router.post('/clients/:clientId/products/bulk-import', productController.bulkImport);
// Product utilities
router.get('/global-search', productController.globalSearch);
router.get('/categories', productController.getCategories);
router.get('/categories/global', productController.getCategories); // Alias for Base LIMMI requirement

// Get products by client slug (public)
router.get('/clients/:clientSlug/products', productController.getByClientSlug);

// Update product
router.put('/products/:id', productController.update);

module.exports = router;
