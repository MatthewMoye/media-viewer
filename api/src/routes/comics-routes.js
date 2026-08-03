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
const { config } = require("../config");
const { getMimeType } = require("../utils/media-types");

const comicsRouter = express.Router();

function parseTagList(value) {
  if (!value || typeof value !== "string") return [];

  return value
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      const colonIndex = trimmed.indexOf(":");
      return colonIndex >= 0 ? trimmed.slice(colonIndex + 1).trim() : trimmed;
    })
    .filter(Boolean);
}

function buildComicTagFacets() {
  const rows = listComicTagSources();
  const counts = new Map();

  for (const row of rows) {
    const source = row.tags || row.genre || "";
    const tags = parseTagList(source);

    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

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
  const tags = buildComicTagFacets();

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
      response.status(404).send("Not found");
      return;
    }

    const thumbnailPath = getCbzThumbnailPath(comic.id);

    if (!fs.existsSync(thumbnailPath)) {
      if (!comic.cover_entry) {
        response.status(404).send("No cover image in this CBZ");
        return;
      }

      const cbzPath = path.resolve(comic.full_path);

      if (!fs.existsSync(cbzPath)) {
        response.status(404).send("File missing");
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
    const comicId = Number.parseInt(request.params.id, 10);

    if (!Number.isInteger(comicId) || comicId <= 0) {
      response.status(400).send("Invalid ID");
      return;
    }

    const comic = findComicById(comicId);

    if (!comic) {
      response.status(404).send("Not found");
      return;
    }

    const cbzPath = path.resolve(comic.full_path);

    if (!fs.existsSync(cbzPath)) {
      response.status(404).send("File missing");
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
  const comicId = Number.parseInt(request.params.id, 10);

  if (!Number.isInteger(comicId) || comicId <= 0) {
    response.status(400).send("Invalid ID");
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

  if (!fs.existsSync(filePath)) {
    response.status(404).send("Page not found");
    return;
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeType = getMimeType(ext);

  response.setHeader("Content-Type", mimeType);
  response.setHeader("Cache-Control", "public, max-age=86400");
  fs.createReadStream(filePath).pipe(response);
});

module.exports = { comicsRouter };

