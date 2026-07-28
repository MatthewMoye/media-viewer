const fs = require("node:fs");
const path = require("node:path");
const AdmZip = require("adm-zip");
const { config } = require("../config");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
]);

function isImageEntry(entryName) {
  return IMAGE_EXTENSIONS.has(path.extname(entryName).toLowerCase());
}

function sanitizeFilename(entryName) {
  // Flatten subdirectory paths and sanitize characters
  return entryName
    .replace(/[/\\]+/g, "__")
    .replace(/[^a-zA-Z0-9._\-()[\] ]/g, "_");
}

function getComicCacheDir(comicId) {
  return path.join(config.comicCachePath, String(comicId));
}

function getSortedPages(cacheDir) {
  return fs
    .readdirSync(cacheDir)
    .filter((f) => isImageEntry(f))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
}

function ensureComicCache(comicId, cbzPath) {
  const cacheDir = getComicCacheDir(comicId);

  if (fs.existsSync(cacheDir)) {
    const pages = getSortedPages(cacheDir);
    if (pages.length > 0) {
      return pages;
    }
  }

  fs.mkdirSync(cacheDir, { recursive: true });

  const zip = new AdmZip(cbzPath);
  const entries = zip.getEntries();

  const imageEntries = entries.filter(
    (e) => !e.isDirectory && isImageEntry(e.entryName),
  );

  const usedFilenames = new Set();

  for (const entry of imageEntries) {
    let filename = sanitizeFilename(entry.entryName);

    // Resolve duplicates
    if (usedFilenames.has(filename)) {
      const ext = path.extname(filename);
      const base = filename.slice(0, -ext.length);
      let counter = 1;
      while (usedFilenames.has(`${base}_${counter}${ext}`)) {
        counter++;
      }
      filename = `${base}_${counter}${ext}`;
    }

    usedFilenames.add(filename);
    fs.writeFileSync(path.join(cacheDir, filename), entry.getData());
  }

  return getSortedPages(cacheDir);
}

module.exports = { ensureComicCache, getComicCacheDir };
