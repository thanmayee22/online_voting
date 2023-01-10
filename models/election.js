'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Election.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });

      Election.hasMany(models.Question, {
        foreignKey: "electionId",
      });
    }
    static getElections(adminId) {
      return this.findAll({
        where: {
          adminId,
        },
        order: [["id","ASC"]],
      });
    }

    static addNewElection({electionName , adminId}) {
      return this.create({
        electionName,
        adminId,
      });
    }

    static retrieveElection(id) {
      return this.findOne({
        where: {
          id,
        },
      });
    }
  }
  Election.init({
    electionName: { 
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
      }
    },

    live: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    sequelize,
    modelName: 'Election',
  });
  return Election;
};