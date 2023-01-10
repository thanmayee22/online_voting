'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // adding the question id to oprtions table
    await queryInterface.addColumn("Options", "questionId", {
      type: Sequelize.DataTypes.INTEGER,
      onDelete: "CASCADE",
    });

    await queryInterface.addConstraint("Options", {
      fields: ["questionId"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "Questions",
        field: "id",
      },
    });
  },

  async down (queryInterface, Sequelize) {
    // to drop question id from options table
    await queryInterface.removeColumn("Options", "questionId");
  }
};
