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

const mediaRouter = express.Router();

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
    response.status(404).send("Not found");
    return;
  }

  const filePath = path.resolve(file.full_path);

  if (!fs.existsSync(filePath)) {
    response.status(404).send("File missing");
    return;
  }

  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  const mimeType = getMimeType(file.extension);
  const rangeHeader = request.headers.range;

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
      response.status(404).send("Not found");
      return;
    }

    if (file.type !== "video") {
      response.status(400).send("Thumbnails are only available for videos");
      return;
    }

    const filePath = path.resolve(file.full_path);

    if (!fs.existsSync(filePath)) {
      response.status(404).send("File missing");
      return;
    }

    let thumbnailPath = getThumbnailPath(file.id);

    if (!fs.existsSync(thumbnailPath)) {
      thumbnailPath = await ensureThumbnail(file.id, filePath);
    }

    if (!fs.existsSync(thumbnailPath)) {
      response.status(404).send("Thumbnail not found");
      return;
    }

    response.setHeader("Content-Type", "image/jpeg");
    response.setHeader("Cache-Control", "public, max-age=86400");

    fs.createReadStream(thumbnailPath).pipe(response);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  mediaRouter,
};
