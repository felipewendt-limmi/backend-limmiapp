const { exec } = require('child_process');
const path = require('path');

exports.resetDatabase = async (req, res) => {
    try {
        // Only superadmins can reset the database
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Acesso negado. Apenas superadmins podem resetar o banco.' });
        }

        const scriptPath = path.join(__dirname, '../../../scripts/reset-db.js');

        console.log(`[System] Starting database reset via script: ${scriptPath}`);

        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`[System] Reset error: ${error.message}`);
                return res.status(500).json({ message: 'Erro ao resetar banco de dados.', error: error.message });
            }
            if (stderr) {
                console.warn(`[System] Reset warning: ${stderr}`);
            }
            console.log(`[System] Reset success: ${stdout}`);
            return res.status(200).json({ message: 'Banco de dados resetado com sucesso!', output: stdout });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro interno ao processar reset.' });
    }
};
