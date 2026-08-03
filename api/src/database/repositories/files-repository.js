const { database } = require("../db");
const {
  normalizePage,
  normalizePageSize,
  normalizeRandomSeed,
  buildOrderBySql,
  buildPaginationResult,
} = require("../query/pagination");
const { buildMediaFilters } = require("../query/media-filters");

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

  listMediaFolders: database.prepare(`
    SELECT parent_folder, COUNT(*) AS count
    FROM files
    WHERE type IN ('image', 'video')
    GROUP BY parent_folder
    ORDER BY parent_folder COLLATE NOCASE ASC
  `),
};

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

function listMediaFiles(options = {}) {
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
    ${buildOrderBySql(randomSeed)}
    LIMIT ? OFFSET ?
  `);

  const listParams =
    randomSeed === null
      ? [...params, pageSize, offset]
      : [...params, randomSeed, pageSize, offset];

  return {
    items: listStatement.all(...listParams),
    ...buildPaginationResult(totalCount, page, pageSize),
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

function listMediaFolders() {
  return statements.listMediaFolders.all();
}

module.exports = {
  clearFiles,
  insertFile,
  getFileCount,
  listMediaFiles,
  listAllFiles,
  searchFiles,
  findFileForStreaming,
  findFileForThumbnail,
  markThumbnailGenerated,
  listMediaFolders,
};
