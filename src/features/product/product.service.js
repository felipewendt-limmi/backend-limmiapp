const { Product, Client } = require('../../models');
const slugify = require('slugify');
const { Op } = require('sequelize');
const sequelize = require('../../models').sequelize;

class ProductService {
    async createProduct(clientId, data) {
        let productData = { ...data };
        const slug = slugify(data.name, { lower: true, strict: true });

        // Check if product already exists for this client
        const existingForClient = await Product.findOne({
            where: { clientId, slug }
        });

        // Scenario B: Link to existing global product (if not already linked)
        if (data.parentProductId && (!existingForClient || !existingForClient.parentProductId)) {
            const parent = await Product.findByPk(data.parentProductId);
            if (parent) {
                const parentJson = parent.toJSON();
                productData = {
                    ...parentJson,
                    id: existingForClient ? existingForClient.id : undefined,
                    clientId: clientId,
                    price: data.clientPrice || data.price || (existingForClient ? existingForClient.price : parent.price),
                    parentProductId: parent.id,
                    createdAt: existingForClient ? existingForClient.createdAt : undefined,
                    updatedAt: undefined
                };
            }
        }

        let product;
        if (existingForClient) {
            // Update existing
            product = await existingForClient.update({
                ...productData,
                slug, // Ensure slug stays consistent
                price: data.clientPrice || data.price || existingForClient.price
            });
            console.log(`[Product Service] Updated existing product: ${product.name} (Slug: ${slug}) for Client: ${clientId}`);
        } else {
            // Create new
            product = await Product.create({
                ...productData,
                clientId,
                slug,
                price: data.clientPrice || data.price || 0
            });
            console.log(`[Product Service] Created new product: ${product.name} (Slug: ${slug}) for Client: ${clientId}`);
        }

        // 2. Sync to Global Catalog (Handle Market Price)
        try {
            await this.syncToGlobalCatalog(product, data.marketPrice);
        } catch (err) {
            console.error("Error syncing to global catalog:", err.message);
        }

        return product;
    }

    async syncToGlobalCatalog(sourceProduct, marketPrice) {
        // 1. Get Global Catalog Client ID
        const [globalClient] = await Client.findOrCreate({
            where: { slug: 'global-catalog' },
            defaults: {
                name: 'Catálogo Global',
                description: 'Loja mestre para gerenciamento de produtos globais.',
                isActive: true
            }
        });

        // Prevent infinite loop if we are creating FOR the global catalog directly
        if (sourceProduct.clientId === globalClient.id) return;

        // 2. Check if product already exists in Global Catalog (by slug or name)
        const existing = await Product.findOne({
            where: {
                clientId: globalClient.id,
                slug: sourceProduct.slug
            }
        });

        const globalPrice = marketPrice || sourceProduct.price;

        if (existing) {
            // Update global product with market price if provided
            if (marketPrice) {
                await existing.update({ price: marketPrice });
                console.log(`[Global Sync] Updated ${sourceProduct.name} price to ${marketPrice} in Global Catalog`);
            }
        } else {
            // Create new global entry
            await Product.create({
                name: sourceProduct.name,
                description: sourceProduct.description,
                price: globalPrice,
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
            console.log(`[Global Sync] Created ${sourceProduct.name} in Global Catalog with price ${globalPrice}`);
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

    async findById(id) {
        return await Product.findByPk(id);
    }

    async update(id, data) {
        const product = await Product.findByPk(id);
        if (!product) throw new Error('Product not found');

        // Handle Market Price Update (Dual Editing)
        if (data.marketPrice) {
            try {
                const globalClient = await Client.findOne({ where: { slug: 'global-catalog' } });
                if (globalClient && product.clientId !== globalClient.id) {
                    let globalProduct = null;

                    if (product.parentProductId) {
                        globalProduct = await Product.findOne({ where: { id: product.parentProductId, clientId: globalClient.id } });
                    }

                    if (!globalProduct) {
                        // Fallback by slug
                        globalProduct = await Product.findOne({ where: { slug: product.slug, clientId: globalClient.id } });
                    }

                    if (globalProduct) {
                        // Use this.update instead of globalProduct.update to trigger PROPAGATION to other clients
                        await this.update(globalProduct.id, { price: data.marketPrice });
                        console.log(`[Dual Edit] Updated Global Product Price and triggered propagation for ${data.marketPrice} (Source: ${product.name})`);
                    }
                }
            } catch (err) {
                console.error("Error updating global market price:", err);
            }
        }

        const updated = await product.update(data);

        // Propagation Logic: If this is a global product, update all matching products in other clients
        try {
            const globalClient = await Client.findOne({ where: { slug: 'global-catalog' } });
            if (globalClient && product.clientId === globalClient.id) {
                console.log(`[Global Propagation] Product "${product.name}" updated. Propagating to other clients...`);

                // Fields to propagate (Standardized metadata + Global Market Price)
                const propagationData = {
                    description: updated.description,
                    nutrition: updated.nutrition,
                    benefits: updated.benefits,
                    tags: updated.tags,
                    helpsWith: updated.helpsWith,
                    emoji: updated.emoji,
                    category: updated.category,
                    marketPrice: updated.marketPrice // PROPAGATE MARKET PRICE
                };

                // Update products by parentProductId (Precise) OR by slug (Legacy/Matches)
                const [count] = await Product.update(propagationData, {
                    where: {
                        [Op.or]: [
                            { parentProductId: updated.id },
                            {
                                slug: updated.slug,
                                parentProductId: null // Only fallback to slug if not explicitly linked
                            }
                        ],
                        clientId: { [Op.ne]: globalClient.id }
                    }
                });

                if (count > 0) {
                    console.log(`[Global Propagation] Updated ${count} products across clients.`);
                }
            }
        } catch (err) {
            console.error("[Global Propagation] Error propagating product update:", err.message);
        }

        return updated;
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

    async getGlobalExportList() {
        const globalClient = await Client.findOne({ where: { slug: 'global-catalog' } });
        if (!globalClient) return [];

        return await Product.findAll({
            where: { clientId: globalClient.id },
            attributes: ['id', 'name', 'price'],
            order: [['name', 'ASC']]
        });
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
