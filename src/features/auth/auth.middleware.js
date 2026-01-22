const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'secret', async (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Token expirado ou inválido' });

        // 2. Additional Security: Check if session exists and is active in DB
        const { Session } = require('../../models');
        const session = await Session.findOne({ where: { token, isActive: true } });

        if (!session) {
            return res.status(401).json({ error: 'Sessão encerrada ou inválida' });
        }

        req.user = decoded;
        req.session = session;
        next();
    });
};

module.exports = { authenticateToken };
