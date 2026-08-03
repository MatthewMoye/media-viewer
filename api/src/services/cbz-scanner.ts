import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { parseComicInfo } from "./cbz/parse-comic-info.js";
import { findCoverEntry } from "./cbz/find-cover-entry.js";

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

  const coverEntry = findCoverEntry(entries);

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
      const subComics = scanCbzDirectory(
        rootName,
        fullPath,
        parentFolder || entry.name,
        existingComicsMap,
      );
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

export { scanCbzDirectory };
