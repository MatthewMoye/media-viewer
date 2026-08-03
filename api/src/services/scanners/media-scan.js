const fs = require("node:fs");
const path = require("node:path");
const { insertFile } = require("../../database/media-database");
const { getMediaType } = require("../../utils/media-types");

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

module.exports = {
  scanDirectory,
};
