const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(PROJECT_ROOT, ".env");

if (fs.existsSync(ENV_PATH)) {
  loadEnvFile(ENV_PATH);
}

function parsePort(value) {
  const port = Number.parseInt(value ?? "3000", 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function parsePositiveInteger(value, fallback, settingName) {
  const parsed = Number.parseInt(value ?? String(fallback), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${settingName} value: ${value}`);
  }

  return parsed;
}

function parseMediaRoots(value) {
  if (!value) {
    throw new Error("MEDIA_ROOTS is required in the .env file.");
  }

  let roots;

  try {
    roots = JSON.parse(value);
  } catch (error) {
    throw new Error(`MEDIA_ROOTS must be valid JSON. ${error.message}`);
  }

  if (!Array.isArray(roots) || roots.length === 0) {
    throw new Error("MEDIA_ROOTS must contain at least one root.");
  }

  return roots.map((root, index) => {
    if (
      !root ||
      typeof root.name !== "string" ||
      root.name.trim() === "" ||
      typeof root.path !== "string" ||
      root.path.trim() === ""
    ) {
      throw new Error(
        `MEDIA_ROOTS entry ${index + 1} must have a name and path.`,
      );
    }

    return {
      name: root.name.trim(),
      path: path.resolve(root.path.trim()),
    };
  });
}

function resolveProjectPath(value, fallback) {
  const configuredPath = value?.trim() || fallback;

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(PROJECT_ROOT, configuredPath);
}

function parseCbzRoots(value) {
  if (!value) return [];

  let roots;

  try {
    roots = JSON.parse(value);
  } catch (error) {
    throw new Error(`CBZ_ROOTS must be valid JSON. ${error.message}`);
  }

  if (!Array.isArray(roots)) {
    throw new Error("CBZ_ROOTS must be a JSON array.");
  }

  return roots.map((root, index) => {
    if (
      !root ||
      typeof root.name !== "string" ||
      root.name.trim() === "" ||
      typeof root.path !== "string" ||
      root.path.trim() === ""
    ) {
      throw new Error(
        `CBZ_ROOTS entry ${index + 1} must have a name and path.`,
      );
    }

    return {
      name: root.name.trim(),
      path: path.resolve(root.path.trim()),
    };
  });
}

function parseAuthCredentials() {
  const username = process.env.AUTH_USER?.trim();
  const password = process.env.AUTH_PASS?.trim();
  const secret = process.env.AUTH_SECRET?.trim();

  if (!username || !password || !secret) {
    throw new Error(
      "AUTH_USER, AUTH_PASS, and AUTH_SECRET are required in .env",
    );
  }

  return { username, password, secret };
}

const config = {
  projectRoot: PROJECT_ROOT,
  port: parsePort(process.env.PORT),
  host: process.env.HOST?.trim() || "localhost",
  thumbnailWorkerCount: parsePositiveInteger(
    process.env.THUMBNAIL_WORKER_COUNT,
    2,
    "THUMBNAIL_WORKER_COUNT",
  ),
  databasePath: resolveProjectPath(process.env.DATABASE_PATH, "library.db"),
  get thumbnailsPath() {
    return path.join(this.cachePath, "thumbnails");
  },
  get comicCachePath() {
    return path.join(this.cachePath, "comics");
  },
  cachePath: resolveProjectPath(process.env.CACHE_PATH, "cache"),
  mediaRoots: parseMediaRoots(process.env.MEDIA_ROOTS),
  cbzRoots: parseCbzRoots(process.env.CBZ_ROOTS),
  auth: parseAuthCredentials(),
};

module.exports = { config };
