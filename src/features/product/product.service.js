const { Product, Client } = require('../../models');
const slugify = require('slugify');

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
}

module.exports = new ProductService();
