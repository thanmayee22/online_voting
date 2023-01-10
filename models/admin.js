'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Admin.hasMany(models.Election, {
        foreignKey: "adminId",
      });
    }

    static async createAdmin({firstName , lastName,email,password}) {
        return this.create({
          firstName,
          lastName,
          email,
          password,
        });
    }
  }
  Admin.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull:false,
      validate: {
        notNull: true,
      },
    },
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull:false,
      validate: {
        notNull: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true
      },
    },
  }, {
    sequelize,
    modelName: 'Admin',
  });
  return Admin;
};