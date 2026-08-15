import { database } from "../db.js";
import { initializeSchema } from "../schema.js";
import {
  normalizePage,
  normalizePageSize,
  normalizeRandomSeed,
  buildOrderBySql,
  buildPaginationResult,
} from "../query/pagination.js";
import { buildComicFilters } from "../query/comic-filters.js";

initializeSchema();

type ListComicsOptions = {
  page?: unknown;
  pageSize?: unknown;
  randomSeed?: unknown;
  search?: unknown;
  author?: unknown;
  tag?: unknown;
};

const statements = {
  insertComic: database.prepare(`
    INSERT INTO comics (
      root, parent_folder, full_path, filename, size, modified, cover_entry,
      title, year, month, day, writer, genre, tags, web,
      series, format, page_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(full_path) DO UPDATE SET
      root = excluded.root,
      parent_folder = excluded.parent_folder,
      filename = excluded.filename,
      size = excluded.size,
      modified = excluded.modified,
      cover_entry = excluded.cover_entry,
      title = excluded.title,
      year = excluded.year,
      month = excluded.month,
      day = excluded.day,
      writer = excluded.writer,
      genre = excluded.genre,
      tags = excluded.tags,
      web = excluded.web,
      series = excluded.series,
      format = excluded.format,
      page_count = excluded.page_count,
      thumbnail_generated = CASE
        WHEN excluded.modified != comics.modified
          OR excluded.size != comics.size
          OR IFNULL(excluded.cover_entry, '') != IFNULL(comics.cover_entry, '')
        THEN 0
        ELSE comics.thumbnail_generated
      END
  `),

  clearComics: database.prepare(`
    DELETE FROM comics
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

  listComicThumbnailCandidates: database.prepare(`
    SELECT id, full_path, cover_entry
    FROM comics
    WHERE thumbnail_generated = 0
      AND cover_entry IS NOT NULL
      AND TRIM(cover_entry) <> ''
    ORDER BY id ASC
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

function listComics(options: ListComicsOptions = {}) {
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

  const listStatement = database.prepare(`
    SELECT id, root, parent_folder, filename, size, modified,
           thumbnail_generated, cover_entry, title, year, month, day,
           writer, genre, tags, web,
           series, format, page_count
    FROM comics
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

function listComicThumbnailCandidates() {
  return statements.listComicThumbnailCandidates.all();
}

function getExistingComics() {
  return statements.getExistingComics.all();
}

function deleteComicByPath(fullPath) {
  statements.deleteComicByPath.run(fullPath);
}

export {
  insertComic,
  clearComics,
  listComics,
  listComicAuthors,
  listComicTagSources,
  findComicById,
  markComicThumbnailGenerated,
  listComicThumbnailCandidates,
  getExistingComics,
  deleteComicByPath,
};
