const productService = require('./product.service');

class ProductController {
    async create(req, res) {
        try {
            console.log("POST /products hit");
            console.log("Params:", req.params);
            console.log("Body:", req.body);
            const { clientId } = req.params;
            const product = await productService.createProduct(clientId, req.body);

            // Emit Socket Event
            if (req.io) {
                req.io.emit('product:updated', { action: 'create', product });
            }

            res.status(201).json(product);
        } catch (error) {
            console.error("Create Product Error:", error);
            res.status(400).json({ error: error.message });
        }
    }

    async getByClientSlug(req, res) {
        try {
            const products = await productService.findByClientSlug(req.params.clientSlug);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const product = await productService.update(req.params.id, req.body);

            if (req.io) {
                req.io.emit('product:updated', { action: 'update', product });
            }

            res.json(product);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new ProductController();
