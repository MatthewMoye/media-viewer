import express from "express";
import fs from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import {
  findFileForStreaming,
  findFileForThumbnail,
  listThumbnailCandidates,
} from "../database/media-database.js";
import {
  getThumbnailPath,
  queueThumbnailRequest,
  queueThumbnailWarmupBatch,
  getThumbnailQueueStatus,
} from "../services/thumbnail-service.js";
import { getMimeType } from "../utils/media-types.js";
import { requireExistingPath, sendNotFound } from "./helpers/file-response.js";

const mediaRouter = express.Router();

function ensureStringPath(value: unknown) {
  return typeof value === "string" ? value : null;
}

function createEtag(stats) {
  return `W/"${stats.size}-${Math.floor(stats.mtimeMs)}"`;
}

function setValidationHeaders(response, stats) {
  response.setHeader("ETag", createEtag(stats));
  response.setHeader("Last-Modified", new Date(stats.mtimeMs).toUTCString());
}

function isFresh(request, stats) {
  const requestEtag = request.headers["if-none-match"];
  const currentEtag = createEtag(stats);

  if (typeof requestEtag === "string" && requestEtag === currentEtag) {
    return true;
  }

  const modifiedSince = request.headers["if-modified-since"];
  if (typeof modifiedSince === "string") {
    const modifiedSinceTime = Date.parse(modifiedSince);

    if (!Number.isNaN(modifiedSinceTime) && modifiedSinceTime >= stats.mtimeMs) {
      return true;
    }
  }

  return false;
}

function streamEntireFile(response, filePath, fileSize, mimeType) {
  response.writeHead(200, {
    "Content-Length": fileSize,
    "Content-Type": mimeType,
    "Accept-Ranges": "bytes",
  });

  fs.createReadStream(filePath).pipe(response);
}

function parseRange(rangeHeader, fileSize) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);

  if (!match) {
    return null;
  }

  const startText = match[1];
  const endText = match[2];

  if (!startText && !endText) {
    return null;
  }

  let start;
  let end;

  if (!startText) {
    const suffixLength = Number.parseInt(endText, 10);

    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      return null;
    }

    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    start = Number.parseInt(startText, 10);
    end = endText ? Number.parseInt(endText, 10) : fileSize - 1;
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, fileSize - 1),
  };
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

mediaRouter.get("/file/:id", async (request, response, next) => {
  try {
    const file = findFileForStreaming(request.params.id);

    if (!file) {
      sendNotFound(response);
      return;
    }

    const rawFilePath = ensureStringPath(file.full_path);
    if (!rawFilePath) {
      response.status(500).send("Invalid file path");
      return;
    }

    const filePath = path.resolve(rawFilePath);

    if (!(await requireExistingPath(response, filePath))) {
      return;
    }

    const stats = await stat(filePath);
    const fileSize = stats.size;
    const mimeType = getMimeType(file.extension);
    const rangeHeader = request.headers.range;

    response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    setValidationHeaders(response, stats);

    if (!rangeHeader && isFresh(request, stats)) {
      response.status(304).end();
      return;
    }

    if (!rangeHeader) {
      streamEntireFile(response, filePath, fileSize, mimeType);
      return;
    }

    const range = parseRange(rangeHeader, fileSize);

    if (!range) {
      response.status(416);
      response.setHeader("Content-Range", `bytes */${fileSize}`);
      response.end();
      return;
    }

    const chunkSize = range.end - range.start + 1;

    response.writeHead(206, {
      "Content-Range": `bytes ${range.start}-${range.end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
    });

    fs.createReadStream(filePath, {
      start: range.start,
      end: range.end,
    }).pipe(response);
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/thumbnail/:id", async (request, response, next) => {
  try {
    const file = findFileForThumbnail(request.params.id);

    if (!file) {
      sendNotFound(response);
      return;
    }

    if (file.type !== "video" && file.type !== "image") {
      response.status(400).send("Thumbnails are only available for images and videos");
      return;
    }

    const rawFilePath = ensureStringPath(file.full_path);
    if (!rawFilePath) {
      response.status(500).send("Invalid file path");
      return;
    }

    const filePath = path.resolve(rawFilePath);

    if (!(await requireExistingPath(response, filePath))) {
      return;
    }

    let thumbnailPath = getThumbnailPath(file.id);

    if (!(await pathExists(thumbnailPath))) {
      thumbnailPath = await queueThumbnailRequest(file.id, filePath, file.type);
    }

    if (!(await requireExistingPath(response, thumbnailPath, "Thumbnail not found"))) {
      return;
    }

    const thumbnailStats = await stat(thumbnailPath);

    response.setHeader("Content-Type", "image/webp");
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    setValidationHeaders(response, thumbnailStats);

    if (isFresh(request, thumbnailStats)) {
      response.status(304).end();
      return;
    }

    fs.createReadStream(thumbnailPath).pipe(response);
  } catch (error) {
    next(error);
  }
});

mediaRouter.post("/api/thumbnails/warmup", (request, response) => {
  const candidates = listThumbnailCandidates();
  const queued = queueThumbnailWarmupBatch(candidates);

  response.json({
    candidates: candidates.length,
    queued,
    queue: getThumbnailQueueStatus(),
  });
});

mediaRouter.get("/api/thumbnails/warmup/status", (request, response) => {
  response.json(getThumbnailQueueStatus());
});

export { mediaRouter };
