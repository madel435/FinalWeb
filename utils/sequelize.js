const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'my_adelstonem2_default',  // database name
  'my.adelstonem2',          // MySQL username
  '5ql3p7la',                // MySQL password
  {
    host: 'deltona.birdnest.org', // school server — change to '127.0.0.1' if running from home
    dialect: 'mysql'
  }
);

module.exports = sequelize;
