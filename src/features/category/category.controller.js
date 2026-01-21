const categoryService = require('./category.service');

class CategoryController {
    async create(req, res) {
        try {
            const { clientId } = req.params;
            const category = await categoryService.create(clientId, req.body);
            res.json(category);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getByClient(req, res) {
        try {
            const { clientId } = req.params;
            const categories = await categoryService.findByClient(clientId);
            res.json(categories);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const category = await categoryService.update(id, req.body);
            res.json(category);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await categoryService.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Auto-create categories from products (utility)
    async syncFromProducts(req, res) {
        try {
            const { clientId } = req.params;
            const stats = await categoryService.syncFromProducts(clientId);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CategoryController();
