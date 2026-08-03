const { database } = require("./db");

function initializeSchema() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      root TEXT,
      parent_folder TEXT,
      full_path TEXT UNIQUE,
      filename TEXT,
      extension TEXT,
      type TEXT,
      size INTEGER,
      modified INTEGER,
      thumbnail_generated INTEGER DEFAULT 0
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS comics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      root TEXT,
      parent_folder TEXT,
      full_path TEXT UNIQUE,
      filename TEXT,
      size INTEGER,
      modified INTEGER,
      thumbnail_generated INTEGER DEFAULT 0,
      cover_entry TEXT,
      title TEXT,
      year INTEGER,
      month INTEGER,
      day INTEGER,
      writer TEXT,
      genre TEXT,
      tags TEXT,
      web TEXT,
      series TEXT,
      format TEXT,
      page_count INTEGER
    );
  `);
}

module.exports = {
  initializeSchema,
};
