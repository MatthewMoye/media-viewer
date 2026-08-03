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
    SELECT id, root, parent_folder, filename, size, modified,
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

  listMediaFolders: database.prepare(`
    SELECT parent_folder, COUNT(*) AS count
    FROM files
    WHERE type IN ('image', 'video')
    GROUP BY parent_folder
    ORDER BY parent_folder COLLATE NOCASE ASC
  `),

  listComicAuthors: database.prepare(`
    SELECT
      COALESCE(NULLIF(TRIM(writer), ''), 'Unknown') AS author,
      COUNT(*) AS count
    FROM comics
    GROUP BY COALESCE(NULLIF(TRIM(writer), ''), 'Unknown')
    ORDER BY count DESC, author COLLATE NOCASE ASC
  `),

  listComicTagSources: database.prepare(`
    SELECT tags, genre
    FROM comics
  `),
};

function normalizePage(page) {
  const parsed = Number.parseInt(String(page ?? "1"), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(pageSize) {
  const parsed = Number.parseInt(String(pageSize ?? "30"), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 30;
  }

  return Math.min(parsed, 100);
}

function normalizeRandomSeed(randomSeed) {
  if (randomSeed === undefined || randomSeed === null || randomSeed === "") {
    return null;
  }

  const parsed = Number.parseInt(String(randomSeed), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function buildMediaFilters(options = {}) {
  const conditions = ["type IN ('image', 'video')"];
  const params = [];

  const search = typeof options.search === "string" ? options.search.trim() : "";
  if (search) {
    conditions.push("filename LIKE ?");
    params.push(`%${search}%`);
  }

  if (options.type === "image" || options.type === "video") {
    conditions.push("type = ?");
    params.push(options.type);
  }

  if (
    typeof options.includeFolder === "string" &&
    options.includeFolder.trim() !== "" &&
    options.includeFolder !== "all"
  ) {
    conditions.push("parent_folder = ?");
    params.push(options.includeFolder.trim());
  }

  const excludedFolders = Array.isArray(options.excludeFolders)
    ? options.excludeFolders.filter(
        (folder) => typeof folder === "string" && folder.trim() !== "",
      )
    : [];

  if (excludedFolders.length > 0) {
    const placeholders = excludedFolders.map(() => "?").join(", ");
    conditions.push(`parent_folder NOT IN (${placeholders})`);
    params.push(...excludedFolders);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

function buildComicFilters(options = {}) {
  const conditions = [];
  const params = [];

  const search = typeof options.search === "string" ? options.search.trim() : "";
  if (search) {
    conditions.push("COALESCE(title, filename) LIKE ?");
    params.push(`%${search}%`);
  }

  if (typeof options.author === "string" && options.author.trim() !== "") {
    if (options.author === "Unknown") {
      conditions.push("(writer IS NULL OR TRIM(writer) = '')");
    } else {
      conditions.push("writer = ?");
      params.push(options.author.trim());
    }
  }

  if (typeof options.tag === "string" && options.tag.trim() !== "") {
    conditions.push(
      "((tags IS NOT NULL AND tags LIKE ?) OR (tags IS NULL AND genre IS NOT NULL AND genre LIKE ?))",
    );
    params.push(`%${options.tag.trim()}%`, `%${options.tag.trim()}%`);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

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
  const options =
    arguments.length > 0 && arguments[0] && typeof arguments[0] === "object"
      ? arguments[0]
      : {};
  const page = normalizePage(options.page);
  const pageSize = normalizePageSize(options.pageSize);
  const offset = (page - 1) * pageSize;
  const randomSeed = normalizeRandomSeed(options.randomSeed);
  const { whereSql, params } = buildMediaFilters(options);

  const countStatement = database.prepare(`
    SELECT COUNT(*) AS count
    FROM files
    ${whereSql}
  `);
  const totalCount = countStatement.get(...params).count;

  const orderBySql =
    randomSeed === null
      ? "ORDER BY modified DESC, id DESC"
      : "ORDER BY (((id * 1103515245 + ?) % 2147483647 + 2147483647) % 2147483647) ASC, modified DESC, id DESC";

  const listStatement = database.prepare(`
    SELECT
      id,
      root,
      parent_folder,
      filename,
      extension,
      type,
      size,
      modified,
      thumbnail_generated
    FROM files
    ${whereSql}
    ${orderBySql}
    LIMIT ? OFFSET ?
  `);

  const listParams =
    randomSeed === null
      ? [...params, pageSize, offset]
      : [...params, randomSeed, pageSize, offset];

  return {
    items: listStatement.all(...listParams),
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
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
  const options =
    arguments.length > 0 && arguments[0] && typeof arguments[0] === "object"
      ? arguments[0]
      : {};
  const page = normalizePage(options.page);
  const pageSize = normalizePageSize(options.pageSize);
  const offset = (page - 1) * pageSize;
  const randomSeed = normalizeRandomSeed(options.randomSeed);
  const { whereSql, params } = buildComicFilters(options);

  const countStatement = database.prepare(`
    SELECT COUNT(*) AS count
    FROM comics
    ${whereSql}
  `);
  const totalCount = countStatement.get(...params).count;

  const orderBySql =
    randomSeed === null
      ? "ORDER BY modified DESC, id DESC"
      : "ORDER BY (((id * 1103515245 + ?) % 2147483647 + 2147483647) % 2147483647) ASC, modified DESC, id DESC";

  const listStatement = database.prepare(`
    SELECT id, root, parent_folder, filename, size, modified,
           thumbnail_generated, cover_entry, title, year, month, day,
           writer, genre, tags, web,
           series, format, page_count
    FROM comics
    ${whereSql}
    ${orderBySql}
    LIMIT ? OFFSET ?
  `);

  const listParams =
    randomSeed === null
      ? [...params, pageSize, offset]
      : [...params, randomSeed, pageSize, offset];

  return {
    items: listStatement.all(...listParams),
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

function listMediaFolders() {
  return statements.listMediaFolders.all();
}

function listComicAuthors() {
  return statements.listComicAuthors.all();
}

function listComicTagSources() {
  return statements.listComicTagSources.all();
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
  listMediaFolders,
  listAllFiles,
  searchFiles,
  findFileForStreaming,
  findFileForThumbnail,
  markThumbnailGenerated,
  insertComic,
  clearComics,
  listComics,
  listComicAuthors,
  listComicTagSources,
  findComicById,
  markComicThumbnailGenerated,
  getExistingComics,
  deleteComicByPath,
};
