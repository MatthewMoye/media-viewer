import { database } from "./db.js";
import { initializeSchema } from "./schema.js";

initializeSchema();

function beginTransaction() {
  database.exec("BEGIN");
}

function commitTransaction() {
  database.exec("COMMIT");
}

function rollbackTransaction() {
  database.exec("ROLLBACK");
}

export { beginTransaction, commitTransaction, rollbackTransaction };

export {
  clearFiles,
  insertFile,
  getFileCount,
  listMediaFiles,
  listMediaFolders,
  listAllFiles,
  searchFiles,
  findFileForStreaming,
  findFileForThumbnail,
  markThumbnailGenerated,
  getExistingFiles,
  deleteFileByPath,
  listThumbnailCandidates,
} from "./repositories/files-repository.js";

export {
  insertComic,
  clearComics,
  listComics,
  listComicAuthors,
  listComicTagSources,
  findComicById,
  markComicThumbnailGenerated,
  listComicThumbnailCandidates,
  getExistingComics,
  deleteComicByPath,
} from "./repositories/comics-repository.js";
