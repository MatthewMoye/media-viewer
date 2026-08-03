const {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  clearFiles,
  getFileCount,
} = require("../database/media-database");
const { listMediaRoots, listComicRoots } = require("./root-manager");
const { scanDirectory } = require("./scanners/media-scan");
const { rescanComics } = require("./scanners/comic-scan");

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

  console.log(`✓ Indexed ${fileCount} files total.`);

  return fileCount;
}

module.exports = {
  rescanLibrary,
};
