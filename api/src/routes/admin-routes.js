const express = require("express");
const {
  listMediaRoots,
  listComicRoots,
  addMediaRoot,
  addComicRoot,
  removeMediaRoot,
  removeComicRoot,
} = require("../services/root-manager");
const { renderAdminPage } = require("../views/admin-page");
const {
  handleRescan,
  runRootMutation,
} = require("./helpers/admin-root-actions");

const adminRouter = express.Router();

adminRouter.get("/", (request, response) => {
  const mediaRoots = listMediaRoots();
  const comicRoots = listComicRoots();
  const message =
    typeof request.query.message === "string" ? request.query.message : "";
  const messageType = request.query.type === "error" ? "error" : "success";

  response.send(
    renderAdminPage({
      mediaRoots,
      comicRoots,
      message,
      messageType,
    }),
  );
});

adminRouter.post("/rescan", handleRescan);

adminRouter.post("/roots/media/add", (request, response) => {
  runRootMutation(
    response,
    () => addMediaRoot(request.body.name, request.body.path),
    (fileCount) => `Media directory added. Rescan complete (${fileCount} files indexed).`,
  );
});

adminRouter.post("/roots/media/remove", (request, response) => {
  runRootMutation(
    response,
    () => removeMediaRoot(request.body.path),
    (fileCount) => `Media directory removed. Rescan complete (${fileCount} files indexed).`,
  );
});

adminRouter.post("/roots/comics/add", (request, response) => {
  runRootMutation(
    response,
    () => addComicRoot(request.body.name, request.body.path),
    (fileCount) => `Comic directory added. Rescan complete (${fileCount} files indexed).`,
  );
});

adminRouter.post("/roots/comics/remove", (request, response) => {
  runRootMutation(
    response,
    () => removeComicRoot(request.body.path),
    (fileCount) => `Comic directory removed. Rescan complete (${fileCount} files indexed).`,
  );
});

module.exports = {
  adminRouter,
};
