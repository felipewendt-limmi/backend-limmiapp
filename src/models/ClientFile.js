const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ClientFile = sequelize.define('ClientFile', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        clientId: {
            type: DataTypes.UUID,
            allowNull: false,
        }
    });

    return ClientFile;
};
