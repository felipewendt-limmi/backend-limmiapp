const { Session, User } = require('../../models');
const emailService = require('../../services/email.service');
const bcrypt = require('bcryptjs');

class SettingsController {
    // Session Management
    async getSessions(req, res) {
        try {
            const sessions = await Session.findAll({
                where: { userId: req.user.id, isActive: true },
                order: [['lastSeen', 'DESC']]
            });
            res.json(sessions);
        } catch (error) {
            res.status(500).json({ error: 'Falha ao buscar sessões' });
        }
    }

    async renameSession(req, res) {
        try {
            const { sessionId, name } = req.body;
            const session = await Session.findOne({ where: { id: sessionId, userId: req.user.id } });
            if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });

            session.deviceName = name;
            await session.save();
            res.json(session);
        } catch (error) {
            res.status(500).json({ error: 'Falha ao renomear sessão' });
        }
    }

    async disconnectSession(req, res) {
        try {
            const { sessionId } = req.body;
            const session = await Session.findOne({ where: { id: sessionId, userId: req.user.id } });
            if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });

            session.isActive = false;
            await session.save();
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Falha ao desconectar sessão' });
        }
    }

    // Account Updates (Email/Password) with 2FA
    async requestAccountUpdate(req, res) {
        try {
            const user = await User.findByPk(req.user.id);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

            // Generate 5 digit code
            const code = Math.floor(10000 + Math.random() * 90000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            user.twoFactorCode = code;
            user.twoFactorExpires = expires;
            await user.save();

            // Send to current email
            await emailService.send2FACode('felipewendt.eng@gmail.com', code); // Hardcoded as per user request for admin

            res.json({ success: true, message: 'Código enviado para seu email seguro' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao solicitar atualização' });
        }
    }

    async verifyAndSaveAccount(req, res) {
        try {
            const { code, email, password } = req.body;
            const user = await User.findByPk(req.user.id);

            if (!user || user.twoFactorCode !== code || new Date() > user.twoFactorExpires) {
                return res.status(400).json({ error: 'Código inválido ou expirado' });
            }

            if (email) user.email = email;
            if (password) {
                user.password = password; // Hashing handled by User model hook
            }

            // Clear 2FA
            user.twoFactorCode = null;
            user.twoFactorExpires = null;
            await user.save();

            res.json({ success: true, message: 'Conta atualizada com sucesso' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao salvar alterações' });
        }
    }
}

module.exports = new SettingsController();
