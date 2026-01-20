const { Product, Client } = require('../../models');
const slugify = require('slugify');
const { Op } = require('sequelize');
const sequelize = require('../../config/database').sequelize;

class ProductService {
    async createProduct(clientId, data) {
        const slug = slugify(data.name, { lower: true, strict: true });

        // Ensure slug uniqueness within client scope if needed, keeping simple for now

        return await Product.create({
            ...data,
            clientId,
            slug
        });
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
        const products = await Product.findAll({
            where: {
                name: { [Op.iLike]: `%${query}%` }
            },
            order: [['createdAt', 'DESC']],
            limit: 20
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
        return unique.slice(0, 10);
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
