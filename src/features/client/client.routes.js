const express = require('express');
const router = express.Router();
const clientController = require('./client.controller');
const productController = require('../product/product.controller');
const categoryController = require('../category/category.controller');

router.post('/', clientController.create);
router.post('/bulk-import', clientController.bulkImport); // Bulk Import Clients
router.get('/', clientController.getAll);
router.get('/:slug', clientController.getBySlug);
router.put('/:id', clientController.update);
router.post('/:id/visit', clientController.trackVisit); // Tracking

// Product routes under clients (so path is /api/clients/:clientId/products/...)
router.post('/:clientId/products', productController.create);
router.post('/:clientId/products/bulk-import', productController.bulkImport); // Bulk Import Products

// Category routes under clients
router.get('/:clientId/categories', categoryController.getByClient);
router.post('/:clientId/categories/sync', categoryController.syncFromProducts);

module.exports = router;

