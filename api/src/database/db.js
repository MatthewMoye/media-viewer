const { DatabaseSync } = require("node:sqlite");
const { config } = require("../config");

const database = new DatabaseSync(config.databasePath);

module.exports = {
  database,
};
