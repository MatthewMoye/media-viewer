const { DatabaseSync } = require("node:sqlite");
const { config } = require("../config");

const database = new DatabaseSync(config.databasePath);

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

try {
  database.exec(`
    ALTER TABLE files
    ADD COLUMN parent_folder TEXT;
  `);
} catch (error) {
  const columnAlreadyExists = String(error.message).includes(
    "duplicate column name",
  );

  if (!columnAlreadyExists) {
    throw error;
  }
}

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
    web TEXT
  );
`);

const newComicsColumns = [
  ["series", "TEXT"],
  ["format", "TEXT"],
  ["page_count", "INTEGER"],
];

for (const [col, type] of newComicsColumns) {
  try {
    database.exec(`ALTER TABLE comics ADD COLUMN ${col} ${type}`);
  } catch (error) {
    if (!String(error.message).includes("duplicate column name")) throw error;
  }
}

const statements = {
  insertFile: database.prepare(`
    INSERT OR REPLACE INTO files (
      root,
      parent_folder,
      full_path,
      filename,
      extension,
      type,
      size,
      modified
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),

  clearFiles: database.prepare(`
    DELETE FROM files
  `),

  countFiles: database.prepare(`
    SELECT COUNT(*) AS count
    FROM files
  `),

  listMediaFiles: database.prepare(`
    SELECT
      id,
      root,
      parent_folder,
      full_path,
      filename,
      extension,
      type,
      size,
      modified,
      thumbnail_generated
    FROM files
    WHERE type != 'other'
    ORDER BY modified DESC
  `),

  listAllFiles: database.prepare(`
    SELECT
      id,
      root,
      filename,
      extension,
      type,
      size
    FROM files
    ORDER BY filename
  `),

  searchFiles: database.prepare(`
    SELECT
      id,
      root,
      parent_folder,
      full_path,
      filename,
      extension,
      type,
      size,
      modified,
      thumbnail_generated
    FROM files
    WHERE filename LIKE ?
    ORDER BY filename
  `),

  findFileForStreaming: database.prepare(`
    SELECT
      id,
      full_path,
      extension,
      type
    FROM files
    WHERE id = ?
  `),

  findFileForThumbnail: database.prepare(`
    SELECT
      id,
      full_path,
      type
    FROM files
    WHERE id = ?
  `),

  markThumbnailGenerated: database.prepare(`
    UPDATE files
    SET thumbnail_generated = 1
    WHERE id = ?
  `),

  insertComic: database.prepare(`
    INSERT OR REPLACE INTO comics (
      root, parent_folder, full_path, filename, size, modified, cover_entry,
      title, year, month, day, writer, genre, tags, web,
      series, format, page_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  clearComics: database.prepare(`
    DELETE FROM comics
  `),

  listComics: database.prepare(`
    SELECT id, root, parent_folder, full_path, filename, size, modified,
           thumbnail_generated, cover_entry, title, year, month, day,
           writer, genre, tags, web,
           series, format, page_count
    FROM comics
    ORDER BY modified DESC
  `),

  findComicById: database.prepare(`
    SELECT id, full_path, cover_entry
    FROM comics
    WHERE id = ?
  `),

  getExistingComics: database.prepare(`
    SELECT full_path, modified, root, parent_folder, filename, size, cover_entry,
           title, year, month, day, writer, genre, tags, web,
           series, format, page_count
    FROM comics
  `),

  deleteComicByPath: database.prepare(`
    DELETE FROM comics
    WHERE full_path = ?
  `),

  markComicThumbnailGenerated: database.prepare(`
    UPDATE comics
    SET thumbnail_generated = 1
    WHERE id = ?
  `),
};

function beginTransaction() {
  database.exec("BEGIN");
}

function commitTransaction() {
  database.exec("COMMIT");
}

function rollbackTransaction() {
  database.exec("ROLLBACK");
}

function clearFiles() {
  statements.clearFiles.run();
}

function insertFile(file) {
  statements.insertFile.run(
    file.root,
    file.parentFolder,
    file.fullPath,
    file.filename,
    file.extension,
    file.type,
    file.size,
    file.modified,
  );
}

function getFileCount() {
  return statements.countFiles.get().count;
}

function listMediaFiles() {
  return statements.listMediaFiles.all();
}

function listAllFiles() {
  return statements.listAllFiles.all();
}

function searchFiles(searchTerm) {
  return statements.searchFiles.all(`%${searchTerm}%`);
}

function findFileForStreaming(id) {
  return statements.findFileForStreaming.get(id);
}

function findFileForThumbnail(id) {
  return statements.findFileForThumbnail.get(id);
}

function markThumbnailGenerated(id) {
  statements.markThumbnailGenerated.run(id);
}

function insertComic(comic) {
  statements.insertComic.run(
    comic.root,
    comic.parentFolder,
    comic.fullPath,
    comic.filename,
    comic.size,
    comic.modified,
    comic.coverEntry ?? null,
    comic.title ?? null,
    comic.year ?? null,
    comic.month ?? null,
    comic.day ?? null,
    comic.writer ?? null,
    comic.genre ?? null,
    comic.tags ?? null,
    comic.web ?? null,
    comic.series ?? null,
    comic.format ?? null,
    comic.pageCount ?? null,
  );
}

function clearComics() {
  statements.clearComics.run();
}

function listComics() {
  return statements.listComics.all();
}

function findComicById(id) {
  return statements.findComicById.get(id);
}

function markComicThumbnailGenerated(id) {
  statements.markComicThumbnailGenerated.run(id);
}

function getExistingComics() {
  return statements.getExistingComics.all();
}

function deleteComicByPath(fullPath) {
  statements.deleteComicByPath.run(fullPath);
}

module.exports = {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  clearFiles,
  insertFile,
  getFileCount,
  listMediaFiles,
  listAllFiles,
  searchFiles,
  findFileForStreaming,
  findFileForThumbnail,
  markThumbnailGenerated,
  insertComic,
  clearComics,
  listComics,
  findComicById,
  markComicThumbnailGenerated,
  getExistingComics,
  deleteComicByPath,
};
