import express from "express";
import fs from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import {
  listComics,
  listComicAuthors,
  listComicTagSources,
  findComicById,
  listComicThumbnailCandidates,
} from "../database/media-database.js";
import {
  getCbzThumbnailPath,
  queueCbzThumbnailRequest,
  queueCbzThumbnailWarmupBatch,
  getCbzThumbnailQueueStatus,
} from "../services/cbz-thumbnail-service.js";
import { ensureComicCache, getComicCacheDir } from "../services/cbz-reader.js";
import { buildComicTagFacets } from "../services/comics-facets.js";
import { parseIdParam } from "./helpers/request-validators.js";
import { requireExistingPath, sendNotFound } from "./helpers/file-response.js";
import { getMimeType } from "../utils/media-types.js";

const comicsRouter = express.Router();

function ensureStringPath(value: unknown) {
  return typeof value === "string" ? value : null;
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

    if (!(await pathExists(thumbnailPath))) {
      if (!comic.cover_entry) {
        response.status(404).send("No cover image in this CBZ");
        return;
      }

      const rawComicPath = ensureStringPath(comic.full_path);
      if (!rawComicPath) {
        response.status(500).send("Invalid comic path");
        return;
      }

      const cbzPath = path.resolve(rawComicPath);

      if (!(await requireExistingPath(response, cbzPath))) {
        return;
      }

      await queueCbzThumbnailRequest(comic.id, cbzPath, comic.cover_entry);
    }

    if (!(await pathExists(thumbnailPath))) {
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

comicsRouter.post("/api/comics/thumbnails/warmup", (request, response) => {
  const candidates = listComicThumbnailCandidates();
  const queued = queueCbzThumbnailWarmupBatch(candidates);

  response.json({
    candidates: candidates.length,
    queued,
    queue: getCbzThumbnailQueueStatus(),
  });
});

comicsRouter.get("/api/comics/thumbnails/warmup/status", (request, response) => {
  response.json(getCbzThumbnailQueueStatus());
});

comicsRouter.get("/api/comics/:id/pages", async (request, response, next) => {
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

    const rawComicPath = ensureStringPath(comic.full_path);
    if (!rawComicPath) {
      response.status(500).send("Invalid comic path");
      return;
    }

    const cbzPath = path.resolve(rawComicPath);

    if (!(await requireExistingPath(response, cbzPath))) {
      return;
    }

    const pages = ensureComicCache(comicId, cbzPath);
    const pageUrls = pages.map(
      (filename) => `/comic-page/${comicId}/${encodeURIComponent(filename)}`,
    );

    response.json({ pages: pageUrls });
  } catch (error) {
    next(error);
  }
});

comicsRouter.get("/comic-page/:id/:filename", async (request, response) => {
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

  if (!(await requireExistingPath(response, filePath, "Page not found"))) {
    return;
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeType = getMimeType(ext);

  response.setHeader("Content-Type", mimeType);
  response.setHeader("Cache-Control", "public, max-age=86400");
  fs.createReadStream(filePath).pipe(response);
});

export { comicsRouter };
