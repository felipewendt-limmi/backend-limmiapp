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

        const updated = await category.update(data);

        // Propagation: If global category emoji changes, update all clients
        try {
            const globalClient = await Client.findOne({ where: { slug: 'global-catalog' } });
            if (globalClient && category.clientId === globalClient.id && data.emoji) {
                console.log(`[Global Propagation] Category "${category.name}" emoji updated to ${data.emoji}. Propagating...`);

                await Category.update({ emoji: data.emoji }, {
                    where: {
                        name: category.name,
                        clientId: { [Op.ne]: globalClient.id }
                    }
                });
            }
        } catch (err) {
            console.error("[Global Propagation] Error propagating category update:", err.message);
        }

        return updated;
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

                let emoji = null;

                // 1. Try to get from Global Catalog first (Master Source)
                try {
                    const globalClient = await Client.findOne({ where: { slug: 'global-catalog' } });
                    if (globalClient) {
                        const globalCat = await Category.findOne({
                            where: { clientId: globalClient.id, name: catName }
                        });
                        if (globalCat) emoji = globalCat.emoji;
                    }
                } catch (e) {
                    console.error("Error fetching global emoji:", e);
                }

                // 2. If not in global, infer from name
                if (!emoji) {
                    emoji = this.inferEmoji(catName);
                }

                await Category.create({
                    clientId,
                    name: catName,
                    emoji: emoji
                });
                createdCount++;
            }
        }
        console.log(`[CategoryService] Created ${createdCount} new categories.`);

        return { message: 'Sync complete', created: createdCount };
    }

    inferEmoji(name) {
        const lower = name.toLowerCase();
        if (lower.includes('semente') || lower.includes('seed')) return '🌱';
        if (lower.includes('grão') || lower.includes('grain') || lower.includes('trigo') || lower.includes('arroz')) return '🌾';
        if (lower.includes('farinha') || lower.includes('flour')) return '🥡';
        if (lower.includes('chá') || lower.includes('tea')) return '🍵';
        if (lower.includes('tempero') || lower.includes('spice') || lower.includes('pimenta')) return '🌶️';
        if (lower.includes('fruta') || lower.includes('fruit') || lower.includes('damasco') || lower.includes('uva')) return '🍑';
        if (lower.includes('castanha') || lower.includes('nozes') || lower.includes('nut') || lower.includes('amendoa')) return '🌰';
        if (lower.includes('óleo') || lower.includes('azeite') || lower.includes('oil')) return '🫗';
        if (lower.includes('suplemento') || lower.includes('whey') || lower.includes('proteina')) return '💪';
        if (lower.includes('doce') || lower.includes('chocolate')) return '🍫';
        if (lower.includes('snack') || lower.includes('biscoito')) return '🍪';
        if (lower.includes('encap') || lower.includes('capsula')) return '💊';
        return '📦';
    }
}

module.exports = new CategoryService();
