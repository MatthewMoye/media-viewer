import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

const ROOTS_FILE_PATH = path.join(config.cachePath, "roots.json");

function cloneRoots(roots) {
  return roots.map((root) => ({
    name: root.name,
    path: root.path,
  }));
}

function normalizeRoot(name, rootPath) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Directory name is required.");
  }

  if (typeof rootPath !== "string" || rootPath.trim() === "") {
    throw new Error("Directory path is required.");
  }

  return {
    name: name.trim(),
    path: path.resolve(rootPath.trim()),
  };
}

function pathEquals(a, b) {
  if (process.platform === "win32") {
    return a.toLowerCase() === b.toLowerCase();
  }

  return a === b;
}

function hasPath(roots, targetPath) {
  return roots.some((root) => pathEquals(root.path, targetPath));
}

function normalizeRootList(roots, label) {
  if (!Array.isArray(roots)) {
    throw new Error(`${label} must be an array.`);
  }

  return roots.map((root, index) => {
    if (!root || typeof root !== "object") {
      throw new Error(`${label} entry ${index + 1} must be an object.`);
    }

    return normalizeRoot(root.name, root.path);
  });
}

function mergeUniqueRoots(existingRoots, rootsToAdd, preferAddedName = false) {
  const merged = cloneRoots(existingRoots);

  for (const root of rootsToAdd) {
    const existingIndex = merged.findIndex((entry) => pathEquals(entry.path, root.path));

    if (existingIndex === -1) {
      merged.push(root);
      continue;
    }

    if (preferAddedName) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        name: root.name,
      };
    }
  }

  return merged;
}

function saveState(nextState) {
  fs.mkdirSync(config.cachePath, { recursive: true });

  const payload = {
    mediaRoots: nextState.mediaRoots,
    comicRoots: nextState.comicRoots,
  };

  const json = JSON.stringify(payload, null, 2);
  const tempPath = `${ROOTS_FILE_PATH}.tmp`;

  fs.writeFileSync(tempPath, json, "utf8");
  fs.renameSync(tempPath, ROOTS_FILE_PATH);
}

function loadState() {
  const envMediaRoots = cloneRoots(config.mediaRoots);
  const envComicRoots = cloneRoots(config.cbzRoots);

  if (!fs.existsSync(ROOTS_FILE_PATH)) {
    const defaults = {
      mediaRoots: envMediaRoots,
      comicRoots: envComicRoots,
    };

    saveState(defaults);
    return defaults;
  }

  try {
    const fileContent = fs.readFileSync(ROOTS_FILE_PATH, "utf8");
    const parsed = JSON.parse(fileContent);

    const savedMediaRoots = normalizeRootList(parsed.mediaRoots ?? [], "Saved media roots");
    const savedComicRoots = normalizeRootList(parsed.comicRoots ?? [], "Saved comic roots");

    // Always include .env roots so env-driven configuration is respected.
    const mergedMediaRoots = mergeUniqueRoots(savedMediaRoots, envMediaRoots, true);
    const mergedComicRoots = mergeUniqueRoots(savedComicRoots, envComicRoots, true);

    const mergedState = {
      mediaRoots: mergedMediaRoots,
      comicRoots: mergedComicRoots,
    };

    const savedStateJson = JSON.stringify({
      mediaRoots: savedMediaRoots,
      comicRoots: savedComicRoots,
    });
    const mergedStateJson = JSON.stringify(mergedState);

    if (savedStateJson !== mergedStateJson) {
      saveState(mergedState);
    }

    return mergedState;
  } catch (error) {
    console.warn(`Failed to read ${ROOTS_FILE_PATH}. Falling back to .env roots: ${error.message}`);

    const fallback = {
      mediaRoots: envMediaRoots,
      comicRoots: envComicRoots,
    };

    saveState(fallback);
    return fallback;
  }
}

const state = loadState();

function listMediaRoots() {
  return cloneRoots(state.mediaRoots);
}

function listComicRoots() {
  return cloneRoots(state.comicRoots);
}

function addMediaRoot(name, rootPath) {
  const root = normalizeRoot(name, rootPath);

  if (hasPath(state.mediaRoots, root.path)) {
    throw new Error("Media directory already exists.");
  }

  state.mediaRoots.push(root);
  saveState(state);
  return root;
}

function addComicRoot(name, rootPath) {
  const root = normalizeRoot(name, rootPath);

  if (hasPath(state.comicRoots, root.path)) {
    throw new Error("Comic directory already exists.");
  }

  state.comicRoots.push(root);
  saveState(state);
  return root;
}

function removeMediaRoot(rootPath) {
  if (typeof rootPath !== "string" || rootPath.trim() === "") {
    throw new Error("Directory path is required.");
  }

  const resolvedPath = path.resolve(rootPath.trim());
  const nextRoots = state.mediaRoots.filter((root) => !pathEquals(root.path, resolvedPath));

  if (nextRoots.length === state.mediaRoots.length) {
    throw new Error("Media directory not found.");
  }

  state.mediaRoots = nextRoots;
  saveState(state);
}

function removeComicRoot(rootPath) {
  if (typeof rootPath !== "string" || rootPath.trim() === "") {
    throw new Error("Directory path is required.");
  }

  const resolvedPath = path.resolve(rootPath.trim());
  const nextRoots = state.comicRoots.filter((root) => !pathEquals(root.path, resolvedPath));

  if (nextRoots.length === state.comicRoots.length) {
    throw new Error("Comic directory not found.");
  }

  state.comicRoots = nextRoots;
  saveState(state);
}

export {
  listMediaRoots,
  listComicRoots,
  addMediaRoot,
  addComicRoot,
  removeMediaRoot,
  removeComicRoot,
};
