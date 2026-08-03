const fs = require("node:fs");
const path = require("node:path");
const { getMediaType } = require("../../utils/media-types");

function scanMediaFile(
  rootName,
  parentFolder,
  fullPath,
  stats,
  existingFilesMap = null,
) {
  const normalizedParentFolder = parentFolder || "";

  if (existingFilesMap && existingFilesMap.has(fullPath)) {
    const existing = existingFilesMap.get(fullPath);
    const unchanged =
      existing.root === rootName &&
      existing.parent_folder === normalizedParentFolder &&
      existing.filename === path.basename(fullPath) &&
      existing.modified === stats.mtimeMs &&
      existing.size === stats.size;

    if (unchanged) {
      return {
        root: existing.root,
        parentFolder: existing.parent_folder,
        fullPath: existing.full_path,
        filename: existing.filename,
        extension: existing.extension,
        type: existing.type,
        size: existing.size,
        modified: existing.modified,
        fullyScanned: false,
      };
    }
  }

  const filename = path.basename(fullPath);
  const extension = path.extname(filename);

  return {
    root: rootName,
    parentFolder: normalizedParentFolder,
    fullPath,
    filename,
    extension,
    type: getMediaType(extension),
    size: stats.size,
    modified: stats.mtimeMs,
    fullyScanned: true,
  };
}

function scanDirectory(
  rootName,
  directory,
  parentFolder = null,
  existingFilesMap = null,
) {
  if (!fs.existsSync(directory)) {
    console.warn(`Media directory does not exist: ${directory}`);
    return [];
  }

  const files = [];

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nextParentFolder = parentFolder || entry.name;
      const nestedFiles = scanDirectory(
        rootName,
        fullPath,
        nextParentFolder,
        existingFilesMap,
      );
      files.push(...nestedFiles);
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

    const mediaFile = scanMediaFile(
      rootName,
      parentFolder,
      fullPath,
      stats,
      existingFilesMap,
    );
    files.push(mediaFile);
  }

  return files;
}

module.exports = {
  scanDirectory,
};
