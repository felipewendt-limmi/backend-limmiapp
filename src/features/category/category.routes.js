const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');

// Client-scoped routes
router.post('/:clientId/categories', categoryController.create);
router.get('/:clientId/categories', categoryController.getByClient);
router.post('/:clientId/categories/sync', categoryController.syncFromProducts);

// Resource routes
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

module.exports = router;
