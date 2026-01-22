const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize;

const ProductInteraction = sequelize.define('ProductInteraction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, // view, favorite, nutrition
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'product_interactions',
    updatedAt: false // Only insert log
});

module.exports = ProductInteraction;
