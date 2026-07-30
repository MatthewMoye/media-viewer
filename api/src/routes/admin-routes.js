const express = require("express");
const { rescanLibrary } = require("../services/library-scanner");
const {
  listMediaRoots,
  listComicRoots,
  addMediaRoot,
  addComicRoot,
  removeMediaRoot,
  removeComicRoot,
} = require("../services/root-manager");

const adminRouter = express.Router();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRootItems(roots, type) {
  if (roots.length === 0) {
    return `<li>No ${type} directories configured.</li>`;
  }

  return roots
    .map(
      (root) => `
        <li>
          <strong>${escapeHtml(root.name)}</strong>
          <div>${escapeHtml(root.path)}</div>
          <form method="post" action="/roots/${type}/remove">
            <input type="hidden" name="path" value="${escapeHtml(root.path)}" />
            <button type="submit">Remove</button>
          </form>
        </li>
      `,
    )
    .join("");
}

function redirectWithMessage(response, message, type = "success") {
  const params = new URLSearchParams({ message, type });
  response.redirect(`/?${params.toString()}`);
}

adminRouter.get("/", (request, response) => {
  const mediaRoots = listMediaRoots();
  const comicRoots = listComicRoots();
  const message = request.query.message ? escapeHtml(request.query.message) : "";
  const messageType = request.query.type === "error" ? "error" : "success";
  const messageClass = messageType === "error" ? "message error" : "message success";

  response.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title>Library Admin</title>
        <style>
          :root {
            color-scheme: dark;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 24px;
            background: #111418;
            color: #e8edf2;
            font-family: Segoe UI, Arial, sans-serif;
          }

          .container {
            width: min(900px, 100%);
            background: #1a2027;
            border: 1px solid #2a323b;
            border-radius: 14px;
            padding: 24px;
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
          }

          h1 {
            margin: 0 0 16px;
            font-size: 1.7rem;
          }

          h2 {
            margin: 22px 0 10px;
            font-size: 1.1rem;
          }

          form {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 0 0 10px;
          }

          label {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 180px;
            flex: 1;
            font-size: 0.9rem;
          }

          input[type="text"] {
            width: 100%;
            padding: 8px 10px;
            border-radius: 8px;
            border: 1px solid #364250;
            background: #11161d;
            color: #e8edf2;
          }

          button {
            border: none;
            border-radius: 8px;
            background: #2d6cdf;
            color: #fff;
            padding: 9px 14px;
            font-weight: 600;
            cursor: pointer;
            align-self: flex-end;
          }

          button:hover {
            background: #3a79eb;
          }

          ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: grid;
            gap: 10px;
          }

          li {
            background: #10151c;
            border: 1px solid #2a323b;
            border-radius: 10px;
            padding: 12px;
          }

          li > div {
            margin: 4px 0 10px;
            color: #b6c2d0;
            word-break: break-all;
          }

          li form {
            margin: 0;
          }

          li form button {
            background: #a84545;
          }

          li form button:hover {
            background: #bf5353;
          }

          .message {
            border-radius: 8px;
            padding: 10px 12px;
            margin: 0 0 14px;
            font-weight: 600;
          }

          .message.success {
            background: rgba(43, 124, 62, 0.2);
            border: 1px solid #2b7c3e;
            color: #97e6a9;
          }

          .message.error {
            background: rgba(158, 47, 47, 0.2);
            border: 1px solid #9e2f2f;
            color: #ffb0b0;
          }
        </style>
      </head>

      <body>
        <main class="container">
        <h1>Library Admin</h1>

        ${
          message
            ? `<p class="${messageClass}">${message}</p>`
            : ""
        }

        <form method="post" action="/rescan">
          <button type="submit">Rescan library</button>
        </form>

        <h2>Media directories</h2>
        <form method="post" action="/roots/media/add">
          <label>
            Name
            <input type="text" name="name" required />
          </label>
          <label>
            Path
            <input type="text" name="path" required />
          </label>
          <button type="submit">Add media directory</button>
        </form>
        <ul>
          ${renderRootItems(mediaRoots, "media")}
        </ul>

        <h2>Comic directories</h2>
        <form method="post" action="/roots/comics/add">
          <label>
            Name
            <input type="text" name="name" required />
          </label>
          <label>
            Path
            <input type="text" name="path" required />
          </label>
          <button type="submit">Add comic directory</button>
        </form>
        <ul>
          ${renderRootItems(comicRoots, "comics")}
        </ul>
        </main>
      </body>
    </html>
  `);
});

adminRouter.post("/rescan", (request, response, next) => {
  try {
    rescanLibrary();
    redirectWithMessage(response, "Library rescan started and completed.");
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/roots/media/add", (request, response) => {
  try {
    addMediaRoot(request.body.name, request.body.path);
    const fileCount = rescanLibrary();
    redirectWithMessage(response, `Media directory added. Rescan complete (${fileCount} files indexed).`);
  } catch (error) {
    redirectWithMessage(response, error.message, "error");
  }
});

adminRouter.post("/roots/media/remove", (request, response) => {
  try {
    removeMediaRoot(request.body.path);
    const fileCount = rescanLibrary();
    redirectWithMessage(response, `Media directory removed. Rescan complete (${fileCount} files indexed).`);
  } catch (error) {
    redirectWithMessage(response, error.message, "error");
  }
});

adminRouter.post("/roots/comics/add", (request, response) => {
  try {
    addComicRoot(request.body.name, request.body.path);
    const fileCount = rescanLibrary();
    redirectWithMessage(response, `Comic directory added. Rescan complete (${fileCount} files indexed).`);
  } catch (error) {
    redirectWithMessage(response, error.message, "error");
  }
});

adminRouter.post("/roots/comics/remove", (request, response) => {
  try {
    removeComicRoot(request.body.path);
    const fileCount = rescanLibrary();
    redirectWithMessage(response, `Comic directory removed. Rescan complete (${fileCount} files indexed).`);
  } catch (error) {
    redirectWithMessage(response, error.message, "error");
  }
});

module.exports = {
  adminRouter,
};
