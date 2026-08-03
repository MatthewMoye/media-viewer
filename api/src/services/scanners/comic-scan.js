const {
  insertComic,
  getExistingComics,
  deleteComicByPath,
} = require("../../database/media-database");
const { scanCbzDirectory } = require("../cbz-scanner");

function rescanComics(comicRoots) {
  const existingComics = getExistingComics();
  const existingComicsMap = new Map(
    existingComics.map((comic) => [comic.full_path, comic]),
  );

  const allComics = [];
  const scannedPaths = new Set();
  let skipped = 0;

  for (const root of comicRoots) {
    console.log(`Scanning CBZ root "${root.name}": ${root.path}`);
    const comics = scanCbzDirectory(root.name, root.path, null, existingComicsMap);

    for (const comic of comics) {
      allComics.push(comic);
      scannedPaths.add(comic.fullPath);
      if (!comic.fullyScanned) {
        skipped += 1;
      }
    }
  }

  for (const fullPath of existingComicsMap.keys()) {
    if (!scannedPaths.has(fullPath)) {
      deleteComicByPath(fullPath);
    }
  }

  for (const comic of allComics) {
    insertComic(comic);
  }

  return {
    total: allComics.length,
    skipped,
    rescanned: allComics.length - skipped,
  };
}

module.exports = {
  rescanComics,
};
