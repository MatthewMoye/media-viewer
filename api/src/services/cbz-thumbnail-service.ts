import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import sharp from "sharp";
import { config } from "../config.js";
import { markComicThumbnailGenerated } from "../database/media-database.js";
import { enqueueJob, getThumbnailJobQueueStatus } from "./thumbnail-job-queue.js";

const COMIC_REQUEST_PRIORITY = 350;
const COMIC_WARMUP_PRIORITY = 100;

fs.mkdirSync(config.thumbnailsPath, { recursive: true });

function getCbzThumbnailPath(comicId) {
  return path.join(config.thumbnailsPath, `comic-${comicId}.jpg`);
}

async function ensureCbzThumbnail(comicId, cbzPath, coverEntry) {
  const thumbnailPath = getCbzThumbnailPath(comicId);

  if (fs.existsSync(thumbnailPath)) {
    return thumbnailPath;
  }

  const zip = new AdmZip(cbzPath);
  const entry = zip.getEntry(coverEntry);

  if (!entry) {
    throw new Error(`Cover entry "${coverEntry}" not found in ${cbzPath}`);
  }

  const imageBuffer = entry.getData();

  await sharp(imageBuffer)
    .resize(320, undefined, { withoutEnlargement: true, fit: "inside" })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  markComicThumbnailGenerated(comicId);

  return thumbnailPath;
}

function queueCbzThumbnailJob(comicId, cbzPath, coverEntry, priority) {
  const thumbnailPath = getCbzThumbnailPath(comicId);

  if (fs.existsSync(thumbnailPath)) {
    return Promise.resolve(thumbnailPath);
  }

  return enqueueJob({
    jobKey: `comic:${comicId}`,
    group: "comics",
    priority,
    run: () => ensureCbzThumbnail(comicId, cbzPath, coverEntry),
  });
}

function queueCbzThumbnailRequest(comicId, cbzPath, coverEntry) {
  return queueCbzThumbnailJob(comicId, cbzPath, coverEntry, COMIC_REQUEST_PRIORITY);
}

function queueCbzThumbnailWarmup(comicId, cbzPath, coverEntry) {
  return queueCbzThumbnailJob(comicId, cbzPath, coverEntry, COMIC_WARMUP_PRIORITY);
}

function queueCbzThumbnailWarmupBatch(items) {
  let queued = 0;

  for (const item of items) {
    if (!item.cover_entry) {
      continue;
    }

    const thumbnailPath = getCbzThumbnailPath(item.id);
    if (fs.existsSync(thumbnailPath)) {
      continue;
    }

    queueCbzThumbnailWarmup(item.id, item.full_path, item.cover_entry).catch((error) => {
      console.error(`Comic thumbnail warmup failed for comic ${item.id}:`, error.message);
    });

    queued += 1;
  }

  return queued;
}

function getCbzThumbnailQueueStatus() {
  const queueStatus = getThumbnailJobQueueStatus();
  const comicGroupStatus = queueStatus.groups.comics || {
    pending: 0,
    running: 0,
  };

  return {
    comicsPending: comicGroupStatus.pending,
    comicsRunning: comicGroupStatus.running,
  };
}

export {
  getCbzThumbnailPath,
  ensureCbzThumbnail,
  queueCbzThumbnailRequest,
  queueCbzThumbnailWarmup,
  queueCbzThumbnailWarmupBatch,
  getCbzThumbnailQueueStatus,
};
