const fs = require("node:fs");
const path = require("node:path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
const sharp = require("sharp");
const { config } = require("../config");
const { markThumbnailGenerated } = require("../database/media-database");

const THUMBNAIL_WIDTH = 480;

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
  } catch (error) {
    fs.rmSync(temporaryPath, {
      force: true,
    });
    throw error;
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
      .on("error", (error) => {
        fs.rmSync(framePath, { force: true });
        fs.rmSync(temporaryPath, { force: true });
        console.error(
          `Failed to generate thumbnail for file ${fileId}:`,
          error.message,
        );

        reject(error);
      })
      .on("end", async () => {
        try {
          await buildWebpThumbnail(framePath, temporaryPath);
          fs.renameSync(temporaryPath, thumbnailPath);
          fs.rmSync(framePath, { force: true });
          resolve(thumbnailPath);
        } catch (error) {
          fs.rmSync(framePath, { force: true });
          fs.rmSync(temporaryPath, { force: true });
          console.error(
            `Failed to resize thumbnail for file ${fileId}:`,
            error.message,
          );

          reject(error);
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

module.exports = {
  getThumbnailPath,
  ensureThumbnail,
};
