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
}

module.exports = new ClientService();
