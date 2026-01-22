const Sequelize = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Models
db.Client = require('./Client')(sequelize);
db.Product = require('./Product')(sequelize);
db.Category = require('./Category')(sequelize);
db.User = require('./User')(sequelize);
db.ClientFile = require('./ClientFile')(sequelize);
db.ProductInteraction = require('./ProductInteraction')(sequelize);

// Associations
// Client <-> Products
db.Client.hasMany(db.Product, { foreignKey: 'clientId', as: 'products' });
db.Product.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });

db.Client.hasMany(db.Category, { foreignKey: 'clientId', as: 'categories' });
db.Category.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });

db.Client.hasMany(db.ClientFile, { foreignKey: 'clientId', as: 'files' });
db.ClientFile.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });

// Product <-> Interactions
db.Product.hasMany(db.ProductInteraction, { foreignKey: 'productId', as: 'interactions' });
db.ProductInteraction.belongsTo(db.Product, { foreignKey: 'productId', as: 'product' });

module.exports = db;
