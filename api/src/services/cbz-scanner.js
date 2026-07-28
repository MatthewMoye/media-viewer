const fs = require("node:fs");
const path = require("node:path");
const AdmZip = require("adm-zip");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
]);

function parseComicInfo(xmlContent) {
  function getField(tag) {
    const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xmlContent);
    return match ? match[1].trim() || null : null;
  }

  const yearRaw = getField("Year");
  const monthRaw = getField("Month");
  const dayRaw = getField("Day");
  const pageCountRaw = getField("PageCount");

  return {
    title: getField("Title"),
    year: yearRaw ? Number.parseInt(yearRaw, 10) : null,
    month: monthRaw ? Number.parseInt(monthRaw, 10) : null,
    day: dayRaw ? Number.parseInt(dayRaw, 10) : null,
    writer: getField("Writer"),
    genre: getField("Genre"),
    tags: getField("Tags"),
    web: getField("Web"),
    series: getField("Series"),
    format: getField("Format"),
    pageCount: pageCountRaw ? Number.parseInt(pageCountRaw, 10) : null,
  };
}

function isImageEntry(entryName) {
  return IMAGE_EXTENSIONS.has(path.extname(entryName).toLowerCase());
}

function scanCbzFile(rootName, parentFolder, fullPath, stats, existingComicsMap = null) {
  // Check if file hasn't changed
  if (existingComicsMap && existingComicsMap.has(fullPath)) {
    const existing = existingComicsMap.get(fullPath);
    if (existing.modified === stats.mtimeMs) {
      // File hasn't changed, return existing data
      return {
        root: existing.root,
        parentFolder: existing.parent_folder,
        fullPath: existing.full_path,
        filename: existing.filename,
        size: existing.size,
        modified: existing.modified,
        coverEntry: existing.cover_entry,
        title: existing.title,
        year: existing.year,
        month: existing.month,
        day: existing.day,
        writer: existing.writer,
        genre: existing.genre,
        tags: existing.tags,
        web: existing.web,
        series: existing.series,
        format: existing.format,
        pageCount: existing.page_count,
        fullyScanned: false,
      };
    }
  }

  let zip;

  try {
    zip = new AdmZip(fullPath);
  } catch (error) {
    console.warn(`Could not open CBZ file ${fullPath}:`, error.message);
    return null;
  }

  const entries = zip.getEntries();

  const comicInfoEntry = entries.find((e) => {
    const name = path.basename(e.entryName).toLowerCase();
    return name === "comicinfo.xml";
  });

  let metadata = {};

  if (comicInfoEntry) {
    try {
      const xmlContent = comicInfoEntry.getData().toString("utf8");
      metadata = parseComicInfo(xmlContent);
    } catch (error) {
      console.warn(`Could not parse ComicInfo.xml in ${fullPath}:`, error.message);
    }
  }

  const coverEntry = entries
    .filter((e) => !e.isDirectory && isImageEntry(e.entryName))
    .map((e) => e.entryName)
    .sort()[0] ?? null;

  return {
    root: rootName,
    parentFolder,
    fullPath,
    filename: path.basename(fullPath),
    size: stats.size,
    modified: stats.mtimeMs,
    coverEntry,
    ...metadata,
    fullyScanned: true,
  };
}

function scanCbzDirectory(rootName, directory, parentFolder = null, existingComicsMap = null) {
  if (!fs.existsSync(directory)) {
    console.warn(`CBZ directory does not exist: ${directory}`);
    return [];
  }

  const comics = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const subComics = scanCbzDirectory(rootName, fullPath, parentFolder || entry.name, existingComicsMap);
      comics.push(...subComics);
      continue;
    }

    if (!entry.isFile()) continue;

    if (path.extname(entry.name).toLowerCase() !== ".cbz") continue;

    try {
      const stats = fs.statSync(fullPath);
      const comic = scanCbzFile(rootName, parentFolder || "", fullPath, stats, existingComicsMap);
      if (comic) {
        comics.push(comic);
      }
    } catch (error) {
      console.warn(`Failed to scan ${fullPath}:`, error.message);
    }
  }

  return comics;
}

module.exports = { scanCbzDirectory };
