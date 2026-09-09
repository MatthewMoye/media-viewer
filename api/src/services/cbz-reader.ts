import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { config } from "../config.js";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]);

function isImageEntry(entryName) {
  return IMAGE_EXTENSIONS.has(path.extname(entryName).toLowerCase());
}

function sanitizeFilename(entryName) {
  // Flatten subdirectory paths and sanitize characters
  return entryName.replace(/[/\\]+/g, "__").replace(/[^a-zA-Z0-9._\-()[\] ]/g, "_");
}

function getComicCacheDir(comicId) {
  return path.join(config.comicCachePath, String(comicId));
}

function clearComicCache() {
  fs.rmSync(config.comicCachePath, { recursive: true, force: true });
  fs.mkdirSync(config.comicCachePath, { recursive: true });
}

const STALE_CACHE_MS = 60 * 60 * 1000;

// Cache dir mtime doubles as a "last retrieved" timestamp.
function touchComicCache(cacheDir) {
  const now = new Date();
  fs.utimesSync(cacheDir, now, now);
}

function pruneStaleComicCache(maxAgeMs = STALE_CACHE_MS) {
  if (!fs.existsSync(config.comicCachePath)) {
    return;
  }

  const now = Date.now();

  for (const entry of fs.readdirSync(config.comicCachePath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const dirPath = path.join(config.comicCachePath, entry.name);
    const { mtimeMs } = fs.statSync(dirPath);

    if (now - mtimeMs > maxAgeMs) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
}

function getSortedPages(cacheDir) {
  return fs
    .readdirSync(cacheDir)
    .filter((f) => isImageEntry(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

function ensureComicCache(comicId, cbzPath) {
  const cacheDir = getComicCacheDir(comicId);

  if (fs.existsSync(cacheDir)) {
    const pages = getSortedPages(cacheDir);
    if (pages.length > 0) {
      touchComicCache(cacheDir);
      return pages;
    }
  }

  fs.mkdirSync(cacheDir, { recursive: true });

  const zip = new AdmZip(cbzPath);
  const entries = zip.getEntries();

  const imageEntries = entries.filter((e) => !e.isDirectory && isImageEntry(e.entryName));

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

export {
  ensureComicCache,
  getComicCacheDir,
  clearComicCache,
  pruneStaleComicCache,
  touchComicCache,
};
