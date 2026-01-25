const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

// Create product for a specific client

// Create product for a specific client
// Create product for a specific client
router.post('/clients/:clientId/products', productController.create);

router.post('/clients/:clientId/products/bulk-import', productController.bulkImport);
// Product utilities
router.get('/global-search', productController.globalSearch);
router.get('/global-export', productController.globalExport);
router.get('/categories', productController.getCategories);
router.get('/categories/global', productController.getCategories); // Alias for Base LIMMI requirement

// Get products by client slug (public)
router.get('/clients/:clientSlug/products', productController.getByClientSlug);

// Update product
router.put('/:id', productController.update);
router.post('/:id/interaction', productController.trackInteraction);
router.get('/:id/interactions', productController.getInteractions);

module.exports = router;
