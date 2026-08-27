import express from "express";
import {
  listMediaRoots,
  listComicRoots,
  addMediaRoot,
  addComicRoot,
  removeMediaRoot,
  removeComicRoot,
} from "../services/root-manager.js";
import { getLibraryRescanStatus } from "../services/library-scanner.js";
import { renderAdminPage } from "../views/admin-page.js";
import { handleRescan, runRootMutation } from "./helpers/admin-root-actions.js";
import { getDirectoryListing } from "./helpers/directory-browser.js";

const adminRouter = express.Router();

adminRouter.get("/", (request, response) => {
  const mediaRoots = listMediaRoots();
  const comicRoots = listComicRoots();
  const message = typeof request.query.message === "string" ? request.query.message : "";
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

adminRouter.get("/api/admin/rescan/status", (request, response) => {
  response.json(getLibraryRescanStatus());
});

adminRouter.get("/api/admin/browse-dirs", async (request, response) => {
  try {
    const requestedPath = typeof request.query.path === "string" ? request.query.path : "";
    response.json(await getDirectoryListing(requestedPath));
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

adminRouter.post("/roots/media/add", (request, response) => {
  runRootMutation(
    response,
    () => addMediaRoot(request.body.name, request.body.path),
    () => "Media directory added.",
  );
});

adminRouter.post("/roots/media/remove", (request, response) => {
  runRootMutation(
    response,
    () => removeMediaRoot(request.body.path),
    () => "Media directory removed.",
  );
});

adminRouter.post("/roots/comics/add", (request, response) => {
  runRootMutation(
    response,
    () => addComicRoot(request.body.name, request.body.path),
    () => "Comic directory added.",
  );
});

adminRouter.post("/roots/comics/remove", (request, response) => {
  runRootMutation(
    response,
    () => removeComicRoot(request.body.path),
    () => "Comic directory removed.",
  );
});

export { adminRouter };
