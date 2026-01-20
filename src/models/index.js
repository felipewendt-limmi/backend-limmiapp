const Sequelize = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Models
db.Client = require('./Client')(sequelize);
db.Product = require('./Product')(sequelize);
db.User = require('./User')(sequelize);

// Associations
db.Client.hasMany(db.Product, { foreignKey: 'clientId', as: 'products' });
db.Product.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });

module.exports = db;
