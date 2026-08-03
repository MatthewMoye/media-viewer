const { database } = require("./db");
const { initializeSchema } = require("./schema");

initializeSchema();

const filesRepository = require("./repositories/files-repository");
const comicsRepository = require("./repositories/comics-repository");

function beginTransaction() {
  database.exec("BEGIN");
}

function commitTransaction() {
  database.exec("COMMIT");
}

function rollbackTransaction() {
  database.exec("ROLLBACK");
}

module.exports = {
  beginTransaction,
  commitTransaction,
  rollbackTransaction,

  clearFiles: filesRepository.clearFiles,
  insertFile: filesRepository.insertFile,
  getFileCount: filesRepository.getFileCount,
  listMediaFiles: filesRepository.listMediaFiles,
  listMediaFolders: filesRepository.listMediaFolders,
  listAllFiles: filesRepository.listAllFiles,
  searchFiles: filesRepository.searchFiles,
  findFileForStreaming: filesRepository.findFileForStreaming,
  findFileForThumbnail: filesRepository.findFileForThumbnail,
  markThumbnailGenerated: filesRepository.markThumbnailGenerated,
  getExistingFiles: filesRepository.getExistingFiles,
  deleteFileByPath: filesRepository.deleteFileByPath,
  listThumbnailCandidates: filesRepository.listThumbnailCandidates,

  insertComic: comicsRepository.insertComic,
  clearComics: comicsRepository.clearComics,
  listComics: comicsRepository.listComics,
  listComicAuthors: comicsRepository.listComicAuthors,
  listComicTagSources: comicsRepository.listComicTagSources,
  findComicById: comicsRepository.findComicById,
  markComicThumbnailGenerated: comicsRepository.markComicThumbnailGenerated,
  listComicThumbnailCandidates: comicsRepository.listComicThumbnailCandidates,
  getExistingComics: comicsRepository.getExistingComics,
  deleteComicByPath: comicsRepository.deleteComicByPath,
};
