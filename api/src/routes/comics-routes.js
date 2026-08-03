const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const {
  listComics,
  listComicAuthors,
  listComicTagSources,
  findComicById,
} = require("../database/media-database");
const {
  getCbzThumbnailPath,
  ensureCbzThumbnail,
} = require("../services/cbz-thumbnail-service");
const { ensureComicCache, getComicCacheDir } = require("../services/cbz-reader");
const { buildComicTagFacets } = require("../services/comics-facets");
const { parseIdParam } = require("./helpers/request-validators");
const { requireExistingPath, sendNotFound } = require("./helpers/file-response");
const { getMimeType } = require("../utils/media-types");

const comicsRouter = express.Router();

comicsRouter.get("/api/comics", (request, response) => {
  const result = listComics({
    page: request.query.page,
    pageSize: request.query.pageSize,
    search: request.query.search,
    author: request.query.author,
    tag: request.query.tag,
    randomSeed: request.query.randomSeed,
  });

  const authors = listComicAuthors().map((entry) => [entry.author, entry.count]);
  const tags = buildComicTagFacets(listComicTagSources());

  response.json({
    ...result,
    authors,
    tags,
  });
});

comicsRouter.get("/comic-thumbnail/:id", async (request, response, next) => {
  try {
    const comic = findComicById(request.params.id);

    if (!comic) {
      sendNotFound(response);
      return;
    }

    const thumbnailPath = getCbzThumbnailPath(comic.id);

    if (!fs.existsSync(thumbnailPath)) {
      if (!comic.cover_entry) {
        response.status(404).send("No cover image in this CBZ");
        return;
      }

      const cbzPath = path.resolve(comic.full_path);

      if (!requireExistingPath(response, cbzPath)) {
        return;
      }

      await ensureCbzThumbnail(comic.id, cbzPath, comic.cover_entry);
    }

    if (!fs.existsSync(thumbnailPath)) {
      response.status(404).send("Thumbnail generation failed");
      return;
    }

    response.setHeader("Content-Type", "image/jpeg");
    response.setHeader("Cache-Control", "public, max-age=86400");
    fs.createReadStream(thumbnailPath).pipe(response);
  } catch (error) {
    next(error);
  }
});

comicsRouter.get("/api/comics/:id/pages", (request, response, next) => {
  try {
    const comicId = parseIdParam(request, response);

    if (comicId === null) {
      return;
    }

    const comic = findComicById(comicId);

    if (!comic) {
      sendNotFound(response);
      return;
    }

    const cbzPath = path.resolve(comic.full_path);

    if (!requireExistingPath(response, cbzPath)) {
      return;
    }

    const pages = ensureComicCache(comicId, cbzPath);
    const pageUrls = pages.map(
      (filename) =>
        `/comic-page/${comicId}/${encodeURIComponent(filename)}`,
    );

    response.json({ pages: pageUrls });
  } catch (error) {
    next(error);
  }
});

comicsRouter.get("/comic-page/:id/:filename", (request, response) => {
  const comicId = parseIdParam(request, response);

  if (comicId === null) {
    return;
  }

  const filename = path.basename(decodeURIComponent(request.params.filename));
  const cacheDir = getComicCacheDir(comicId);
  const filePath = path.join(cacheDir, filename);

  const resolvedFile = path.resolve(filePath);
  const resolvedCache = path.resolve(cacheDir);

  if (!resolvedFile.startsWith(resolvedCache + path.sep)) {
    response.status(400).send("Invalid path");
    return;
  }

  if (!requireExistingPath(response, filePath, "Page not found")) {
    return;
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeType = getMimeType(ext);

  response.setHeader("Content-Type", mimeType);
  response.setHeader("Cache-Control", "public, max-age=86400");
  fs.createReadStream(filePath).pipe(response);
});

module.exports = { comicsRouter };

