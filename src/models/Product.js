const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        marketPrice: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        unit: {
            type: DataTypes.STRING,
            defaultValue: 'un',
        },
        images: {
            type: DataTypes.JSONB, // Array of image URLs
            defaultValue: [],
        },
        // Backward compatibility (optional, can remove later)
        image: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        // Analytics Fields
        views: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        favoritesCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        nutritionInteractions: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        // Flexible JSONB Fields
        nutrition: {
            type: DataTypes.JSONB,
            defaultValue: [],
            // Stores array of objects: [{ label: "Calorias", value: "100kcal" }]
        },
        benefits: {
            type: DataTypes.JSONB,
            defaultValue: [],
            // Stores array of strings
        },
        tags: {
            type: DataTypes.JSONB,
            defaultValue: [],
            // Stores array of strings
        },
        helpsWith: {
            type: DataTypes.JSONB,
            defaultValue: [],
            // Stores array of strings
        },
        tips: {
            type: DataTypes.JSONB,
            defaultValue: [],
        },
        parentProductId: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Reference to the original product in Global Catalog'
        }
    });

    return Product;
};
