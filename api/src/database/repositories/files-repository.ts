import { database } from "../db.js";
import {
  normalizePage,
  normalizePageSize,
  normalizeRandomSeed,
  buildOrderBySql,
  buildPaginationResult,
} from "../query/pagination.js";
import { buildMediaFilters } from "../query/media-filters.js";

type ListMediaFilesOptions = {
  page?: unknown;
  pageSize?: unknown;
  randomSeed?: unknown;
  search?: unknown;
  type?: unknown;
  includeFolder?: unknown;
  excludeFolders?: unknown;
};

const statements = {
  insertFile: database.prepare(`
    INSERT INTO files (
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
    ON CONFLICT(full_path) DO UPDATE SET
      root = excluded.root,
      parent_folder = excluded.parent_folder,
      filename = excluded.filename,
      extension = excluded.extension,
      type = excluded.type,
      size = excluded.size,
      modified = excluded.modified,
      thumbnail_generated = CASE
        WHEN excluded.modified != files.modified
          OR excluded.size != files.size
          OR excluded.extension != files.extension
          OR excluded.type != files.type
        THEN 0
        ELSE files.thumbnail_generated
      END
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

  getExistingFiles: database.prepare(`
    SELECT
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
  `),

  deleteFileByPath: database.prepare(`
    DELETE FROM files
    WHERE full_path = ?
  `),

  listThumbnailCandidates: database.prepare(`
    SELECT
      id,
      full_path,
      type
    FROM files
    WHERE type IN ('image', 'video')
      AND thumbnail_generated = 0
    ORDER BY id ASC
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

function listMediaFiles(options: ListMediaFilesOptions = {}) {
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
    randomSeed === null ? [...params, pageSize, offset] : [...params, randomSeed, pageSize, offset];

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

function getExistingFiles() {
  return statements.getExistingFiles.all();
}

function deleteFileByPath(fullPath) {
  statements.deleteFileByPath.run(fullPath);
}

function listThumbnailCandidates() {
  return statements.listThumbnailCandidates.all();
}

function listMediaFolders() {
  return statements.listMediaFolders.all();
}

export {
  clearFiles,
  insertFile,
  getFileCount,
  listMediaFiles,
  listAllFiles,
  searchFiles,
  findFileForStreaming,
  findFileForThumbnail,
  markThumbnailGenerated,
  getExistingFiles,
  deleteFileByPath,
  listThumbnailCandidates,
  listMediaFolders,
};
