import fs from "node:fs/promises";
import path from "node:path";

async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function listWindowsDrives() {
  const letters = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
  const checks = await Promise.all(
    letters.map(async (letter) => {
      const drivePath = `${letter}:\\`;
      return (await pathExists(drivePath)) ? { name: `${letter}:`, path: drivePath } : null;
    }),
  );

  return checks.filter((drive) => drive !== null);
}

async function getDirectoryListing(requestedPath) {
  const isWindows = process.platform === "win32";

  // Empty path means "show drive list" on Windows, or filesystem root elsewhere.
  if (!requestedPath) {
    if (isWindows) {
      return { currentPath: "", parentPath: null, directories: await listWindowsDrives() };
    }

    requestedPath = "/";
  }

  const resolved = path.resolve(requestedPath);
  const stats = await fs.stat(resolved);

  if (!stats.isDirectory()) {
    throw new Error("Path is not a directory.");
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, path: path.join(resolved, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const parent = path.dirname(resolved);
  const atRoot = parent === resolved;

  return {
    currentPath: resolved,
    parentPath: atRoot ? (isWindows ? "" : null) : parent,
    directories,
  };
}

export { getDirectoryListing };

