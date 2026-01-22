const productService = require('./product.service');
const categoryService = require('../category/category.service');
const clientService = require('../client/client.service');

class ProductController {
    async create(req, res) {
        try {
            console.log("POST /products hit");
            console.log("Params:", req.params);
            console.log("Body:", req.body);
            const { clientId } = req.params;
            const product = await productService.createProduct(clientId, req.body);

            // Auto-sync categories for single product creation
            try {
                await categoryService.syncFromProducts(clientId);
            } catch (syncErr) {
                console.error("Auto-sync categories failed:", syncErr);
            }

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

    async bulkImport(req, res) {
        try {
            const { clientId } = req.params;
            console.log(`[ProductController] Bulk Import started for ClientID: ${clientId}`);
            const products = req.body; // Expecting Array

            if (!Array.isArray(products)) {
                return res.status(400).json({ error: "O corpo da requisição deve ser um array de produtos." });
            }

            const results = {
                total: products.length,
                success: 0,
                failed: 0,
                errors: []
            };

            for (const item of products) {
                try {
                    const productData = {
                        name: item.name,
                        description: item.description,
                        price: item.price || "0,00",
                        category: item.category || "Geral",
                        image: item.image,
                        nutrition: item.nutrition || [],
                        benefits: item.benefits || [],
                        tags: item.tags || [],
                        helpsWith: item.helpsWith || []
                    };

                    if (!productData.name) throw new Error("Produto sem nome");

                    // Reusing createProduct service which handles slug generation
                    await productService.createProduct(clientId, productData);

                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push({ name: item.name, error: err.message });
                }
            }

            // Auto-sync categories
            try {
                await categoryService.syncFromProducts(clientId);
            } catch (syncErr) {
                console.error("Auto-sync categories failed:", syncErr);
            }

            res.json(results);
        } catch (error) {
            console.error("Bulk Import Error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    async globalSearch(req, res) {
        try {
            const { query } = req.query;
            // if (!query) return res.json([]); // Allow empty query for initial list
            const products = await productService.findGlobalTemplate(query || "");
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getCategories(req, res) {
        try {
            const categories = await productService.getAllCategories();
            res.json(categories);
        } catch (error) {
            res.status(500).json({ error: error.message });
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

    async trackInteraction(req, res) {
        try {
            const { id } = req.params;
            const { type } = req.body; // 'view' | 'favorite' | 'nutrition'
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];

            console.log(`[TRACK] Interaction attempt: Product ID: ${id}, Type: ${type}, IP: ${ipAddress}`);

            const product = await productService.findById(id);
            if (!product) {
                console.log(`[TRACK] Product not found for ID: ${id}`);
                return res.status(404).json({ error: 'Product not found' });
            }

            // Create Interaction Log
            const { ProductInteraction } = require('../../models');
            await ProductInteraction.create({
                productId: id,
                type,
                ipAddress,
                userAgent
            });

            // Increment Counters (for compatibility with dashboard)
            if (type === 'view') {
                product.views = (product.views || 0) + 1;
            } else if (type === 'favorite') {
                product.favoritesCount = (product.favoritesCount || 0) + 1;
            } else if (type === 'nutrition') {
                product.nutritionInteractions = (product.nutritionInteractions || 0) + 1;
            }

            await product.save();
            console.log(`[TRACK] Interaction saved: Product ID: ${id}, New View Count: ${product.views}`);
            res.json({ success: true, views: product.views, favorites: product.favoritesCount });
        } catch (error) {
            console.error("[TRACK] Tracking Error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    async getInteractions(req, res) {
        try {
            const { id } = req.params;
            const { ProductInteraction } = require('../../models');

            const interactions = await ProductInteraction.findAll({
                where: { productId: id },
                order: [['createdAt', 'DESC']],
                limit: 50 // Limit to recent 50 for now
            });

            res.json(interactions);
        } catch (error) {
            console.error("Get Interactions Error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ProductController();
