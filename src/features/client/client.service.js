const { Client } = require('../../models');
const slugify = require('slugify');
const { Op } = require('sequelize');
const categoryService = require('../category/category.service'); // Import CategoryService

class ClientService {
    async createClient(data) {
        const slug = slugify(data.name, { lower: true, strict: true });
        return await Client.create({ ...data, slug });
    }

    async findAll() {
        return await Client.findAll({
            where: {},
            include: ['products'],
            order: [['createdAt', 'DESC']]
        });
    }

    async findBySlug(slug) {
        if (slug === 'global-catalog') {
            const [client] = await Client.findOrCreate({
                where: { slug: 'global-catalog' },
                defaults: {
                    name: 'Catálogo Global',
                    description: 'Loja mestre para gerenciamento de produtos globais.',
                    isActive: true // Must be active to be accessed, but hidden in list
                }
            });
            return client;
        }
        return await Client.findOne({ where: { slug } });
    }

    async update(id, data) {
        const client = await Client.findByPk(id);
        if (!client) throw new Error('Client not found');
        return await client.update(data);
    }

    async bulkCreateWithProducts(clientsData) {
        console.log(`[ClientService] Bulk Import started with ${clientsData.length} items.`);
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
                    console.log(`[ClientService] Created client: ${client.name} (${client.id})`);
                } else {
                    console.log(`[ClientService] Client already exists: ${client.name}`);
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

                    const createdProducts = await Product.bulkCreate(productsToCreate);
                    console.log(`[ClientService] Created ${createdProducts.length} products for ${client.name}`);

                    // Sync to Global Catalog
                    // We can reuse the ProductService logic or duplicate minimal logic here. 
                    // To keep it clean, let's try to lazy load ProductService and use the helper? 
                    // Or just do it manually to avoid circular deps risk since we are already in ClientService.
                    try {
                        const [globalClient] = await Client.findOrCreate({ where: { slug: 'global-catalog' }, defaults: { name: 'Catálogo Global', isActive: true } });

                        if (client.id !== globalClient.id) {
                            for (const p of createdProducts) {
                                const exists = await Product.findOne({ where: { clientId: globalClient.id, slug: p.slug } });
                                if (!exists) {
                                    await Product.create({
                                        ...p.dataValues, // Use dataValues from Sequelize instance
                                        id: undefined, // Let DB generate new ID
                                        clientId: globalClient.id,
                                        createdAt: undefined,
                                        updatedAt: undefined
                                    });
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error bulk syncing to global:", err);
                    }

                    // 3. Auto-Sync Categories
                    try {
                        console.log(`[ClientService] Triggering Category Sync for ${client.name}`);
                        await categoryService.syncFromProducts(client.id);
                    } catch (catErr) {
                        console.error(`[ClientService] Error syncing categories for ${client.name}:`, catErr);
                    }
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
