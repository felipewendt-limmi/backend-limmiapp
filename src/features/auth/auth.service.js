const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
    async login(email, password) {
        console.log(`[AUTH DEBUG] Attempting login for: ${email}`);

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`[AUTH DEBUG] User not found: ${email}`);
            throw new Error('Usuário ou senha inválidos');
        }

        console.log(`[AUTH DEBUG] User found. ID: ${user.id}, Role: ${user.role}`);
        console.log(`[AUTH DEBUG] Stored Hash (start): ${user.password.substring(0, 10)}...`);

        const isMatch = await bcrypt.compare(password, user.password);

        console.log(`[AUTH DEBUG] Password Match Result: ${isMatch}`);

        if (!isMatch) {
            console.log(`[AUTH DEBUG] Password mismatch for ${email}`);
            throw new Error('Usuário ou senha inválidos');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        return {
            user: { id: user.id, email: user.email, role: user.role },
            token
        };
    }
}

module.exports = new AuthService();
