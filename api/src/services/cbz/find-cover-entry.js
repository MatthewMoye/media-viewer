const path = require("node:path");

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

function findCoverEntry(entries) {
  return (
    entries
      .filter((entry) => !entry.isDirectory && isImageEntry(entry.entryName))
      .map((entry) => entry.entryName)
      .sort()[0] ?? null
  );
}

module.exports = {
  findCoverEntry,
};
