const express = require("express");
const { listAllFiles } = require("../database/media-database");
const { rescanLibrary } = require("../services/library-scanner");

const adminRouter = express.Router();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

adminRouter.get("/", (request, response) => {
  const files = listAllFiles();

  const fileItems = files
    .map(
      (file) => `
        <li>
          [${escapeHtml(file.root)}]
          (${escapeHtml(file.type)})
          <a href="/file/${file.id}">
            ${escapeHtml(file.filename)}
          </a>
        </li>
      `,
    )
    .join("");

  response.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title>Indexed Files</title>
      </head>

      <body>
        <h1>Indexed Files</h1>

        <form method="post" action="/rescan">
          <button type="submit">Rescan library</button>
        </form>

        <ul>
          ${fileItems}
        </ul>
      </body>
    </html>
  `);
});

adminRouter.post("/rescan", (request, response, next) => {
  try {
    rescanLibrary();
    response.redirect("/");
  } catch (error) {
    next(error);
  }
});

module.exports = {
  adminRouter,
};
