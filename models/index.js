const sequelize = require('../config/database');
const Admin = require('./admin.model');
const Product = require('./product.model');
const ChatHistory = require('./chatHistory.model');

module.exports = {
  sequelize,
  Admin,
  Product,
  ChatHistory,
};
