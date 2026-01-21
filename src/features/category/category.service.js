const { Category, Product, Client, sequelize } = require('../../models');

class CategoryService {
    async create(clientId, data) {
        return await Category.create({ ...data, clientId });
    }

    async findByClient(clientId) {
        const categories = await Category.findAll({
            where: { clientId },
            order: [['name', 'ASC']],
            raw: true
        });

        // Get counts
        const counts = await Product.findAll({
            where: { clientId },
            attributes: ['category', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['category'],
            raw: true
        });

        // Merge
        return categories.map(cat => {
            const countObj = counts.find(c => c.category === cat.name);
            return {
                ...cat,
                productsCount: countObj ? parseInt(countObj.count, 10) : 0
            };
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
        console.log(`[CategoryService] Syncing for ClientID: ${clientId}`);
        const products = await Product.findAll({
            where: { clientId },
            attributes: ['category']
        });
        console.log(`[CategoryService] Found ${products.length} products associated with this client.`);

        const distinctCategories = [...new Set(products.map(p => p.category).filter(c => c))];
        console.log(`[CategoryService] Distinct categories found: ${distinctCategories.join(', ')}`);

        let createdCount = 0;

        for (const catName of distinctCategories) {
            const exists = await Category.findOne({
                where: { clientId, name: catName }
            });

            if (!exists) {
                console.log(`[CategoryService] Creating missing category: ${catName}`);
                // Try to infer emoji if possible, otherwise default
                await Category.create({
                    clientId,
                    name: catName,
                    emoji: '📦'
                });
                createdCount++;
            }
        }
        console.log(`[CategoryService] Created ${createdCount} new categories.`);

        return { message: 'Sync complete', created: createdCount };
    }
}

module.exports = new CategoryService();
