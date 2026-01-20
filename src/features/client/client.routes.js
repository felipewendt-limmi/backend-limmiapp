const express = require('express');
const router = express.Router();
const clientController = require('./client.controller');
const productController = require('../product/product.controller');

router.post('/', clientController.create);
router.get('/', clientController.getAll);
router.get('/:slug', clientController.getBySlug);
router.put('/:id', clientController.update);
router.post('/:clientId/products', productController.create);

module.exports = router;
