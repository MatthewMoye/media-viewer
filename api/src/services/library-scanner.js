const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  getExistingFiles,
  deleteFileByPath,
  insertFile,
  getFileCount,
  listThumbnailCandidates,
  listComicThumbnailCandidates,
} = require("../database/media-database");
const { listMediaRoots, listComicRoots } = require("./root-manager");
const { scanDirectory } = require("./scanners/media-scan");
const { rescanComics } = require("./scanners/comic-scan");
const { queueThumbnailWarmupBatch } = require("./thumbnail-service");
const { queueCbzThumbnailWarmupBatch } = require("./cbz-thumbnail-service");

function startThumbnailWarmup() {
  const mediaCandidates = listThumbnailCandidates();
  const mediaQueued = queueThumbnailWarmupBatch(mediaCandidates);
  const comicCandidates = listComicThumbnailCandidates();
  const comicsQueued = queueCbzThumbnailWarmupBatch(comicCandidates);

  console.log(
    `✓ Thumbnail warmup queued media ${mediaQueued}/${mediaCandidates.length}, comics ${comicsQueued}/${comicCandidates.length} (background, media-first priority).`,
  );
}

function rescanLibrary() {
  console.log("Scanning media library...");

  beginTransaction();

  try {
    const existingFiles = getExistingFiles();
    const existingFilesMap = new Map(
      existingFiles.map((file) => [file.full_path, file]),
    );
    const scannedPaths = new Set();
    let unchangedMediaFiles = 0;
    let changedOrNewMediaFiles = 0;

    const mediaStart = Date.now();
    for (const root of listMediaRoots()) {
      console.log(`Scanning root "${root.name}": ${root.path}`);
      const scannedFiles = scanDirectory(
        root.name,
        root.path,
        null,
        existingFilesMap,
      );

      for (const file of scannedFiles) {
        scannedPaths.add(file.fullPath);

        if (file.fullyScanned) {
          insertFile(file);
          changedOrNewMediaFiles += 1;
        } else {
          unchangedMediaFiles += 1;
        }
      }
    }

    let deletedMediaFiles = 0;
    for (const fullPath of existingFilesMap.keys()) {
      if (!scannedPaths.has(fullPath)) {
        deleteFileByPath(fullPath);
        deletedMediaFiles += 1;
      }
    }

    const mediaDuration = Date.now() - mediaStart;
    console.log(
      `✓ Media scan completed in ${mediaDuration}ms (${changedOrNewMediaFiles} changed/new, ${unchangedMediaFiles} unchanged, ${deletedMediaFiles} removed)`,
    );

    const cbzStart = Date.now();
    const comicScanResult = rescanComics(listComicRoots());

    const cbzDuration = Date.now() - cbzStart;
    console.log(
      `✓ CBZ scan completed in ${cbzDuration}ms (${comicScanResult.total} files, ${comicScanResult.skipped} skipped, ${comicScanResult.rescanned} rescanned)`
    );

    commitTransaction();
  } catch (error) {
    rollbackTransaction();
    throw error;
  }

  const fileCount = getFileCount();

  startThumbnailWarmup();

  return fileCount;
}

module.exports = {
  rescanLibrary,
};
