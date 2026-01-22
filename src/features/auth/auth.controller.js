const authService = require('./auth.service');

class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const data = await authService.login(email, password);
            res.json(data);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
    async verify2FA(req, res) {
        try {
            const { tempToken, code } = req.body;
            const metadata = {
                ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                deviceName: req.headers['user-agent']
            };
            const data = await authService.verify2FA(tempToken, code, metadata);
            res.json(data);
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();
