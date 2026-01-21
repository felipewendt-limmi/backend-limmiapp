const { Product, Client } = require('../../models');
const slugify = require('slugify');
const { Op } = require('sequelize');
const sequelize = require('../../models').sequelize;

class ProductService {
    async createProduct(clientId, data) {
        const slug = slugify(data.name, { lower: true, strict: true });

        // 1. Create the product for the specific client
        const product = await Product.create({
            ...data,
            clientId,
            slug
        });

        // 2. Sync to Global Catalog (if this isn't already the global catalog)
        // We do this asynchronously/background to not block the main request if desired, 
        // but for data integrity, let's await it or catch errors silently.
        try {
            await this.syncToGlobalCatalog(product);
        } catch (err) {
            console.error("Error syncing to global catalog:", err.message);
        }

        return product;
    }

    async syncToGlobalCatalog(sourceProduct) {
        // 1. Get Global Catalog Client ID
        const [globalClient] = await Client.findOrCreate({
            where: { slug: 'global-catalog' },
            defaults: {
                name: 'Catálogo Global',
                description: 'Loja mestre para gerenciamento de produtos globais.',
                isActive: true
            }
        });

        // Prevent infinite loop if we are creating FOR the global catalog
        if (sourceProduct.clientId === globalClient.id) return;

        // 2. Check if product already exists in Global Catalog (by slug or name)
        // Global catalog should be the master source, so we only add if missing? 
        // Or do we update? User said "whenever create... create for this store".
        // Let's ensure it exists.
        const existing = await Product.findOne({
            where: {
                clientId: globalClient.id,
                slug: sourceProduct.slug
            }
        });

        if (!existing) {
            await Product.create({
                name: sourceProduct.name,
                description: sourceProduct.description,
                price: sourceProduct.price,
                category: sourceProduct.category,
                image: sourceProduct.image,
                nutrition: sourceProduct.nutrition,
                benefits: sourceProduct.benefits,
                tags: sourceProduct.tags,
                helpsWith: sourceProduct.helpsWith,
                emoji: sourceProduct.emoji,
                slug: sourceProduct.slug,
                clientId: globalClient.id,
                isActive: true
            });
            console.log(`[Global Sync] Created ${sourceProduct.name} in Global Catalog`);
        }
    }

    async findByClientSlug(clientSlug) {
        const client = await Client.findOne({ where: { slug: clientSlug } });
        if (!client) throw new Error('Client not found');

        return await Product.findAll({
            where: { clientId: client.id }
        });
    }

    async findByClientId(clientId) {
        return await Product.findAll({
            where: { clientId }
        });
    }

    async update(id, data) {
        const product = await Product.findByPk(id);
        if (!product) throw new Error('Product not found');
        return await product.update(data);
    }

    async delete(id) {
        const product = await Product.findByPk(id);
        if (!product) throw new Error('Product not found');
        await product.destroy();
        return { message: 'Deleted successfully' };
    }

    async findGlobalByName(query) {
        // Return distinct products by name matching query
        // Using Sequelize with DISTINCT ON or GROUP BY for PostgreSQL
        // Assuming PostgreSQL dialect from context (EasyPanel/Supabase usually)
        // If MySQL, GROUP BY is fine.

        return await Product.findAll({
            where: {
                name: { [Op.iLike]: `%${query}%` }
            },
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('name')), 'name'],
                'description',
                'price',
                'category',
                'image',
                'nutrition',
                'benefits',
                'tags',
                'helpsWith'
            ],
            limit: 10
        });
        /* Note: DISTINCT on one column with other columns needs careful SQL group by or distinct on.
           A safer/universal approach for "Template Search" is to just find all matches and filter in JS 
           or just return the most relevant ones. 
           Let's use a simpler query first to avoid SQL group errors if strictly sql_mode is on.
        */
    }

    async findGlobalTemplate(query) {
        // Simple search for templates. We pick the most recent one for each name.
        const whereClause = {};
        if (query) {
            whereClause.name = { [Op.iLike]: `%${query}%` };
        }

        const products = await Product.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 50 // Increased limit for catalogue view
        });

        // Deduplicate by name in JS to ensure unique results for the user
        const unique = [];
        const seen = new Set();
        for (const p of products) {
            const nameLower = p.name.toLowerCase().trim();
            if (!seen.has(nameLower)) {
                seen.add(nameLower);
                unique.push(p);
            }
        }
        return unique.slice(0, 50);
    }

    async getAllCategories() {
        const categories = await Product.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
            where: {
                category: { [Op.ne]: null }
            },
            order: [['category', 'ASC']]
        });
        return categories.map(c => c.category).filter(c => c);
    }
}

module.exports = new ProductService();
