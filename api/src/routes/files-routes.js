const express = require("express");
const { listMediaFiles, searchFiles } = require("../database/media-database");

const filesRouter = express.Router();

filesRouter.get("/api/files", (request, response) => {
  const files = listMediaFiles();

  response.json(files);
});

filesRouter.get("/search", (request, response) => {
  const query = typeof request.query.q === "string" ? request.query.q : "";

  const files = searchFiles(query);

  response.json(files);
});

module.exports = {
  filesRouter,
};
