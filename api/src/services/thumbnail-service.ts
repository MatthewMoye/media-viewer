import fs from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import sharp from "sharp";
import { config } from "../config.js";
import { markThumbnailGenerated } from "../database/media-database.js";
import { enqueueJob, getThumbnailJobQueueStatus } from "./thumbnail-job-queue.js";

const THUMBNAIL_WIDTH = 480;
const MEDIA_REQUEST_PRIORITY = 400;
const MEDIA_WARMUP_PRIORITY = 300;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

fs.mkdirSync(config.thumbnailsPath, {
  recursive: true,
});

function getThumbnailPath(fileId) {
  return path.join(config.thumbnailsPath, `${fileId}.webp`);
}

function getTemporaryThumbnailPath(fileId) {
  return path.join(config.thumbnailsPath, `${fileId}-temporary.webp`);
}

function getTemporaryFramePath(fileId) {
  return path.join(config.thumbnailsPath, `${fileId}-frame.jpg`);
}

function createThumbnailFailureError(filePath) {
  return new Error(`Failed to create thumbnail for file: ${filePath}`);
}

async function buildWebpThumbnail(sourcePath, targetPath) {
  await sharp(sourcePath)
    .rotate()
    .resize(THUMBNAIL_WIDTH, undefined, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({
      quality: 78,
      effort: 4,
    })
    .toFile(targetPath);
}

async function generateImageThumbnail(fileId, filePath) {
  const thumbnailPath = getThumbnailPath(fileId);
  const temporaryPath = getTemporaryThumbnailPath(fileId);

  if (fs.existsSync(thumbnailPath)) {
    return thumbnailPath;
  }

  try {
    await buildWebpThumbnail(filePath, temporaryPath);
    fs.renameSync(temporaryPath, thumbnailPath);
    return thumbnailPath;
  } catch {
    fs.rmSync(temporaryPath, {
      force: true,
    });
    throw createThumbnailFailureError(filePath);
  }
}

function generateVideoThumbnail(fileId, filePath) {
  const thumbnailPath = getThumbnailPath(fileId);
  const temporaryPath = getTemporaryThumbnailPath(fileId);
  const framePath = getTemporaryFramePath(fileId);

  if (fs.existsSync(thumbnailPath)) {
    return Promise.resolve(thumbnailPath);
  }

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on("error", () => {
        fs.rmSync(framePath, { force: true });
        fs.rmSync(temporaryPath, { force: true });
        reject(createThumbnailFailureError(filePath));
      })
      .on("end", async () => {
        try {
          await buildWebpThumbnail(framePath, temporaryPath);
          fs.renameSync(temporaryPath, thumbnailPath);
          fs.rmSync(framePath, { force: true });
          resolve(thumbnailPath);
        } catch {
          fs.rmSync(framePath, { force: true });
          fs.rmSync(temporaryPath, { force: true });
          reject(createThumbnailFailureError(filePath));
        }
      })
      .screenshots({
        count: 1,
        filename: path.basename(framePath),
        folder: config.thumbnailsPath,
      });
  });
}

async function ensureThumbnail(fileId, filePath, mediaType) {
  const thumbnailPath =
    mediaType === "video"
      ? await generateVideoThumbnail(fileId, filePath)
      : await generateImageThumbnail(fileId, filePath);

  markThumbnailGenerated(fileId);

  return thumbnailPath;
}

function queueThumbnailJob(fileId, filePath, mediaType, priority) {
  const thumbnailPath = getThumbnailPath(fileId);

  if (fs.existsSync(thumbnailPath)) {
    return Promise.resolve(thumbnailPath);
  }

  return enqueueJob({
    jobKey: `media:${fileId}`,
    group: "media",
    priority,
    run: () => ensureThumbnail(fileId, filePath, mediaType),
  });
}

function queueThumbnailRequest(fileId, filePath, mediaType) {
  return queueThumbnailJob(fileId, filePath, mediaType, MEDIA_REQUEST_PRIORITY);
}

function queueThumbnailWarmup(fileId, filePath, mediaType) {
  return queueThumbnailJob(fileId, filePath, mediaType, MEDIA_WARMUP_PRIORITY);
}

function queueThumbnailWarmupBatch(items) {
  let queued = 0;

  for (const item of items) {
    if (item.type !== "image" && item.type !== "video") {
      continue;
    }

    const thumbnailPath = getThumbnailPath(item.id);
    if (fs.existsSync(thumbnailPath)) {
      continue;
    }

    queueThumbnailWarmup(item.id, item.full_path, item.type).catch((error) => {
      console.error(`Thumbnail warmup failed for file ${item.id}:`, error.message);
    });

    queued += 1;
  }

  return queued;
}

function getThumbnailQueueStatus() {
  const queueStatus = getThumbnailJobQueueStatus();
  const mediaGroupStatus = queueStatus.groups.media || { pending: 0, running: 0 };

  return {
    activeWorkers: queueStatus.activeWorkers,
    mediaPending: mediaGroupStatus.pending,
    mediaRunning: mediaGroupStatus.running,
    totalPending: queueStatus.pendingJobs,
    totalTrackedJobs: queueStatus.trackedJobs,
    maxConcurrentWorkers: queueStatus.maxConcurrentWorkers,
  };
}

export {
  getThumbnailPath,
  queueThumbnailRequest,
  queueThumbnailWarmup,
  queueThumbnailWarmupBatch,
  getThumbnailQueueStatus,
  ensureThumbnail,
};
