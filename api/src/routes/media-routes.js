const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const {
  findFileForStreaming,
  findFileForThumbnail,
} = require("../database/media-database");
const {
  getThumbnailPath,
  ensureThumbnail,
} = require("../services/thumbnail-service");
const { getMimeType } = require("../utils/media-types");
const { requireExistingPath, sendNotFound } = require("./helpers/file-response");

const mediaRouter = express.Router();

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

mediaRouter.get("/file/:id", (request, response) => {
  const file = findFileForStreaming(request.params.id);

  if (!file) {
    sendNotFound(response);
    return;
  }

  const filePath = path.resolve(file.full_path);

  if (!requireExistingPath(response, filePath)) {
    return;
  }

  const stats = fs.statSync(filePath);
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

    const filePath = path.resolve(file.full_path);

    if (!requireExistingPath(response, filePath)) {
      return;
    }

    let thumbnailPath = getThumbnailPath(file.id);

    if (!fs.existsSync(thumbnailPath)) {
      thumbnailPath = await ensureThumbnail(file.id, filePath, file.type);
    }

    if (!requireExistingPath(response, thumbnailPath, "Thumbnail not found")) {
      return;
    }

    const thumbnailStats = fs.statSync(thumbnailPath);

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

module.exports = {
  mediaRouter,
};
