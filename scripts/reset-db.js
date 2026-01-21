const db = require('../src/models');

async function reset() {
    console.log('Resetting database...');
    try {
        await db.sequelize.sync({ force: true });
        // Re-seed default data if needed (e.g. admin user, global catalog placeholder)
        console.log('Database cleared.');

        // Create Global Catalog Client
        await db.Client.create({
            name: 'Catálogo Global',
            slug: 'global-catalog',
            description: 'Loja mestre para gerenciamento de produtos globais.',
            isActive: true
        });
        console.log('Global Catalog client recreated.');

    } catch (err) {
        console.error('Error resetting database:', err);
    } finally {
        await db.sequelize.close();
    }
}

reset();
