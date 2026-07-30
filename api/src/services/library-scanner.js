const fs = require("node:fs");
const path = require("node:path");
const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  clearFiles,
  insertFile,
  getFileCount,
  clearComics,
  insertComic,
  getExistingComics,
  deleteComicByPath,
} = require("../database/media-database");
const { getMediaType } = require("../utils/media-types");
const { scanCbzDirectory } = require("./cbz-scanner");
const { listMediaRoots, listComicRoots } = require("./root-manager");

function scanDirectory(rootName, directory, parentFolder = null) {
  if (!fs.existsSync(directory)) {
    console.warn(`Media directory does not exist: ${directory}`);
    return;
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nextParentFolder = parentFolder || entry.name;

      scanDirectory(rootName, fullPath, nextParentFolder);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    let stats;

    try {
      stats = fs.statSync(fullPath);
    } catch (error) {
      console.warn(
        `Could not read file information for ${fullPath}:`,
        error.message,
      );
      continue;
    }

    const extension = path.extname(entry.name);

    insertFile({
      root: rootName,
      parentFolder: parentFolder || "",
      fullPath,
      filename: entry.name,
      extension,
      type: getMediaType(extension),
      size: stats.size,
      modified: stats.mtimeMs,
    });
  }
}

function rescanLibrary() {
  console.log("Scanning media library...");

  beginTransaction();

  try {
    clearFiles();

    const mediaStart = Date.now();
    for (const root of listMediaRoots()) {
      console.log(`Scanning root "${root.name}": ${root.path}`);
      scanDirectory(root.name, root.path);
    }
    const mediaDuration = Date.now() - mediaStart;
    console.log(`✓ Media scan completed in ${mediaDuration}ms`);

    // Get existing comics for incremental scan
    const existingComics = getExistingComics();
    const existingComicsMap = new Map(
      existingComics.map((comic) => [comic.full_path, comic])
    );

    const cbzStart = Date.now();
    const allComics = [];
    const scannedPaths = new Set();
    let skipped = 0;

    for (const root of listComicRoots()) {
      console.log(`Scanning CBZ root "${root.name}": ${root.path}`);
      const comics = scanCbzDirectory(root.name, root.path, null, existingComicsMap);
      
      for (const comic of comics) {
        allComics.push(comic);
        scannedPaths.add(comic.fullPath);
        if (!comic.fullyScanned) {
          skipped++;
        }
      }
    }

    // Delete comics that no longer exist on disk
    for (const fullPath of existingComicsMap.keys()) {
      if (!scannedPaths.has(fullPath)) {
        deleteComicByPath(fullPath);
      }
    }

    // Insert all comics (updated or unchanged)
    for (const comic of allComics) {
      insertComic(comic);
    }

    const cbzDuration = Date.now() - cbzStart;
    const rescanned = allComics.length - skipped;
    console.log(
      `✓ CBZ scan completed in ${cbzDuration}ms (${allComics.length} files, ${skipped} skipped, ${rescanned} rescanned)`
    );

    commitTransaction();
  } catch (error) {
    rollbackTransaction();
    throw error;
  }

  const fileCount = getFileCount();

  console.log(`✓ Indexed ${fileCount} files total.`);

  return fileCount;
}

module.exports = {
  rescanLibrary,
};
