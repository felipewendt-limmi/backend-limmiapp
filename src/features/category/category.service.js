const { Category, Product, Client } = require('../../models');

class CategoryService {
    async create(clientId, data) {
        return await Category.create({ ...data, clientId });
    }

    async findByClient(clientId) {
        return await Category.findAll({
            where: { clientId },
            order: [['name', 'ASC']]
        });
    }

    async update(id, data) {
        const category = await Category.findByPk(id);
        if (!category) throw new Error('Category not found');
        return await category.update(data);
    }

    async delete(id) {
        const category = await Category.findByPk(id);
        if (!category) throw new Error('Category not found');
        return await category.destroy();
    }

    // Utility: Scan products and creaet Categories for missing ones
    async syncFromProducts(clientId) {
        const products = await Product.findAll({
            where: { clientId },
            attributes: ['category']
        });

        const distinctCategories = [...new Set(products.map(p => p.category).filter(c => c))];
        let createdCount = 0;

        for (const catName of distinctCategories) {
            const exists = await Category.findOne({
                where: { clientId, name: catName }
            });

            if (!exists) {
                // Try to infer emoji if possible, otherwise default
                await Category.create({
                    clientId,
                    name: catName,
                    emoji: '📦'
                });
                createdCount++;
            }
        }

        return { message: 'Sync complete', created: createdCount };
    }
}

module.exports = new CategoryService();
