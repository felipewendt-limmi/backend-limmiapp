const { Client } = require('../../models');
const slugify = require('slugify');

class ClientService {
    async createClient(data) {
        const slug = slugify(data.name, { lower: true, strict: true });
        return await Client.create({ ...data, slug });
    }

    async findAll() {
        return await Client.findAll({
            include: ['products'] // Ensure products are fetched for the dashboard
        });
    }

    async findBySlug(slug) {
        return await Client.findOne({ where: { slug } });
    }

    async update(id, data) {
        const client = await Client.findByPk(id);
        if (!client) throw new Error('Client not found');
        return await client.update(data);
    }

    async bulkCreateWithProducts(clientsData) {
        const results = [];
        for (const data of clientsData) {
            try {
                // 1. Create Client
                // Use provided slug or generate from name
                const slug = data.slug || slugify(data.name, { lower: true, strict: true });

                // Check if client exists to avoid duplicates or errors (optional, but good for safety)
                let client = await Client.findOne({ where: { slug } });

                if (!client) {
                    client = await Client.create({
                        name: data.name,
                        slug: slug,
                        description: data.description || "",
                        isActive: true
                    });
                }

                // 2. Create Products
                if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                    const Product = require('../../models').Product; // Lazy load to avoid circular deps if any

                    const productsToCreate = data.products.map(p => ({
                        ...p,
                        clientId: client.id,
                        slug: slugify(p.name, { lower: true, strict: true }),
                        isActive: true
                    }));

                    await Product.bulkCreate(productsToCreate);
                }

                results.push({ name: client.name, status: 'success' });
            } catch (error) {
                console.error(`Failed to import client ${data.name}:`, error);
                results.push({ name: data.name, status: 'error', error: error.message });
            }
        }
        return results;
    }
}

module.exports = new ClientService();
