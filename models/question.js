'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Question.belongsTo(models.Election, {
        foreignKey: "electionId",
      });
      Question.hasMany(models.Option , {
        foreignKey: "questionId",
      });
    }
    static async countQuestions(electionId) {
      return await this.count({
        where: {
          electionId,
        },
      });
    }

    static updateQuestion({ question, description, id }) {
      return this.update(
        {
          question,
          description,
        },
        {
          returning: true,
          where: {
            id,
          },
        }
      );
    }

    static addQuestion({ questionName, description, electionId }) {
      return this.create({
        questionName,
        description,
        electionId,
      });
    }

    static async getQuestion(id) {
      return await this.findOne({
        where: {
          id,
        },
      });
    }

    static deleteQuestion(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static async getQuestions(electionId) {
      return await this.findAll({
        where: {
          electionId,
        },
        order: [["id", "ASC"]],
      });
    }
  }
  Question.init({
    questionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};
