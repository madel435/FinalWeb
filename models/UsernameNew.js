const { DataTypes } = require("sequelize");
const sequelize = require("../utils/sequelize");

const TodoListItems = sequelize.define("TodoListItems", {
  id:              { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:          { type: DataTypes.INTEGER, allowNull: true },
  task:            { type: DataTypes.STRING,  allowNull: false },
  completed:       { type: DataTypes.BOOLEAN, defaultValue: false },
  lastCompletedAt: { type: DataTypes.DATE,    allowNull: true },
});

module.exports = TodoListItems;
