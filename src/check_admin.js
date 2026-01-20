const db = require('./models');

async function checkAdmin() {
    try {
        await db.sequelize.authenticate();
        console.log('Database connection OK.');

        // FORCE SYNC (Creates table if missing)
        await db.sequelize.sync();
        console.log('Sync complete.');

        const user = await db.User.findOne({ where: { email: 'admin@admin.com' } });
        if (user) {
            console.log('Admin User Found:', user.email);
            console.log('Role:', user.role);
        } else {
            console.log('User not found. Creating...');
            await db.User.create({
                email: 'admin@admin.com',
                password: 'admin',
                role: 'superadmin'
            });
            console.log('Admin Created: admin@admin.com / admin');
        }
    } catch (error) {
        console.error('Error checking admin:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkAdmin();
