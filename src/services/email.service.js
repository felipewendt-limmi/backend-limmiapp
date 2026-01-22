const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.send2FACode = async (to, code) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Limmi Admin <contato@limmi.app>',
            to: [to],
            // to: ['felipewendt.eng@gmail.com'], // In production validation we might want to restrict
            subject: 'Seu código de acesso LIMMI',
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h1>Seu código de acesso</h1>
                    <p>Use o código abaixo para acessar o painel administrativo da LIMMI:</p>
                    <div style="background: #f4f4f5; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p style="color: #666; font-size: 14px;">Este código expira em 5 minutos.</p>
                </div>
            `
        });

        if (error) {
            console.error("Resend API Error:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Email Service Error:", err);
        return false;
    }
};
