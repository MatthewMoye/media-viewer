import express from "express";
import { listMediaFiles, listMediaFolders, searchFiles } from "../database/media-database.js";

const filesRouter = express.Router();

filesRouter.get("/api/files", (request, response) => {
  const excludeFoldersParam =
    typeof request.query.excludeFolders === "string" ? request.query.excludeFolders : "";

  const excludeFolders = excludeFoldersParam
    .split(",")
    .map((folder) => folder.trim())
    .filter(Boolean);

  const result = listMediaFiles({
    page: request.query.page,
    pageSize: request.query.pageSize,
    search: request.query.search,
    type: request.query.type,
    includeFolder: request.query.includeFolder,
    excludeFolders,
    randomSeed: request.query.randomSeed,
  });

  const folders = listMediaFolders().map((entry) => entry.parent_folder || "Unknown");

  response.json({
    ...result,
    folders,
  });
});

filesRouter.get("/search", (request, response) => {
  const query = typeof request.query.q === "string" ? request.query.q : "";

  const files = searchFiles(query);

  response.json(files);
});

export { filesRouter };
