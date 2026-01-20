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
}

module.exports = new ClientController();
