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

function renderAdminPage({ mediaRoots, comicRoots, message, messageType }) {
  const escapedMessage = message ? escapeHtml(message) : "";
  const resolvedMessageType = messageType === "error" ? "error" : "success";
  const messageClass = resolvedMessageType === "error" ? "message error" : "message success";

  return `
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

          button.secondary {
            background: #364250;
          }

          button.secondary:hover {
            background: #445064;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 24px;
            z-index: 10;
          }

          .modal-overlay.hidden {
            display: none;
          }

          .modal {
            width: min(560px, 100%);
            max-height: 80vh;
            background: #1a2027;
            border: 1px solid #2a323b;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .modal-header {
            font-size: 0.85rem;
            color: #b6c2d0;
            word-break: break-all;
          }

          .dir-list {
            list-style: none;
            margin: 0;
            padding: 0;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .dir-entry {
            padding: 8px 10px;
            border-radius: 6px;
            background: #10151c;
            cursor: pointer;
          }

          .dir-entry:hover {
            background: #232b35;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
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

        ${escapedMessage ? `<p class="${messageClass}">${escapedMessage}</p>` : ""}

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
            <input type="text" name="path" id="media-path" required />
          </label>
          <button type="button" class="secondary browse-btn" data-target="media-path">Browse&hellip;</button>
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
            <input type="text" name="path" id="comic-path" required />
          </label>
          <button type="button" class="secondary browse-btn" data-target="comic-path">Browse&hellip;</button>
          <button type="submit">Add comic directory</button>
        </form>
        <ul>
          ${renderRootItems(comicRoots, "comics")}
        </ul>
        </main>

        <div id="dir-browser-modal" class="modal-overlay hidden">
          <div class="modal">
            <div class="modal-header" id="dir-browser-current-path"></div>
            <ul class="dir-list" id="dir-browser-list"></ul>
            <div class="modal-actions">
              <button type="button" class="secondary" id="dir-browser-cancel">Cancel</button>
              <button type="button" id="dir-browser-select">Select this folder</button>
            </div>
          </div>
        </div>

        <script>
          (function () {
            var modal = document.getElementById("dir-browser-modal");
            var listEl = document.getElementById("dir-browser-list");
            var currentPathEl = document.getElementById("dir-browser-current-path");
            var selectBtn = document.getElementById("dir-browser-select");
            var cancelBtn = document.getElementById("dir-browser-cancel");
            var activeInput = null;
            var currentPath = "";

            function loadDirectory(targetPath) {
              var url = "/api/admin/browse-dirs?path=" + encodeURIComponent(targetPath || "");

              fetch(url)
                .then(function (res) {
                  if (!res.ok) {
                    return res.json().then(function (body) {
                      throw new Error(body.error || "Failed to load directory");
                    });
                  }
                  return res.json();
                })
                .then(function (data) {
                  currentPath = data.currentPath;
                  currentPathEl.textContent = data.currentPath || "Select a drive";
                  listEl.innerHTML = "";

                  if (data.parentPath !== null && data.parentPath !== undefined) {
                    var upItem = document.createElement("li");
                    upItem.textContent = "..";
                    upItem.className = "dir-entry";
                    upItem.addEventListener("click", function () {
                      loadDirectory(data.parentPath);
                    });
                    listEl.appendChild(upItem);
                  }

                  data.directories.forEach(function (dir) {
                    var item = document.createElement("li");
                    item.textContent = dir.name;
                    item.className = "dir-entry";
                    item.addEventListener("click", function () {
                      loadDirectory(dir.path);
                    });
                    listEl.appendChild(item);
                  });
                })
                .catch(function (error) {
                  listEl.innerHTML = "";
                  var errorItem = document.createElement("li");
                  errorItem.textContent = error.message;
                  listEl.appendChild(errorItem);
                });
            }

            document.querySelectorAll(".browse-btn").forEach(function (button) {
              button.addEventListener("click", function () {
                activeInput = document.getElementById(button.dataset.target);
                modal.classList.remove("hidden");
                loadDirectory(activeInput.value || "");
              });
            });

            selectBtn.addEventListener("click", function () {
              if (activeInput) {
                activeInput.value = currentPath;
              }
              modal.classList.add("hidden");
            });

            cancelBtn.addEventListener("click", function () {
              modal.classList.add("hidden");
            });
          })();
        </script>
      </body>
    </html>
  `;
}

export { renderAdminPage };
