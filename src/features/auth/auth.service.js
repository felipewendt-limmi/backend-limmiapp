const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../../services/email.service');

class AuthService {
    async login(email, password) {
        console.log(`[AUTH] Login step 1 for: ${email}`);
        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error('Usuário ou senha inválidos');
        }

        // Generate 5 digit code
        const code = Math.floor(10000 + Math.random() * 90000).toString();
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        // Save to DB
        user.twoFactorCode = code;
        user.twoFactorExpires = expires;
        await user.save();

        // Send Email
        // Hardcoded recipient as requested for Admin MVP, otherwise use user.email
        const recipient = 'felipewendt.eng@gmail.com';
        await emailService.send2FACode(recipient, code);

        // Generate Temp Token (valid for 5 mins, only for 2FA verification)
        const tempToken = jwt.sign(
            { id: user.id, scope: '2fa_pending' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '5m' }
        );

        return {
            requires2FA: true,
            tempToken,
            message: `Código enviado para ${recipient}`
        };
    }

    async verify2FA(tempToken, code, metadata = {}) {
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
        } catch (e) {
            throw new Error('Token expirado ou inválido');
        }

        if (decoded.scope !== '2fa_pending') {
            throw new Error('Token inválido para verificação');
        }

        const user = await User.findByPk(decoded.id);
        if (!user) throw new Error('Usuário não encontrado');

        if (user.twoFactorCode !== code) {
            throw new Error('Código incorreto');
        }

        if (new Date() > user.twoFactorExpires) {
            throw new Error('Código expirado');
        }

        // Clear code
        user.twoFactorCode = null;
        user.twoFactorExpires = null;
        await user.save();

        // Generate Final Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '365d' }
        );

        // Create Session record
        const { Session } = require('../../models');
        await Session.create({
            userId: user.id,
            token: token,
            ip: metadata.ip || '0.0.0.0',
            deviceName: metadata.deviceName || 'Navegador Desconhecido',
            location: metadata.location || 'Localização Omitida',
            lastSeen: new Date()
        });

        return {
            user: { id: user.id, email: user.email, role: user.role },
            token
        };
    }
}

module.exports = new AuthService();
