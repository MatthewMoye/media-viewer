const fs = require("node:fs");
const path = require("node:path");
const AdmZip = require("adm-zip");
const sharp = require("sharp");
const { config } = require("../config");
const { markComicThumbnailGenerated } = require("../database/media-database");

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

module.exports = { getCbzThumbnailPath, ensureCbzThumbnail };
