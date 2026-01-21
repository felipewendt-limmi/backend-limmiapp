const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '📦' // Default emoji
        },
        clientId: {
            type: DataTypes.UUID,
            allowNull: false
        }
    });

    return Category;
};
