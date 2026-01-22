const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

// Import Models locally to avoid full app initialization overhead if possible, 
// but reusing service is safer to ensure logic consistency.
// Let's try to require the service if it's decoupled enough.
const CategoryService = require('../src/features/category/category.service');
const ClientModel = require('../src/models/Client')(sequelize);
const ProductModel = require('../src/models/Product')(sequelize);
const CategoryModel = require('../src/models/Category')(sequelize);

// Setup Associations (Minimal for sync)
ClientModel.hasMany(ProductModel, { foreignKey: 'clientId' });
ProductModel.belongsTo(ClientModel, { foreignKey: 'clientId' });
ClientModel.hasMany(CategoryModel, { foreignKey: 'clientId' });
CategoryModel.belongsTo(ClientModel, { foreignKey: 'clientId' });

async function syncAllCategories() {
    try {
        console.log('🔄 Starting Category Synchronization...');

        // 1. Get All Clients
        const clients = await ClientModel.findAll();
        console.log(`Found ${clients.length} clients.`);

        for (const client of clients) {
            console.log(`\nProcessing Client: ${client.name} (ID: ${client.id})`);

            // 2. Get all products for this client
            const products = await ProductModel.findAll({
                where: { clientId: client.id },
                attributes: ['category']
            });

            if (products.length === 0) {
                console.log(' - No products found.');
                continue;
            }

            // 3. Extract unique categories from products
            const uniqueCategories = [...new Set(products
                .map(p => p.category)
                .filter(c => c && c.trim() !== '')
            )];

            console.log(` - Found ${uniqueCategories.length} unique categories in products: ${uniqueCategories.join(', ')}`);

            // 4. Ensure each category exists in Category table
            for (const catName of uniqueCategories) {
                const [category, created] = await CategoryModel.findOrCreate({
                    where: {
                        clientId: client.id,
                        name: catName
                    },
                    defaults: {
                        name: catName,
                        productsCount: 0 // Will update later
                    }
                });

                if (created) console.log(`   ✅ Created category: "${catName}"`);
            }

            // 5. Update counts
            // Re-fetch all categories to update counts correctly
            const categories = await CategoryModel.findAll({ where: { clientId: client.id } });

            for (const category of categories) {
                const count = await ProductModel.count({
                    where: {
                        clientId: client.id,
                        category: category.name
                    }
                });

                await category.update({ productsCount: count });
                console.log(`   📊 Updated "${category.name}": ${count} products`);
            }
        }

        console.log('\n✅ Synchronization Complete!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Synchronization Failed:', error);
        process.exit(1);
    }
}

syncAllCategories();
