const { DataTypes } = require("sequelize");
const sequelize = require("../utils/sequelize");

const TodoList = sequelize.define("TodoList", {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username:     { type: DataTypes.STRING,  allowNull: false, unique: true },
  password:     { type: DataTypes.STRING,  allowNull: false },
  email:        { type: DataTypes.STRING,  allowNull: true },
  name:         { type: DataTypes.STRING,  allowNull: true },
  score:        { type: DataTypes.INTEGER, allowNull: true },
  income:       { type: DataTypes.INTEGER, allowNull: true },
  quiz1score:   { type: DataTypes.INTEGER, allowNull: true },
  quiz1total:   { type: DataTypes.INTEGER, allowNull: true },
  quiz2ratings: { type: DataTypes.TEXT,    allowNull: true },
});

module.exports = TodoList;
