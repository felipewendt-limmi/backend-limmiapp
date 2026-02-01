const clientService = require('./client.service');

class ClientController {
    async create(req, res) {
        try {
            const client = await clientService.createClient(req.body);
            res.status(201).json(client);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const clients = await clientService.findAll();
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getBySlug(req, res) {
        try {
            const client = await clientService.findBySlug(req.params.slug);
            if (!client) return res.status(404).json({ error: 'Client not found' });
            res.json(client);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const client = await clientService.update(req.params.id, req.body);
            res.json(client);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteClient(req, res) {
        try {
            await clientService.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async bulkImport(req, res) {
        try {
            const results = await clientService.bulkCreateWithProducts(req.body);
            res.status(201).json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async trackVisit(req, res) {
        try {
            const { id } = req.params;
            const client = await clientService.findById(id);
            if (!client) return res.status(404).json({ error: 'Client not found' });

            client.views = (client.views || 0) + 1;
            await client.save();
            res.json({ success: true, views: client.views });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ClientController();
