import {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  getExistingFiles,
  deleteFileByPath,
  insertFile,
  getFileCount,
  listThumbnailCandidates,
  listComicThumbnailCandidates,
} from "../database/media-database.js";
import { listMediaRoots, listComicRoots } from "./root-manager.js";
import { scanDirectory } from "./scanners/media-scan.js";
import { rescanComics } from "./scanners/comic-scan.js";
import { queueThumbnailWarmupBatch } from "./thumbnail-service.js";
import { queueCbzThumbnailWarmupBatch } from "./cbz-thumbnail-service.js";

const rescanState = {
  running: false,
  queued: false,
  runCount: 0,
  lastStartedAt: null as string | null,
  lastFinishedAt: null as string | null,
  lastError: null as string | null,
  lastFileCount: null as number | null,
};

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
    const existingFilesMap = new Map(existingFiles.map((file) => [file.full_path, file]));
    const scannedPaths = new Set();
    let unchangedMediaFiles = 0;
    let changedOrNewMediaFiles = 0;

    const mediaStart = Date.now();
    for (const root of listMediaRoots()) {
      console.log(`Scanning root "${root.name}": ${root.path}`);
      const scannedFiles = scanDirectory(root.name, root.path, null, existingFilesMap);

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
      `✓ CBZ scan completed in ${cbzDuration}ms (${comicScanResult.total} files, ${comicScanResult.skipped} skipped, ${comicScanResult.rescanned} rescanned)`,
    );

    commitTransaction();
  } catch (error) {
    rollbackTransaction();
    throw error;
  }

  const rawFileCount = getFileCount();
  const fileCount = Number(rawFileCount);

  startThumbnailWarmup();

  return Number.isFinite(fileCount) ? fileCount : 0;
}

function runRescanLoop() {
  if (rescanState.running) {
    return;
  }

  rescanState.running = true;

  setImmediate(() => {
    try {
      do {
        rescanState.queued = false;
        rescanState.runCount += 1;
        rescanState.lastStartedAt = new Date().toISOString();
        rescanState.lastError = null;

        try {
          const fileCount = rescanLibrary();
          rescanState.lastFileCount = fileCount;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          rescanState.lastError = message;
          console.error("Library rescan failed:", error);
        } finally {
          rescanState.lastFinishedAt = new Date().toISOString();
        }
      } while (rescanState.queued);
    } finally {
      rescanState.running = false;
    }
  });
}

function requestLibraryRescan() {
  if (rescanState.running) {
    rescanState.queued = true;
    return {
      accepted: true,
      queued: true,
      running: true,
    };
  }

  runRescanLoop();

  return {
    accepted: true,
    queued: false,
    running: false,
  };
}

function getLibraryRescanStatus() {
  return {
    running: rescanState.running,
    queued: rescanState.queued,
    runCount: rescanState.runCount,
    lastStartedAt: rescanState.lastStartedAt,
    lastFinishedAt: rescanState.lastFinishedAt,
    lastError: rescanState.lastError,
    lastFileCount: rescanState.lastFileCount,
  };
}

export { rescanLibrary, requestLibraryRescan, getLibraryRescanStatus };
