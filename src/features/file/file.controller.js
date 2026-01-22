const { ClientFile } = require('../../models');
const fs = require('fs');
const path = require('path');

class FileController {
    async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const { clientId } = req.body;
            if (!clientId) {
                return res.status(400).json({ error: "ClientId is required" });
            }

            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

            const fileRecord = await ClientFile.create({
                name: req.file.originalname,
                url: fileUrl,
                type: req.file.mimetype,
                size: req.file.size,
                clientId: clientId
            });

            res.status(201).json(fileRecord);
        } catch (error) {
            console.error("File Upload Error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    async listByClient(req, res) {
        try {
            const { clientId } = req.params;
            const files = await ClientFile.findAll({
                where: { clientId },
                order: [['createdAt', 'DESC']]
            });
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const file = await ClientFile.findByPk(id);

            if (!file) return res.status(404).json({ error: "File not found" });

            // Optional: Delete physical file
            // const filename = file.url.split('/').pop();
            // const filePath = path.join(__dirname, '../../../../public/uploads', filename);
            // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            await file.destroy();
            res.json({ message: "File deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new FileController();
