const fs = require("node:fs");
const path = require("node:path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
const sharp = require("sharp");
const { config } = require("../config");
const { markThumbnailGenerated } = require("../database/media-database");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

fs.mkdirSync(config.thumbnailsPath, {
  recursive: true,
});

function getThumbnailPath(fileId) {
  return path.join(config.thumbnailsPath, `${fileId}.jpg`);
}

function getTemporaryThumbnailPath(fileId) {
  return path.join(config.thumbnailsPath, `${fileId}-temporary.jpg`);
}

function resizeThumbnail(fileId) {
  const thumbnailPath = getThumbnailPath(fileId);
  const temporaryPath = getTemporaryThumbnailPath(fileId);

  return sharp(thumbnailPath)
    .resize(320, undefined, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .jpeg({
      quality: 80,
    })
    .toFile(temporaryPath)
    .then(() => {
      fs.rmSync(thumbnailPath, {
        force: true,
      });

      fs.renameSync(temporaryPath, thumbnailPath);

      return thumbnailPath;
    })
    .catch((error) => {
      fs.rmSync(temporaryPath, {
        force: true,
      });

      throw error;
    });
}

function generateThumbnail(fileId, filePath) {
  const thumbnailPath = getThumbnailPath(fileId);

  if (fs.existsSync(thumbnailPath)) {
    return Promise.resolve(thumbnailPath);
  }

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on("error", (error) => {
        console.error(
          `Failed to generate thumbnail for file ${fileId}:`,
          error.message,
        );

        reject(error);
      })
      .on("end", async () => {
        try {
          const resizedThumbnail = await resizeThumbnail(fileId);
          resolve(resizedThumbnail);
        } catch (error) {
          console.error(
            `Failed to resize thumbnail for file ${fileId}:`,
            error.message,
          );

          reject(error);
        }
      })
      .screenshots({
        count: 1,
        filename: `${fileId}.jpg`,
        folder: config.thumbnailsPath,
      });
  });
}

async function ensureThumbnail(fileId, filePath) {
  const thumbnailPath = await generateThumbnail(fileId, filePath);

  markThumbnailGenerated(fileId);

  return thumbnailPath;
}

module.exports = {
  getThumbnailPath,
  ensureThumbnail,
};
